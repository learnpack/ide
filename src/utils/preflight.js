// Release preflight: runs before anything is built or uploaded, so a failed check
// leaves CloudFront untouched.
//   latest: must be on master, clean, in sync with origin, and the version must not be published yet.
//   next:   any branch, clean and pushed; no version check (next never publishes a tarball).
const { execSync } = require('child_process')
const {
    getVersion,
    getReleaseTag,
    missingEnv,
    objectExists,
    tarballKey
} = require('./releaseS3')

const red = (txt) => `\x1b[31m${txt}\x1b[0m`
const green = (txt) => `\x1b[32m${txt}\x1b[0m`

const git = (args) => execSync(`git ${args}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()

function fail(message) {
    console.error(red(`❌ Preflight failed: ${message}`))
    process.exit(1)
}

async function main() {
    let tag, version
    try {
        tag = getReleaseTag()
        version = getVersion()
    } catch (error) {
        fail(error.message)
    }

    const missing = missingEnv()
    if (missing.length > 0) fail(`missing variables in .env: ${missing.join(', ')}`)

    const branch = git('rev-parse --abbrev-ref HEAD')
    if (tag === 'latest' && branch !== 'master') {
        fail(`latest releases must run from master (current branch: ${branch}).`)
    }

    const dirty = git('status --porcelain --untracked-files=no')
    if (dirty) fail(`there are uncommitted changes:\n${dirty}`)

    try {
        git(`fetch origin ${branch}`)
    } catch (error) {
        fail(`could not fetch origin/${branch}. Is the branch pushed?\n${error.stderr || error.message}`)
    }
    const local = git('rev-parse HEAD')
    const remote = git(`rev-parse origin/${branch}`)
    if (local !== remote) {
        fail(`${branch} is not in sync with origin/${branch}. Pull or push before releasing.`)
    }

    if (tag === 'latest') {
        if (await objectExists(tarballKey(version))) {
            fail(`version ${version} is already published. Bump it with ./bump.sh, merge the PR and release again.`)
        }
    }

    console.log(green(`✅ Preflight OK: ${tag} release of ${version} from ${branch} (${local.slice(0, 7)})`))
}

main().catch((error) => fail(error.message))
