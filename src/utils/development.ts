import * as fs from 'fs';
import * as path from 'path';

const filePath = path.join(__dirname, 'lib.tsx');

// Check for the --turn flag and set the default value to "on"
const turnFlagIndex = process.argv.indexOf('--turn');
const turnFlagValue = turnFlagIndex !== -1 ? process.argv[turnFlagIndex + 1] : 'on';


const readFileCallback = (err: NodeJS.ErrnoException | null, data: string) => {
    if (err) {
        console.error(err);
        return;
    }
    
    const lines = data.split('\n');
    
    const lineIndex = lines.findIndex((line) => line.includes('DEV_MODE'));
    const lineToChange = lines.find((line) => line.includes('DEV_MODE'));
    
    if (lineToChange) {
        let devMode = lineToChange.split("=")[0];

        if (turnFlagValue === 'on') {
        devMode += '=true;';

        } else if (turnFlagValue === 'off') {
            devMode += '=false;';
        }

        lines[lineIndex] = devMode;
        const updatedData = lines.join('\n');

        fs.writeFileSync(filePath, updatedData);
        console.log('File updated.');
    } else {
        console.log('File does not have a DEV_MODE variable.');
    }
    
}

fs.readFile(filePath, 'utf8', readFileCallback);
