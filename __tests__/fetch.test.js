/**
 * @jest-environment node
 */

const PageLoader = require('../src/index');
const fc = require('fast-check');
const nock = require('nock');
require('axios-debug-log')({
    request: function (debug, config) {
        debug('Request with ' + config.headers['content-type'])
    },
    response: function (debug, response) {
        debug(
            'Response with ' + response.headers['content-type'],
            'from ' + response.config.url
        )
    },
    error: function (debug, error) {
        debug('Axios Error', error)
    }
})

describe('page-loader, fetch', () => {
    beforeEach(() => {
        PageLoader.params.response = PageLoader.INIT_STATE.response;
        process.argv = process.argv.slice(0, 2)
    })

    test('compose filename', () => {
        fc.assert(
            fc.property(
                fc.domain(),
                data => {
                    const url = PageLoader.composeName(data);
                    expect(url)
                        .toEqual(expect.stringMatching(/[0-9a-zA-Z\-]+/))
                }
            )
        )
    })

    test('fetch page', async () => {
        PageLoader.params.url = 'https://example.com/';
        const scope = nock('https://example.com')
            .get('/')
            .reply(200, 'some html')
        await PageLoader.fetchPage()
        expect(PageLoader.params.response).toEqual('some html')
        scope.done();
    })

    test('fetch page failed', async () => {
        PageLoader.params.url = 'https://example.com/';
        const scope = nock('https://example.com')
            .get('/')
            .reply(400)
        await PageLoader.fetchPage()
        expect(PageLoader.params.response).toBeNull()
        scope.done();
    })
})