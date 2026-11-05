// Publishes the release metadata and, for latest, the IDE tarball and its manifest on CloudFront.
// Runs as the last step of `npm run build`; it can also run alone to upload an already built tarball:
//   RELEASE_TAG=latest node src/utils/uploadRelease.js
const fs = require('fs')
const { execSync } = require('child_process')
const {
    MANIFEST_KEY,
    CACHE_IMMUTABLE,
    CACHE_NO_CACHE,
    tarballKey,
    localTarballPath,
    getVersion,
    getReleaseTag,
    missingEnv,
    uploadFile,
    objectExists,
    listTarballs
} = require('./releaseS3')

const git = (args) => execSync(`git ${args}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()

async function main() {
    const tag = getReleaseTag()
    const version = getVersion()

    const missing = missingEnv()
    if (missing.length > 0) throw new Error(`missing variables in .env: ${missing.join(', ')}`)

    // Record what is published on this channel.
    const buildInfo = {
        version,
        branch: git('rev-parse --abbrev-ref HEAD'),
        commit: git('rev-parse HEAD'),
        builtAt: new Date().toISOString()
    }
    await uploadFile({
        body: JSON.stringify(buildInfo, null, 2),
        key: `learnpack/${tag}/build.json`,
        contentType: 'application/json',
        cacheControl: CACHE_NO_CACHE
    })

    // next only ships JS/CSS: the CLI always takes the highest version in the manifest,
    // so a next tarball there would reach every user.
    if (tag !== 'latest') {
        console.log('ℹ️  next release: no tarball or manifest is published')
        return
    }

    const tarPath = localTarballPath(version)
    if (!fs.existsSync(tarPath)) throw new Error(`${tarPath} does not exist. Run bin/publish.js first.`)

    const key = tarballKey(version)
    if (await objectExists(key)) {
        throw new Error(`${key} already exists. Published tarballs are immutable; bump the version with ./bump.sh.`)
    }

    // Tarball first, manifest last: the manifest never lists a tarball that is not uploaded yet.
    await uploadFile({
        filePath: tarPath,
        key,
        contentType: 'application/gzip',
        cacheControl: CACHE_IMMUTABLE
    })

    // Rebuilt from the bucket listing instead of read-modify-write: idempotent and self-repairing.
    const versions = await listTarballs()
    await uploadFile({
        body: JSON.stringify(versions, null, 2),
        key: MANIFEST_KEY,
        contentType: 'application/json',
        cacheControl: CACHE_NO_CACHE
    })
    console.log(`📋 Manifest lists ${versions.length} version(s); latest is ${versions[versions.length - 1]}`)
}

main()
    .then(() => console.log('\n🚀 Release published'))
    .catch((error) => {
        console.error(`\n❌ ${error.message}`)
        process.exit(1)
    })
