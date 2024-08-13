const fs = require('fs');
const path = require('path');

const binDir = path.join(__dirname, '../../bin');
const outputFilePath = path.join(__dirname, '../../versions.json');

fs.readdir(binDir, (err, files) => {
  if (err) {
    console.error(`Error reading directory ${binDir}:`, err);
    return;
  }

  const versions = files.filter(file => file.endsWith('.tar.gz'));

  fs.writeFile(outputFilePath, JSON.stringify(versions, null, 2), (err) => {
    if (err) {
      console.error(`Error writing file ${outputFilePath}:`, err);
      return;
    }

    console.log(`Versions written to ${outputFilePath}`);
  });
});
