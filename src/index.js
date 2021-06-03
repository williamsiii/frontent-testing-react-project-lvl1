import axios from 'axios';
import path from 'path';
import os from 'os';
import { createWriteStream, promises as fs } from 'fs';
import cheerio from 'cheerio';
import { keys } from 'lodash';
import debug from 'debug';


const log = debug('page-loader');

const RESOURCES = {
  link: 'href',
  img: 'src',
  script: 'src',
};

const composeName = (link) => {
  const rename = (q) => q.replace(/^\//, '').replace(/[^a-z1-9]/g, '-');
  try {
    const { host = '', pathname } = new URL(link);
    return rename(host + pathname);
  } catch (e) {
    return rename(link);
  }
};

const composeLink = (link, type = 'file') => {
  switch (type) {
    case 'file': {
      const ext = path.extname(link) || '.html';
      const withoutExt = link.replace(ext, '');
      return composeName(withoutExt) + ext;
    }
    case 'directory':
      return `${composeName(link)}_files`;
    default:
      throw new Error(`Unknown type: ${type}`);
  }
};

const parseResourceLinks = (page, dir, baseUrl) => {
  const { host, origin } = new URL(baseUrl);
  const linksArr = [];
  const $ = cheerio.load(page);

  keys(RESOURCES).forEach((tag) => {
    $(tag).each((index, element) => {
      const uri = $(element).attr(RESOURCES[tag]);

      const link = new URL(uri, origin);
      if (link.host !== host) return;

      linksArr.push(link);
      $(element).attr(
        RESOURCES[tag],
        path.join(dir, composeLink(link.toString())),
      );
    });
  });
  return { result: $.html({ decodeEntities: false }), linksArr };
};

const loadResource = (url, resourceOutputPath) => {
  const resultFilePath = path.join(resourceOutputPath, composeLink(url));
  return axios({
    method: 'get',
    url,
    responseType: 'stream',
  })
    .then(({ data }) => {
      log(`Fetch resource ${url} to ${resultFilePath}`);
      data.pipe(createWriteStream(resultFilePath));
    })
    .catch((error) => {
      log(`Fetch resource ${url} failed ${error.message}`);
      throw error;
    });
};

const saveResources = (url, resourceOutputPath, linksArr) => {
  const resultDirName = composeLink(url, 'directory');
  const resultOutput = path.join(resourceOutputPath, resultDirName);
  return fs
    .mkdir(resultOutput)
    .then(() => {
      log(`Create folder ${resultOutput} for resources`);
      return linksArr.map((link) => {
        const resourceUrl = new URL(link, url);
        return loadResource(resourceUrl.toString(), resultOutput);
      });
    })
    .then((tasks) => Promise.all(tasks))
    .catch((error) => {
      log(`Create folder ${resultOutput} failed ${error.message}`);
      throw error;
    });
};

const main = async (baseUrl, outputPath) => {
  if (!outputPath) {
    outputPath = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'))
  }
  log(`Load page ${baseUrl} to ${outputPath}`);
  return axios.get(baseUrl).then((res) => {
    const htmlFileName = `${composeName(baseUrl)}.html`;
    const resultFilePath = path.join(outputPath, htmlFileName);
    const page = res.data;
    const sourceDir = composeLink(baseUrl, 'directory');
    const { result, linksArr } = parseResourceLinks(page, sourceDir, baseUrl);
    return fs
      .writeFile(resultFilePath, result)
      .then(() => {
        saveResources(baseUrl, outputPath, linksArr)
      })
      .catch((error) => {
        log(`Writing to ${resultFilePath} error, ${error.message}`);
        throw error;
      });
  });
};

export default main;