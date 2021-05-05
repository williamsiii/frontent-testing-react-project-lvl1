const axios = require('axios');
const fs = require("fs");

const params = {
    output: process.cwd()
}

const processArgs = () => {
    const args = process.argv
    for (let i = 0; i < args.length; i++) {
        if (args[i] === "--output") {
            if (args[i + 1] && fs.existsSync(args[i + 1])) {
                params.output = args[i + 1];
            } else {
                console.log("Destination directory doesn't exist. Downloading page to current directory.")
                params.output = process.cwd();
            }
            break;
        }
    }


    console.log(`File will be downloaded to ${params.output}`);
}


function main() {
    processArgs();

}


module.exports = { main, params, processArgs }