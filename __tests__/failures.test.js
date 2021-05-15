import { PageLoader } from '../src/index';
import nock from 'nock';

describe('page-loader, failures', () => {

    test('fetch page failed', async () => {
        PageLoader.params.url = 'https://example.com/';
        const scope = nock('https://example.com')
            .get('/')
            .reply(400)
        const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { });
        await PageLoader.fetchPage();
        expect(mockExit).toHaveBeenCalled();
        scope.done();
    })
})