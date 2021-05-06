const PageLoader = require('../src/index');
const os = require('os');

describe('page-loader, setup', () => {
    beforeEach(() => {
        PageLoader.params.output = PageLoader.INIT_STATE.output;
        process.argv = process.argv.slice(0, 2)
    })

    test('download folder, default', () => {
        const origin = PageLoader.params.output;
        PageLoader.getOptions();
        expect(PageLoader.params.output).toEqual(origin)
    })

    test('download folder, home directory', () => {
        process.argv.push('--output', os.homedir())
        PageLoader.getOptions();
        expect(PageLoader.params.output).toEqual(os.homedir() + '/')
    })

    test('download folder, wrong folder', () => {
        const origin = PageLoader.params.output;
        process.argv.push('--output', '/var/spoon/bar/tron/mud/jizz')
        PageLoader.getOptions();
        expect(PageLoader.params.output).toEqual(origin)
    })

    test('url, default', () => {
        PageLoader.getOptions();
        expect(PageLoader.params.url).toEqual(PageLoader.defaultUrl)
    })

    test('url, argument', () => {
        process.argv.push('-u', 'https://yandex.ru')
        PageLoader.getOptions();
        expect(PageLoader.params.url).toEqual('https://yandex.ru')
    })


})