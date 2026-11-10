// Toggles the DEV_MODE flag in lib.tsx.
//   npm run dev / dev-build  →  --turn on
//   npm run build (release)  →  --turn off, right before preflight.js checks that git is clean
//
// Only the true/false token is replaced: the rest of the file, including CRLF line endings
// on Windows checkouts, is left byte for byte as it was. If the flag already has the requested
// value the file is not written at all. Any problem exits with code 1 so the release stops.
const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, 'lib.tsx')
const DECLARATION = /^(export const DEV_MODE[ \t]*=[ \t]*)(true|false)\b/m

function fail(message) {
    console.error(`❌ development.js: ${message}`)
    process.exit(1)
}

const turnFlagIndex = process.argv.indexOf('--turn')
const turn = turnFlagIndex !== -1 ? process.argv[turnFlagIndex + 1] : undefined
if (turn !== 'on' && turn !== 'off') {
    fail(`usage: node development.js --turn on|off (got ${turn === undefined ? 'no --turn' : `"${turn}"`}).`)
}
const value = turn === 'on' ? 'true' : 'false'

let source
try {
    source = fs.readFileSync(filePath, 'utf8')
} catch (error) {
    fail(`could not read ${filePath}: ${error.message}`)
}

const match = source.match(DECLARATION)
if (!match) fail(`no "export const DEV_MODE = true|false" declaration found in ${filePath}.`)

if (match[2] === value) {
    console.log(`DEV_MODE is already ${value}.`)
} else {
    fs.writeFileSync(filePath, source.replace(DECLARATION, `$1${value}`))
    console.log(`DEV_MODE set to ${value}.`)
}
