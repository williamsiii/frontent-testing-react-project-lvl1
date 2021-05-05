const os = require('os');
const PageLoader = require('../src/index');

describe('page-loader', () => {
    beforeEach(() => {
        process.argv = process.argv.slice(0, 2)
    })


    test('download folder, default', () => {
        PageLoader.processArgs();
        expect(PageLoader.params.output).toEqual(process.cwd())
    })

    test('download folder, home directory', () => {
        process.argv.push('--output', os.homedir())
        PageLoader.processArgs();
        expect(PageLoader.params.output).toEqual(os.homedir())
    })

    test('download folder, wrong folder', () => {
        process.argv.push('--output', '/var/spoon/bar/tron/mud/jizz')
        PageLoader.processArgs();
        expect(PageLoader.params.output).toEqual(process.cwd())
    })
})