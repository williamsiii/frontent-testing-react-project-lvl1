import 'axios-debug-log';
import nock from 'nock';
import { PageLoader } from '../src/index';

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
