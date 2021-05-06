const axios = require('axios');
const fs = require("fs");
const { program } = require('commander');

const defaultUrl = 'https://example.com/';
const INIT_STATE = {
    output: null,
    url: defaultUrl,
    fileName: 'default.html',
    response: null,
}
let params = { ...INIT_STATE }

const getOptions = () => {
    program
        .option('-o, --output <dirname>', 'Set output directory', process.cwd())
        .option('-u, --url <url>', 'Set page address for downloading', 'https://example.com/')

    program.parse();
    params.output = program.opts().output;
    if (params.output[params.output.length - 1] !== '/') {
        params.output += '/';
    }
    if (!fs.existsSync(params.output)) {
        params.output = process.cwd() + '/';
    }
    outputChecked = true;
    params.url = program.opts().url;
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
    getOptions();
    // processArgs();
    await fetchPage();
    composeName();
    savePage();

}


module.exports = { main, params, defaultUrl, INIT_STATE, getOptions, composeName, savePage, fetchPage }