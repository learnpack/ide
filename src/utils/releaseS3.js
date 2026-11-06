// Shared S3 helpers for the release scripts (uploadLearnpack.js, uploadRelease.js, preflight.js).
require('dotenv').config()
const fs = require('fs')
const path = require('path')
const {
    S3Client,
    PutObjectCommand,
    HeadObjectCommand,
    ListObjectsV2Command
} = require('@aws-sdk/client-s3')

// Where IDE tarballs and their manifest live in the bucket (served by CloudFront).
const IDE_PREFIX = 'learnpack/ide/'
const MANIFEST_KEY = `${IDE_PREFIX}versions.json`
const RELEASE_TAGS = ['latest', 'next']
const REQUIRED_ENV = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'BUCKET_NAME', 'CLOUDFRONT_DOMAIN']

const CACHE_NO_CACHE = 'no-cache'
const CACHE_IMMUTABLE = 'public, max-age=31536000, immutable'

const tarballName = (version) => `learnpack-${version}.tar.gz`
const tarballKey = (version) => `${IDE_PREFIX}${tarballName(version)}`
const localTarballPath = (version) => path.resolve(__dirname, '..', '..', 'bin', tarballName(version))
const fileUrl = (key) => `https://${process.env.CLOUDFRONT_DOMAIN}/${key}`

function getVersion() {
    const { version } = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', '..', 'package.json'), 'utf8'))
    if (typeof version !== 'string' || !/^\d+\.\d+\.\d+$/.test(version)) {
        throw new Error(`Invalid version in package.json: ${version}`)
    }
    return version
}

function getReleaseTag() {
    const tag = (process.env.RELEASE_TAG || '').trim().toLowerCase()
    if (!RELEASE_TAGS.includes(tag)) {
        throw new Error('RELEASE_TAG must be "latest" or "next". Run the release with ./autoUpload.sh --tag latest|next')
    }
    return tag
}

function missingEnv() {
    return REQUIRED_ENV.filter((name) => !process.env[name])
}

let client = null
function s3() {
    if (!client) {
        client = new S3Client({
            region: process.env.AWS_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            }
        })
    }
    return client
}

async function uploadFile({ filePath, body, key, contentType, cacheControl = CACHE_NO_CACHE }) {
    const content = body !== undefined ? body : fs.readFileSync(filePath)
    await s3().send(new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: key,
        Body: content,
        ContentType: contentType,
        Metadata: {
            'Content-Type': contentType
        },
        CacheControl: cacheControl,
        ContentSecurityPolicy: "default-src 'self'",
        CrossOriginResourcePolicy: 'cross-origin',
        AccessControlAllowOrigin: '*',
        AccessControlAllowMethods: 'GET',
        AccessControlAllowHeaders: 'Content-Type'
    }))
    const url = fileUrl(key)
    console.log(`✅ File ${key} uploaded successfully`)
    console.log(`📂 URL: ${url}`)
    return url
}

async function objectExists(key) {
    try {
        await s3().send(new HeadObjectCommand({ Bucket: process.env.BUCKET_NAME, Key: key }))
        return true
    } catch (error) {
        const status = error && error.$metadata && error.$metadata.httpStatusCode
        if (status === 404 || (error && error.name === 'NotFound')) return false
        if (status === 403) {
            throw new Error(
                `S3 denied access when checking ${key}. Without s3:ListBucket a missing object returns 403 instead of 404; ` +
                'the release key needs s3:ListBucket, s3:GetObject and s3:PutObject on the bucket.'
            )
        }
        throw error
    }
}

async function listTarballs() {
    const names = []
    let ContinuationToken
    do {
        const page = await s3().send(new ListObjectsV2Command({
            Bucket: process.env.BUCKET_NAME,
            Prefix: IDE_PREFIX,
            ContinuationToken
        }))
        for (const obj of page.Contents || []) {
            const name = obj.Key.slice(IDE_PREFIX.length)
            if (/^learnpack-\d+\.\d+\.\d+\.tar\.gz$/.test(name)) names.push(name)
        }
        ContinuationToken = page.IsTruncated ? page.NextContinuationToken : undefined
    } while (ContinuationToken)

    return names.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
}

module.exports = {
    IDE_PREFIX,
    MANIFEST_KEY,
    CACHE_NO_CACHE,
    CACHE_IMMUTABLE,
    tarballName,
    tarballKey,
    localTarballPath,
    fileUrl,
    getVersion,
    getReleaseTag,
    missingEnv,
    uploadFile,
    objectExists,
    listTarballs
}
