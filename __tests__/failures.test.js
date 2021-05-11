/**
 * @jest-environment node
 */
const PageLoader = require('../src/index');
const nock = require('nock');

describe('page-loader, failures', () => {

    test('fetch page failed', async () => {
        PageLoader.params.url = 'https://example.com/';
        const scope = nock('https://example.com')
            .get('/')
            .reply(400)
        const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { });
        await PageLoader.fetchPage();
        expect(mockExit).toHaveBeenCalledWith(PageLoader.ERROR_CODES.COULD_NOT_FETCH);
        scope.done();
    })
})