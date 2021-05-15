import os from 'os';
import { PageLoader } from '../src/index';

describe('page-loader, setup', () => {
  beforeAll(() => {
    PageLoader.initOptions();
  });

  beforeEach(() => {
    PageLoader.params.output = PageLoader.INIT_STATE.output;
  });

  test('download folder, default', async () => {
    const origin = PageLoader.params.output;
    await PageLoader.getOptions();
    expect(PageLoader.params.output).toEqual(origin);
  });

  test('download folder, home directory', async () => {
    process.argv.push('--output', os.homedir());
    await PageLoader.getOptions();
    expect(PageLoader.params.output).toEqual(`${os.homedir()}/`);
  });

  test('download folder, wrong folder', () => {
    const origin = PageLoader.params.output;
    process.argv.push('--output', '/var/spoon/bar/tron/mud/jizz');
    PageLoader.getOptions();
    expect(PageLoader.params.output).toEqual(origin);
  });

  test('url, default', async () => {
    await PageLoader.getOptions();
    expect(PageLoader.params.url).toEqual(PageLoader.defaultUrl);
  });

  test('url, argument', async () => {
    process.argv.push('-u', 'https://yandex.ru');
    await PageLoader.getOptions();
    expect(PageLoader.params.url).toEqual('https://yandex.ru');
  });
});
