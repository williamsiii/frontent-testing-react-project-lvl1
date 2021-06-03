import * as stream from 'stream';
import { promisify } from 'util';
import axios from 'axios';
import fs, { constants } from 'fs';
import { writeFile, access, mkdir } from 'fs/promises';
import cheerio from 'cheerio';
import 'axios-debug-log';

const defaultUrl = 'http://www.tsjdom18.ru';
const INIT_STATE = {
  output: './downloads/',
  url: defaultUrl,
  fileName: 'default.html',
  response: null,
  resources: [],
  resourcesFileNames: [],
  originalResources: [],
  resourcesDir: null,
};

const params = { ...INIT_STATE };

const linkCondition = ($, el) => $(el).attr('rel') !== 'stylesheet';

const RESOURCES = [
  { tag: 'img', attr: 'src' },
  { tag: 'link', attr: 'href', condition: linkCondition },
  { tag: 'script', attr: 'src' },
];

const accessPath = async (path) => {
  let res = false;
  try {
    await access(path, constants.W_OK);
    res = true;
  } catch (err) {
    console.error(err);
  }
  return res;
};

const composeName = (name, withExtension = false) => {
  let extension = '';
  let res;
  if (withExtension) {
    const queryParts = name.split('?');
    const parts = queryParts[0].split('.');
    [res] = [queryParts];
    if (parts.length > 1) {
      extension = `.${parts.pop()}`;
      res = parts.join('.');
    }
  } else {
    res = name;
  }
  if (Array.isArray(res)) {
    [res] = res;
  }
  res = res
    .replace(/(http|https):\/\/(www\.)?/g, '')
    .replace(/[\W_]/g, '-');
  return res + extension;
};

const checkOptions = async () => {
  if (params.output[params.output.length - 1] !== '/') {
    params.output += '/';
  }
  const isExist = await accessPath(params.output);
  if (!isExist) {
    params.output = INIT_STATE.output;
  }
  params.fileName = composeName(params.url);
};

const fetchPage = async () => {
  let resp;
  try {
    resp = await axios.get(params.url);
  } catch (err) {
    console.error('Не получилось скачать страницу:', err.code);
  }

  if (resp && resp.status === 200) {
    params.response = resp.data;
  } else {
    params.response = null;
    console.error('Не получилось скачать страницу');
  }
};

const changeSource = () => {
  const $ = cheerio.load(params.response);
  RESOURCES.forEach((resource) => {
    $(resource.tag).each((index, res) => {
      const src = $(res).attr(resource.attr);
      const q = params.originalResources.indexOf(src);
      if (q !== -1) {
        $(res).attr(resource.attr, params.resourcesFileNames[q]);
      }
    });
  });
  params.response = $.html();
};

const checkSaveDirectory = async () => {
  // create dir if not exists
  try {
    params.resourcesDir = `${params.output}${params.fileName}_files`;
    const exists = await accessPath(params.resourcesDir);
    if (!exists) {
      await mkdir(params.resourcesDir, (err) => {
        if (err) {
          console.error('Не получилось создать директорию!', err);
        }
      });
    }
  } catch (err) {
    console.error('Не получилось создать директорию', err);
  }
};

const parseForElement = async (element, attr, condition) => {
  checkSaveDirectory();
  const $ = cheerio.load(params.response);
  const coreDomain = params.url.replace(/^(http|https):\/\//, '');
  const arr = [];
  const origArr = [];
  const filesArr = [];
  $(element).each((index, el) => {
    const originalAttr = $(el).attr(attr);

    // проверка на доп условия
    if (!originalAttr || (condition && condition($, el))) {
      return;
    }
    const attrib = originalAttr.split('?')[0];
    if (attrib) {
      const res = attrib
        .replace(/^(http|https):\/\//, '') // сначала убираю протокол
        .replace(coreDomain, '///') // теперь убираю основной домен, заменяя его спецпоследовательностью
        .replace(/^.*\/\/\//, '/') // теперь убираю все верхние домены, если есть спецпоследовательность
        .replace(/\/{2,}/g, '/'); // заменяю все последовательности '/.../' на одинарный '/'

      if (res.match(/^\//) && res.length < 240) {
        const targetFileName = composeName(res, true);
        filesArr.push(`${params.resourcesDir}/${targetFileName}`);
        arr.push(res);
        if (originalAttr[0] === '/') {
          origArr.push(`${params.url}${originalAttr}`);
        } else {
          origArr.push(originalAttr);
        }
      }
    }
  });
  params.resources = params.resources.concat(arr);
  params.originalResources = params.originalResources.concat(origArr);
  params.resourcesFileNames = params.resourcesFileNames.concat(filesArr);
  // save resources
  arr.forEach(async (item) => {
    const finished = promisify(stream.finished);
    const index = arr.indexOf(item);
    const writer = fs.createWriteStream(filesArr[index]);
    return axios({
      method: 'get',
      url: origArr[index],
      responseType: 'stream',
    })
      .then(async (response) => {
        response.data.pipe(writer);
        return finished(writer);
      })
      .catch((err) => {
        console.error(origArr[index], err.code);
      });
  });
};

const parsePage = async () => {
  try {
    await RESOURCES.map(async (res) => {
      await parseForElement(res.tag, res.attr, res.condition);
    });
    changeSource();
  } catch (err) {
    console.error('Не получилось распарсить документ', err);
  }
};

const savePage = async () => {
  if (params.output[params.output.length - 1] !== '/') {
    params.output += '/';
  }
  params.finalPath = `${params.output}${params.fileName}.html`;
  try {
    await writeFile(params.finalPath, params.response);
  } catch (err) {
    console.error(err);
  }
};

const main = async (output, url) => {
  params.output = output || INIT_STATE.output;
  params.url = url || INIT_STATE.url;
  checkOptions();
  await fetchPage();
  //
  if (!params.response) {
    console.error('Нет данных для обработки');
    return;
  }
  //
  await parsePage();
  savePage();
};

export const PageLoader = {
  main,
  defaultUrl,
  INIT_STATE,
  params,
};

export default main;
