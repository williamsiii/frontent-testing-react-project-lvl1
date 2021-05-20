import os from 'os';
import { PageLoader } from '../src/index';

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
