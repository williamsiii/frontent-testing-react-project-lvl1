import nock from 'nock';
import path from 'path';
import os from 'os';
import { promises as fs } from 'fs';
import { readFile, readdir } from 'fs/promises';
import 'axios-debug-log';
import main from '../src/index';

describe('page-loader, parse response', () => {
  let scope;
  let fixture = null;
  let pathToTempDir;

  beforeAll(async () => {
    nock.disableNetConnect();
    const fixturePath = path.join(__dirname, '..', '__fixtures__', 'index.html');
    fixture = await readFile(fixturePath, 'utf8');
    pathToTempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-'));
    scope = nock(/hexlet/)
      .persist()
      .get(/\/.{0,}/)
      .reply(200, fixture);
  });

  test('fetch resources', async () => {
    await main('https://hexlet.io/', pathToTempDir);
    const res = await readFile(`${pathToTempDir}/hexlet-io-.html`);
    expect(res && res.length).toBeTruthy();
  });

  test('file contents', async () => {
    const page = await readFile(`${pathToTempDir}/hexlet-io-.html`, 'utf8');
    expect(page && page.length).toBeTruthy();
    const resResources = await readdir(`${pathToTempDir}/hexlet-io-_files`);
    expect(resResources).toMatchObject(expect.arrayContaining([
      'hexlet-io-assets-professions-nodejs.png',
      'hexlet-io-assets-application.css',
    ]));
    resResources.forEach(async (file) => {
      const resPath = `${pathToTempDir}/hexlet-io-_files/${file}`;
      const ff = await readFile(resPath, 'utf8');
      expect(ff && ff.length).toBeTruthy();
    });
  });

  afterAll(async () => {
    nock.cleanAll();
    scope.done();
  });
});

describe('page-loader, failures', () => {
  let pathToTempDir;
  beforeAll(async () => {
    nock.disableNetConnect();
    pathToTempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-fail-'));
  });
  test('fetch page failed', async () => {
    const scope = nock('https://example.com')
      .get('/')
      .reply(400);
    await expect(
      main('https://example.com', pathToTempDir),
    ).rejects.toThrow('Request failed with status code 400');
    scope.done();
  });
});
