/**
 * @jest-environment node
 */

const os = require('os');
const fc = require('fast-check');
const nock = require('nock');
const PageLoader = require('../src/index');

describe('page-loader', () => {
    beforeEach(() => {
        PageLoader.params.output = PageLoader.INIT_STATE.output;
        PageLoader.params.response = PageLoader.INIT_STATE.response;
        process.argv = process.argv.slice(0, 2)
    })

    test('download folder, default', () => {
        PageLoader.processArgs();
        expect(PageLoader.params.output).toEqual(process.cwd())
    })

    test('download folder, home directory', () => {
        process.argv.push('--output', os.homedir())
        PageLoader.processArgs();
        expect(PageLoader.params.output).toEqual(os.homedir() + '/')
    })

    test('download folder, wrong folder', () => {
        process.argv.push('--output', '/var/spoon/bar/tron/mud/jizz')
        PageLoader.processArgs();
        expect(PageLoader.params.output).toEqual(process.cwd())
    })

    test('url, default', () => {
        PageLoader.processArgs();
        expect(PageLoader.params.url).toEqual(PageLoader.defaultUrl)
    })

    test('url, argument', () => {
        process.argv.push('-u', 'https://yandex.ru')
        PageLoader.processArgs();
        expect(PageLoader.params.url).toEqual('https://yandex.ru')
    })

    test('compose filename', () => {
        fc.assert(
            fc.property(
                fc.domain(),
                data => {
                    PageLoader.params.url = data;
                    PageLoader.composeName();
                    expect(PageLoader.params.fileName)
                        .toEqual(expect.stringMatching(/[0-9a-zA-Z\-]+(\.html)$/))
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