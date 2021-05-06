const axios = require('axios');
const fs = require("fs");
const { program } = require('commander');
const cheerio = require('cheerio');
var request = require('request');

const defaultUrl = 'http://www.tsjdom18.ru';
const INIT_STATE = {
    output: '/Users/a.nosov/hexlet/test_download/',
    url: defaultUrl,
    fileName: 'default.html',
    response: null,
    resources: [],
    resourcesFileNames: [],
    resourcesDir: null,
}
let params = { ...INIT_STATE }

const getOptions = () => {
    program
        .option('-o, --output <dirname>', 'Set output directory', INIT_STATE.output)
        .option('-u, --url <url>', 'Set page address for downloading', defaultUrl)

    program.parse();
    params.output = program.opts().output;
    if (params.output[params.output.length - 1] !== '/') {
        params.output += '/';
    }
    if (!fs.existsSync(params.output)) {
        params.output = INIT_STATE.output;
    }
    outputChecked = true;
    params.url = program.opts().url;
    params.fileName = composeName(params.url);
}

const composeName = (name, withExtension = false) => {
    let extension = "";
    let res;
    if (withExtension) {
        let parts = name.split('.');
        if (parts.length > 1) {
            extension = "." + parts.pop();
            res = parts.join('.')
        }
    } else {
        res = name
    }
    res = res
        .replace(/(http|https):\/\/(www\.)?/g, '')
        .replace(/[\W_]/g, '-')
    return res + extension
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

const parsePage = async () => {
    params.resourcesDir = `${params.output}${params.fileName}_files`
    if (await !fs.existsSync(params.resourcesDir)) {
        await fs.mkdir(params.resourcesDir, (err) => {
            if (err) throw err;
        })
    }
    //
    const $ = cheerio.load(params.response);
    let coreDomain = params.url.replace(/^(http|https):\/\//, '')
    let imgs = [];
    $('img').each((index, element) => {
        let src = $(element).attr('src');
        if (src) {
            src = src
                .replace(/^(http|https):\/\//, '')  // сначала убираю протокол
                .replace(coreDomain, '///')         // теперь убираю основной домен, заменяя его спецпоследовательностью
                .replace(/^.*\/\/\//, '/')        // теперь убираю все верхние домены, если есть спецпоследовательность
                .replace(/\/{2,}/g, '/')            // заменяю все последовательности '/.../' на одинарный '/'
            let matching = src.match(/^\//)
            if (matching) {
                imgs.push(src)
            }
        }
    })
    params.resources = params.resources.concat(imgs)
    //
    for (i in params.resources) {
        let targetFileName = composeName(params.resources[i], true);
        let targetFilePath = `${params.resourcesDir}/${targetFileName}`;
        const targetFile = fs.createWriteStream(targetFilePath);
        const remoteFile = request(`${params.url}${params.resources[i]}`);
        remoteFile.on('data', function (chunk) {
            targetFile.write(chunk);
        });
        params.resourcesFileNames.push(targetFilePath)
    }

}

const savePage = async () => {
    if (params.output[params.output.length - 1] !== '/') {
        params.output += '/'
    }
    const file = `${params.output}${params.fileName}.html`;
    fs.writeFileSync(file, params.response)
    console.log(`File was saved as ${file}`)
}

async function main() {
    getOptions();
    await fetchPage();
    //
    if (!params.response) return;
    //
    parsePage();
    savePage();

}


module.exports = { main, params, defaultUrl, INIT_STATE, getOptions, composeName, savePage, fetchPage, parsePage }