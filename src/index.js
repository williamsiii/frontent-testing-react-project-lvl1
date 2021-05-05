const axios = require('axios');
const fs = require("fs");

// const defaultUrl = 'https://ru.hexlet.io/courses';
const defaultUrl = 'https://example.com/';
const INIT_STATE = {
    output: null,
    url: defaultUrl,
    fileName: 'default.html',
    response: null,
}
let params = { ...INIT_STATE }

const processArgs = () => {
    const args = process.argv;
    let outputChecked = false;
    let urlChecked = false;
    for (let i = 0; i < args.length; i++) {
        if (!outputChecked && (args[i] === "--output" || args[i] === "-o")) {
            if (args[i + 1] && fs.existsSync(args[i + 1])) {
                params.output = args[i + 1];
            } else {
                console.log("Destination directory doesn't exist. Downloading page to current directory.")
                params.output = process.cwd();
            }
            outputChecked = true;
        }
        if (!urlChecked && (args[i] === "--url" || args[i] === "-u")) {
            if (args[i + 1]) {
                params.url = args[i + 1]
            } else {
                params.url = defaultUrl;
            }
            urlChecked = true;
        }
    }

    if (params.output === null) {
        params.output = process.cwd();
    }

    console.log(`File will be downloaded to ${params.output}`);
}


const fetchPage = async () => {
    let resp;
    try {
        resp = await axios.get(params.url)
    } catch (err) {
        return Error(err)
    }

    if (resp && resp.status === 200) {
        params.response = resp.data
    } else {
        params.response = null
        return Error('Could not fetch page.')
    }
}


const composeName = () => {
    let name = params.url
        .replace(/(http|https):\/\/(www\.)?/g, '')
        .replace(/[\W_]/g, '-')
    params.fileName = name + ".html";
}

const savePage = async () => {
    if (!params.response) return;
    //
    if (params.output[params.output.length - 1] !== '/') {
        params.output += '/'
    }
    const file = `${params.output}${params.fileName}`;
    fs.writeFileSync(file, params.response)
    console.log(`File was saved as ${file}`)
}

async function main() {
    processArgs();
    await fetchPage();
    composeName();
    savePage();

}


module.exports = { main, params, defaultUrl, INIT_STATE, processArgs, composeName, savePage, fetchPage }