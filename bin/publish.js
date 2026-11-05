
const fs = require('fs');
const archiver = require('archiver');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const packageJson = require(path.join(rootDir, 'package.json'));
const version = packageJson.version;
if (typeof version != "string") throw Error("Invalid package.version found on package.json")

// The version is bumped through a PR before releasing (preflight.js refuses a version
// that is already published), so this script only packs dist/ for that version.
const tarFilePath = path.join(__dirname, `learnpack-${version}.tar.gz`);

function compressDirectory() {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(tarFilePath);
    console.log(`Generating ${tarFilePath}`);

    const archive = archiver('tar', {
      gzip: true,
      zlib: { level: 9 }
    });

    // Resolve only once the file is fully written, so the next step never reads a truncated tarball.
    output.on('close', resolve);
    output.on('error', reject);
    archive.on('error', reject);

    archive.pipe(output);
    // index.html.backup is a local leftover of uploadLearnpack.js; it must not ship to packages.
    archive.glob('**/*', { cwd: path.join(rootDir, 'dist'), ignore: ['index.html.backup'], dot: true });
    archive.finalize();
  });
}

compressDirectory()
  .then(() => console.log(`✅ ${path.basename(tarFilePath)} generated`))
  .catch((err) => {
    console.error('❌ Error generating the tarball:', err);
    process.exit(1);
  });
