require('dotenv').config()
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3")
const fs = require('fs')
const path = require('path')
const prompt = require('prompt-sync')({ sigint: true })


// Get the version from the package.json
let version = require('../../package.json').version
// Kepp only the first part of the version
version = version.split('.')[0]

// Ask user for tag
let tag = ''
while (!['latest', 'next'].includes(tag)) {
    tag = prompt('¿A qué tag quieres subir los archivos? (latest/next): ').trim().toLowerCase()
    if (!['latest', 'next'].includes(tag)) {
        console.log('Por favor, escribe "latest" o "next".')
    }
}

// Initialize S3 Client
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
})

function findBuildFiles(startPath) {
    if (!fs.existsSync(startPath)) {
        throw new Error(`Directory ${startPath} does not exist. Typical human error!`)
    }

    const targetFiles = {
        js: 'app.js',
        css: 'app.css'
    }

    const results = {
        jsPath: null,
        cssPath: null
    }

    function searchDir(currentPath) {
        const files = fs.readdirSync(currentPath)

        for (const file of files) {
            const filePath = path.join(currentPath, file)
            const stat = fs.statSync(filePath)

            if (stat.isDirectory()) {
                searchDir(filePath)
            } else {
                if (file === targetFiles.js) {
                    results.jsPath = filePath
                }
                if (file === targetFiles.css) {
                    results.cssPath = filePath
                }
            }
        }
    }

    searchDir(startPath)
    return results
}

const makeFileUrl = (fileName) => {
    const fileUrl = `https://${process.env.CLOUDFRONT_DOMAIN}/${fileName}`
    return fileUrl
}

async function uploadToS3(filePath, fileName, contentType) {
    try {
        const fileContent = fs.readFileSync(filePath)

        const uploadParams = {
            Bucket: process.env.BUCKET_NAME,
            Key: fileName,
            Body: fileContent,
            ContentType: contentType,
            Metadata: {
                'Content-Type': contentType
            },
            CacheControl: 'no-cache',
            ContentSecurityPolicy: "default-src 'self'",
            CrossOriginResourcePolicy: 'cross-origin',
            AccessControlAllowOrigin: '*',
            AccessControlAllowMethods: 'GET',
            AccessControlAllowHeaders: 'Content-Type'
        }

        const command = new PutObjectCommand(uploadParams)
        await s3Client.send(command)

        const fileUrl = makeFileUrl(fileName)

        console.log(`✅ File ${fileName} uploaded successfully`)
        console.log(`📂 URL: ${fileUrl}`)

        return fileUrl
    } catch (error) {
        console.error(`❌ Error uploading ${fileName}:`, error)
        throw error
    }
}



async function modifyHTML() {
    try {
        const htmlPath = path.resolve(__dirname, '..', '..', 'dist', 'index.html')
        let htmlContent = fs.readFileSync(htmlPath, 'utf8')

        // Create a backup because even machines need insurance
        fs.writeFileSync(`${htmlPath}.backup`, htmlContent)

        // Remove existing script and link tags that match our pattern
        htmlContent = htmlContent.replace(/<script type="module" crossorigin src="\/app.js"><\/script>/, '')
        htmlContent = htmlContent.replace(/<link rel="stylesheet" href="\/app.css">/, '')

        // Create new tags with our S3 URLs and cache-busting mechanism
        const newTags = `
    <!-- Injected by deployment script - Resistance to caching is futile! -->
    <script>
        (function() {

            const cloudFrontDomain = "${process.env.CLOUDFRONT_DOMAIN}"

            function getIdeVersion() {
                try {
                    if (typeof window === 'undefined' || typeof window.location === 'undefined') return "latest";
                    const params = new URLSearchParams(window.location.search);
                    return params.get('ideVersion') === 'next' ? 'next' : 'latest';
                } catch (e) {
                    return "latest";
                }
            }

            const ideVersion = getIdeVersion()
            const cssUrl = "https://" + cloudFrontDomain + "/learnpack/" + ideVersion + "/app.css"
            const jsUrl = "https://" + cloudFrontDomain + "/learnpack/" + ideVersion + "/app.js"

            // Add CSS
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = cssUrl + "?v=" + Date.now();
            document.head.appendChild(link);

            // Add JavaScript
            const script = document.createElement('script');
            script.type = 'module';
            script.crossOrigin = 'anonymous';
            script.src = jsUrl + "?v=" + Date.now();
            document.body.appendChild(script);
        })();
    </script>
</body>`

        // Replace closing body tag with our new tags
        htmlContent = htmlContent.replace('</body>', newTags)

        // Write modified content back to file
        fs.writeFileSync(htmlPath, htmlContent, 'utf8')

        console.log('\n📝 HTML Modifications:')
        console.log('-------------------')
        console.log('✅ Removed old script and link tags')
        console.log('✅ Injected new cache-busting script')
        console.log('✅ Created backup at index.html.backup')

        return true
    } catch (error) {
        console.error('❌ Error modifying HTML:', error.message)
        throw error
    }
}



async function processFiles() {
    try {
        // Find the files
        const distPath = path.resolve(__dirname, '..', '..', 'dist')
        console.log('🔍 Searching in:', distPath)
        const files = findBuildFiles(distPath)

        if (!files.jsPath || !files.cssPath) {
            throw new Error("Required files not found! Humans, always losing things...")
        }

        console.log('\n📤 Starting upload process...')

        let uploads = []
        if (tag === "latest") {
            const [jsUrl, cssUrl] = await Promise.all([
                uploadToS3(files.jsPath, `learnpack/v${version}/app.js`, 'application/javascript'),
                uploadToS3(files.cssPath, `learnpack/v${version}/app.css`, 'text/css'),
            ])
            uploads.push({
                name: "versioned",
                url: jsUrl
            }, {
                name: "versioned",
                url: cssUrl
            })
        }
        const [jsUrlTag, cssUrlTag] = await Promise.all([
            uploadToS3(files.jsPath, `learnpack/${tag}/app.js`, 'application/javascript'),
            uploadToS3(files.cssPath, `learnpack/${tag}/app.css`, 'text/css')
        ])
        uploads.push({
            name: "tag",
            url: jsUrlTag
        }, {
            name: "tag",
            url: cssUrlTag
        })

        console.log('\n🎉 Upload Summary:')
        console.log('-------------')
        uploads.forEach((upload) => {
            console.log(`${upload.name}: ${upload.url}`)
        })

        await modifyHTML()

    } catch (error) {
        console.error('\n❌ Fatal Error:', error.message)
        process.exit(1)
    }
}

// Execute everything
processFiles()
    .then(() => console.log('\n🚀 Process completed successfully'))
    .catch(() => process.exit(1))
