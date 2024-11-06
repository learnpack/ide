const readline = require('readline');

// Define ANSI escape codes for red text
const redText = "\x1b[31m"; // Start red text
const resetText = "\x1b[0m"; // Reset text color

// Create an interface for input and output
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askUser() {
    rl.question(`${redText} Did you already delete the public files? (yes/no)${resetText} `, (answer) => {
        if (answer.toLowerCase() === 'yes') {
            console.log("User chose: Yes. Continuing the process...");
            rl.close();
            // Place your code for continuing the process here
        } else {
            console.log("User chose: No. Stopping the process.");
            rl.close(); // Close the readline interface
            throw new Error("User did not delete the public files.");
        }
    });
}

askUser();
