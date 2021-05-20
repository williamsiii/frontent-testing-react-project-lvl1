import fs from 'fs';
import nock from 'nock';
import { PageLoader } from '../src/index';
import fixture from '../__fixtures__';

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
