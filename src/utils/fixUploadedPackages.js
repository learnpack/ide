import {
    S3Client,
    ListObjectsV2Command,
    GetObjectCommand,
    PutObjectCommand
} from '@aws-sdk/client-s3'
import {
    CloudFrontClient,
    CreateInvalidationCommand
} from '@aws-sdk/client-cloudfront'

// ---------- CONFIGURACIÓN ----------
const BUCKET_NAME = 'learnpack-paquetes'
const CLOUDFRONT_DISTRIBUTION_ID = process.env.CLOUDFRONT_DISTRIBUTION_ID

// ---------- ANSI COLORS ----------
const c = {
    green: txt => `\x1b[32m${txt}\x1b[0m`,
    red: txt => `\x1b[31m${txt}\x1b[0m`,
    yellow: txt => `\x1b[33m${txt}\x1b[0m`,
    cyan: txt => `\x1b[36m${txt}\x1b[0m`,
    bold: txt => `\x1b[1m${txt}\x1b[0m`,
    blue: txt => `\x1b[34m${txt}\x1b[0m`,
}

// ---------- AWS CLIENTS ----------
const s3Client = new S3Client({
    region: 'us-east-2',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
})
const cloudFrontClient = new CloudFrontClient({
    region: 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
})

// ---------- NUEVO BLOQUE ----------
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
`

async function streamToString(stream) {
    const chunks = []
    for await (const chunk of stream) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
    }
    return Buffer.concat(chunks).toString('utf-8')
}

async function listarIndexHtmls(bucket) {
    let ContinuationToken = undefined
    let archivos = []

    do {
        const params = {
            Bucket: bucket,
            ContinuationToken,
        }
        const data = await s3Client.send(new ListObjectsV2Command(params))
        const encontrados = (data.Contents || [])
            .filter(obj => {
                const key = obj.Key
                return key.endsWith('index.html') && key.split('/').length === 2
            })
            .map(obj => obj.Key)

        archivos.push(...encontrados)
        ContinuationToken = data.IsTruncated ? data.NextContinuationToken : undefined
    } while (ContinuationToken)

    return archivos
}

async function replaceScriptAndInvalidate(key) {
    try {
        console.log(c.blue(`\nProcesando: ${key}`))
        // Descargar
        const data = await s3Client.send(new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key
        }))
        const originalHtml = await streamToString(data.Body)

        // Verificar si ya tiene el script correcto
        const scriptRegex = /<!--\s*Injected by deployment script.*?-->\s*<script\b[^>]*>[\s\S]*?<\/script>/i
        const existingScript = originalHtml.match(scriptRegex)

        if (!existingScript) {
            console.log(c.yellow('No se encontró el bloque de comentario+script para reemplazar.'))
            return
        }

        // Comparar si el script actual es igual al nuevo
        const normalizedExisting = existingScript[0].replace(/\s+/g, ' ').trim()
        const normalizedNew = newTags.replace(/\s+/g, ' ').trim()

        if (normalizedExisting === normalizedNew) {
            console.log(c.cyan('El script ya está actualizado, no es necesario reemplazar.'))
            return
        }

        const newHtml = originalHtml.replace(scriptRegex, newTags.trim())

        // Subir a S3
        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: newHtml,
            ContentType: 'text/html'
        }))
        console.log(c.green(`Archivo actualizado correctamente en S3.`))

        // Invalidar en CloudFront
        await invalidateCloudFront([`/${key}`])
    } catch (err) {
        console.error(c.red(`Error procesando ${key}:`), err)
    }
}

async function invalidateCloudFront(paths) {
    console.log(c.yellow(`Solicitando invalidación en CloudFront para: ${paths.join(', ')}`))
    const command = new CreateInvalidationCommand({
        DistributionId: CLOUDFRONT_DISTRIBUTION_ID,
        InvalidationBatch: {
            CallerReference: `fix-script-${Date.now()}-${Math.random()}`,
            Paths: {
                Quantity: paths.length,
                Items: paths,
            },
        },
    })
    try {
        const data = await cloudFrontClient.send(command)
        console.log(c.green("Invalidación de CloudFront creada: ") + c.bold(data.Invalidation.Id))
    } catch (err) {
        console.error(c.red("Error creando invalidación CloudFront:"), err)
    }
}

listarIndexHtmls(BUCKET_NAME)
    .then(async lista => {
        console.log(c.bold('\nIndex.html encontrados:'))
        lista.forEach(key => console.log(key))

        for (const key of lista) {
            await replaceScriptAndInvalidate(key)
        }
        console.log(c.bold(c.green('\nTodos los archivos procesados.')))
    })
    .catch(err => console.error(c.red('Error:'), err))
