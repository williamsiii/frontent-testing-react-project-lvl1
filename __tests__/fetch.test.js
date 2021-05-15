import 'axios-debug-log';
import fc from 'fast-check';
import nock from 'nock';
import { PageLoader } from '../src/index';

describe('page-loader, fetch', () => {
  beforeEach(() => {
    PageLoader.params.response = PageLoader.INIT_STATE.response;
    process.argv = process.argv.slice(0, 2);
  });

  test('compose filename', () => {
    fc.assert(
      fc.property(
        fc.domain(),
        (data) => {
          const url = PageLoader.composeName(data);
          expect(url)
            .toEqual(expect.stringMatching(/[0-9a-zA-Z-]+/));
        },
      ),
    );
  });

  test('fetch page', async () => {
    PageLoader.params.url = 'https://example.com/';
    const scope = nock('https://example.com')
      .get('/')
      .reply(200, 'some html');
    await PageLoader.fetchPage();
    expect(PageLoader.params.response).toEqual('some html');
    scope.done();
  });
});
