import nock from 'nock';
import os from 'os';
import fs from 'fs';
import 'axios-debug-log';
import { PageLoader } from '../src/index';
import fixture from '../__fixtures__';

describe('page-loader, setup', () => {
  test('download folder, default', async () => {
    await PageLoader.main();
    expect(PageLoader.params.output).toEqual(PageLoader.INIT_STATE.output);
  });

  test('download folder, home directory', async () => {
    await PageLoader.main(os.homedir());
    expect(PageLoader.params.output).toEqual(`${os.homedir()}/`);
  });

  test('download folder, wrong folder', async () => {
    await PageLoader.main('/var/spoon/bar/tron/mud/jizz');
    expect(PageLoader.params.output).toEqual(PageLoader.INIT_STATE.output);
  });

  test('url, default', async () => {
    await PageLoader.main();
    expect(PageLoader.params.url).toEqual(PageLoader.defaultUrl);
  });

  test('url, argument', async () => {
    await PageLoader.main(undefined, 'https://yandex.ru');
    expect(PageLoader.params.url).toEqual('https://yandex.ru');
  });
});

describe('page-loader, fetch', () => {
  beforeAll(() => {
    process.argv = process.argv.slice(0, 2);
  });

  test('fetch page', async () => {
    const scope = nock('https://example.com')
      .get('/')
      .reply(200, 'some html');
    await PageLoader.main(undefined, 'https://example.com/');
    expect(PageLoader.params.response).toEqual('some html');
    scope.done();
  });
});

describe('page-loader, parse response', () => {
  let scope;
  let scope1;
  let scope2;
  let scope3;
  beforeEach(() => {
    PageLoader.params.response = null;
    PageLoader.params.url = 'https://hexlet.io';
    PageLoader.params.fileName = 'test_folder';
    PageLoader.params.resourcesDir = null;
    PageLoader.params.resources = [];
    PageLoader.params.resourcesFileNames = [];
    PageLoader.params.originalResources = [];
    process.argv = process.argv.slice(0, 2);
    scope = nock('https://hexlet.io')
      .get('/')
      .reply(200, fixture);
    scope1 = nock('https://hexlet.io')
      .get(/\/.{1,}/)
      .reply(200, 'some bytes');
    scope2 = nock('https://ru.hexlet.io')
      .get(/\/.{1,}/)
      .reply(200, 'some bytes');
    scope3 = nock('https://cdn2.hexlet.io')
      .get(/\/.{1,}/)
      .reply(200, 'some bytes');
  });

  test('parse resources, default', async () => {
    await PageLoader.main(undefined, 'https://hexlet.io/');
    expect(PageLoader.params.resources).toEqual(
      [
        '/assets/professions/nodejs.png',
        '/assets/menu.css',
        '/assets/application.css',
        '/packs/js/runtime.js',
      ],
    );
  });

  test('saved files', async () => {
    await PageLoader.main();
    PageLoader.params.resourcesFileNames.forEach((file) => {
      expect(fs.existsSync(file)).toBe(true);
    });
  });

  afterAll(() => {
    PageLoader.params.response = null;
    PageLoader.params.resources = [];
    PageLoader.params.resourcesFileNames = [];
    PageLoader.params.originalResources = [];
    fs.rm(PageLoader.params.resourcesDir, { recursive: true, force: true }, () => { });
    scope.done();
    scope1.done();
    scope2.done();
    scope3.done();
  });
});

describe('page-loader, failures', () => {
  test('fetch page failed', async () => {
    const scope = nock('https://example.com')
      .get('/')
      .reply(400);
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { });
    await PageLoader.main(undefined, 'https://example.com');
    expect(mockExit).toHaveBeenCalled();
    scope.done();
  });
});
