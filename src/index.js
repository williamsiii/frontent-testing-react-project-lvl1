import axios from 'axios';
import fs from "fs";
import { program } from 'commander';
import cheerio from 'cheerio';
import AxiosDebug from 'axios-debug-log';
AxiosDebug({
    request: function (debug, config) {
        debug('Request with ' + config.headers['content-type'])
    },
    response: function (debug, response) {
        debug(
            'Response with ' + response.headers['content-type'],
            'from ' + response.config.url,
            'response:' + response.data
        )
    },
    error: function (debug, error) {
        debug('Axios Error', error)
    }
})

const defaultUrl = 'http://www.tsjdom18.ru';
const INIT_STATE = {
    output: '/Users/a.nosov/hexlet/test_download/',
    url: defaultUrl,
    fileName: 'default.html',
    response: null,
    resources: [],
    resourcesFileNames: [],
    originalResources: [],
    resourcesDir: null,
}
let params = { ...INIT_STATE }

const ERROR_CODES = {
    BAD_INPUT: 1,
    NO_DATA: 2,
    COULD_NOT_FETCH: 3,
    CANT_PARSE_DOC: 4,
    CANT_MKDIR: 5,
    CANT_WRITE: 6
}

const linkCondition = ($, el) => {
    return $(el).attr('rel') !== 'stylesheet';
}

const RESOURCES = [
    { tag: 'img', attr: 'src' },
    { tag: 'link', attr: 'href', condition: linkCondition },
    { tag: 'script', attr: 'src' }
];
const initOptions = () => {
    program
        .allowUnknownOption()
        .option('-o, --output <dirname>', 'Set output directory', PageLoader.INIT_STATE.output)
        .option('-u, --url <url>', 'Set page address for downloading', PageLoader.defaultUrl)
}

const getOptions = async () => {
    try {
        await program.parseAsync()
        params.url = String(program.opts().url);
        params.output = String(program.opts().output);
        if (params.output[params.output.length - 1] !== '/') {
            params.output += '/';
        }
        if (!fs.existsSync(params.output)) {
            params.output = INIT_STATE.output;
        }
        params.fileName = composeName(params.url);
    } catch (err) {
        console.error("Не смог обработать входные параметры:", err)
        process.exit()
    }
}

const composeName = (name, withExtension = false) => {
    let extension = "";
    let res;
    if (withExtension) {
        const queryParts = name.split('?');
        const parts = queryParts[0].split('.');
        res = queryParts[0];
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
        console.error("Не получилось скачать страницу:", err.code)
        process.exit()
    }

    if (resp && resp.status === 200) {
        params.response = resp.data
    } else {
        params.response = null
        console.error('Не получилось скачать страницу')
        process.exit()
    }
}
const changeSource = () => {
    const $ = cheerio.load(params.response);
    RESOURCES.map(resource => {
        $(resource.tag).each((index, res) => {
            const src = $(res).attr(resource.attr);
            const q = params.originalResources.indexOf(src)
            if (q !== -1) {
                $(res).attr(resource.attr, params.resourcesFileNames[q]);
            }
        })
    })
    params.response = $.html();
}

const parseForElement = async (element, attr, condition) => {
    checkSaveDirectory();
    const $ = cheerio.load(params.response);
    const coreDomain = params.url.replace(/^(http|https):\/\//, '')
    let arr = [], origArr = [], filesArr = [];
    $(element).each((index, el) => {
        const originalAttr = $(el).attr(attr);

        // проверка на доп условия
        if (!originalAttr || (condition && condition($, el))) {
            return;
        }
        const attrib = originalAttr.split('?')[0]
        if (attrib) {
            const res = attrib
                .replace(/^(http|https):\/\//, '')  // сначала убираю протокол
                .replace(coreDomain, '///')         // теперь убираю основной домен, заменяя его спецпоследовательностью
                .replace(/^.*\/\/\//, '/')          // теперь убираю все верхние домены, если есть спецпоследовательность
                .replace(/\/{2,}/g, '/')            // заменяю все последовательности '/.../' на одинарный '/'

            if (res.match(/^\//)) {
                let targetFileName = composeName(res, true);
                filesArr.push(`${params.resourcesDir}/${targetFileName}`)
                arr.push(res);
                if (originalAttr[0] === "/") {
                    origArr.push(`${params.url}${originalAttr}`)
                } else {
                    origArr.push(originalAttr);
                }
            }
        }
    })
    params.resources = params.resources.concat(arr)
    params.originalResources = params.originalResources.concat(origArr)
    params.resourcesFileNames = params.resourcesFileNames.concat(filesArr)
    // save resources
    for (const item of arr) {
        let index = arr.indexOf(item);
        try {
            let resp = await axios({
                method: 'get',
                url: origArr[index],
                responseType: 'stream'
            });
            resp.data.pipe(fs.createWriteStream(filesArr[index]))
        } catch (err) {
            console.error(origArr[index], "Status " + err.response?.status)
        }
    }
}

const checkSaveDirectory = () => {
    // create dir if not exists
    try {
        params.resourcesDir = `${params.output}${params.fileName}_files`
        if (!fs.existsSync(params.resourcesDir)) {
            fs.mkdir(params.resourcesDir, (err) => {
                if (err) {
                    console.error("Не получилось создать директорию", err);
                    process.exit();
                }
            })
        }
    } catch (err) {
        console.error("Не получилось создать директорию", err);
        process.exit();
    }

}
const parsePage = async () => {
    try {
        await RESOURCES.map(async (res) => {
            await parseForElement(res.tag, res.attr, res.condition);
        })
        changeSource();
    } catch (err) {
        console.error("Не получилось распарсить документ", err)
        process.exit();
    }

}

const savePage = async () => {
    if (params.output[params.output.length - 1] !== '/') {
        params.output += '/'
    }
    const file = `${params.output}${params.fileName}.html`;
    try {
        fs.writeFileSync(file, params.response)
    } catch (err) {
        console.error(err)
        process.exit()
    }
    console.log(`Файл был сохранён как ${file}`)
}

const main = async () => {
    initOptions();
    getOptions();
    await fetchPage();
    //
    if (!params.response) {
        console.error("Нет данных для обработки")
        return;
    }
    //
    await parsePage();
    savePage();
}

export const PageLoader = {
    main,
    params,
    defaultUrl,
    INIT_STATE,
    ERROR_CODES,
    getOptions,
    initOptions,
    composeName,
    savePage,
    fetchPage,
    parsePage,
    parseForElement,
    linkCondition,
}

export default main;
