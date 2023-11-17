const fs = require('fs');
const archiver = require('archiver');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const packageJsonPath = path.join(rootDir, 'package.json');
const packageJson = require(packageJsonPath);
let version = packageJson.version;
if(typeof version != "string") throw Error("Invalid package.version found on package.json")
const binPath = __dirname;
const tarFileName = (v) => `learnpack-${version}.tar.gz`;
const tarFilePath = path.join(binPath, tarFileName(version));

async function incrementVersion(version, incrementType) {
  const versionParts = version.split('.').map(Number);
  if (incrementType === 'major') {
    versionParts[0]++;
    versionParts[1] = 0;
    versionParts[2] = 0;
  } else if (incrementType === 'minor') {
    versionParts[2]++;
  }
  return versionParts.join('.');
}

async function checkExistingFile() {
  const inquirer = (await import('inquirer')).default;
  let _v = version;
  if (fs.existsSync(tarFilePath)) {
    const answers = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: `A file named ${tarFileName(version)} already exists. What would you like to do?`,
      choices: ['Overwrite', 'Increase Major Version', 'Increase Minor Version']
    }]);

    if (answers.action !== 'Overwrite') {
      const incrementType = answers.action.includes('Major') ? 'major' : 'minor';
      _v = await incrementVersion(version, incrementType);
      packageJson.version = version;
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    }
  }

  version = _v;
  return _v;

}

async function compressDirectory() {
  const _v = await checkExistingFile();

  const _outputPath = path.join(binPath, tarFileName(_v));
  const output = fs.createWriteStream(_outputPath);
  console.log(`Generating ${_outputPath}`);
  const archive = archiver('tar', {
    gzip: true,
    zlib: { level: 9 }
  });

  archive.on('error', (err) => {
    throw err;
  });

  archive.pipe(output);
  archive.directory(path.join(rootDir, 'dist/'), false);
  archive.finalize();
}

compressDirectory();
