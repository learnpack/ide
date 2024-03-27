"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var filePath = path.join(__dirname, 'lib.tsx');
// Check for the --turn flag and set the default value to "on"
var turnFlagIndex = process.argv.indexOf('--turn');
var turnFlagValue = turnFlagIndex !== -1 ? process.argv[turnFlagIndex + 1] : 'on';
var readFileCallback = function (err, data) {
    if (err) {
        console.error(err);
        return;
    }
    var lines = data.split('\n');
    var lineIndex = lines.findIndex(function (line) { return line.includes('DEV_MODE'); });
    var lineToChange = lines.find(function (line) { return line.includes('DEV_MODE'); });
    if (lineToChange) {
        var devMode = lineToChange.split("=")[0];
        if (turnFlagValue === 'on') {
            devMode += '=true;';
        }
        else if (turnFlagValue === 'off') {
            devMode += '=false;';
        }
        lines[lineIndex] = devMode;
        var updatedData = lines.join('\n');
        fs.writeFileSync(filePath, updatedData);
        console.log('File updated.');
    }
    else {
        console.log('File does not have a third line.');
    }
};
fs.readFile(filePath, 'utf8', readFileCallback);
