import nock from 'nock';
import { readFile, readdir } from 'fs/promises';
import 'axios-debug-log';
import main from '../src/index';

describe('page-loader, parse response', () => {
  let scope;
  let fixture = null;
  const testDir = `${process.cwd()}/hexlet-io-_files`;
  beforeAll(async () => {
    fixture = await readFile('./__fixtures__/index.html', 'utf8');
  });

  beforeEach(() => {
    process.argv = process.argv.slice(0, 2);
    scope = nock(/hexlet\.io/)
      .persist()
      .get(/\/.{0,}/)
      .reply(200, fixture);
  });

  test('parse resources, default', async () => {
    await main(process.cwd(), 'https://hexlet.io/');
    const res = await readdir(testDir);
    expect(res).toMatchObject(expect.arrayContaining([
      '-assets-professions-nodejs.png',
      '-assets-menu.css',
      '-assets-application.css',
      '-packs-js-runtime.js',
    ]));
  });

  test('file contents', async () => {
    await main(process.cwd(), 'https://hexlet.io/');
    const res = await readdir(testDir);
    res.forEach(async (file) => {
      const path = `${testDir}/${file}`;
      const ff = await readFile(path, 'utf8');
      expect(ff && ff.length).toBeTruthy();
    });
  });

  afterAll(async () => {
    scope.done();
  });
});

describe('page-loader, failures', () => {
  test('fetch page failed', async () => {
    const scope = nock('https://example.com')
      .get('/')
      .reply(400);
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { });
    await main(undefined, 'https://example.com');
    expect(mockExit).toHaveBeenCalled();
    scope.done();
  });
});
