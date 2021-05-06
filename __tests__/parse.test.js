const PageLoader = require('../src/index');
const os = require('os');
const fs = require('fs');
const { fstat } = require('fs');

const fixture1 = `<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="utf-8">
    <title>Курсы по программированию Хекслет</title>
  </head>
  <body>
    <img src="/assets/professions/nodejs.png" alt="Иконка профессии Node.js-программист" />
    <img src="https://ru.hexlet.io/courses/assets/professions/nodejs1.png" alt="Иконка профессии Node.js-программист" />
    <img src="https://cdn2.hexlet.io/assets/logos/funbox-3903337b3475d9698c0e77b5ad46720d8c0e4b94d17f6aa7d7fa19b40e39a356.svg" alt="Иконка профессии Node.js-программист" />
    <img src="https://yandex.ru/courses/assets/professions/sun.png" alt="Иконка профессии Node.js-программист" />
    <h3>
      <a href="/professions/nodejs">Node.js-программист</a>
    </h3>
  </body>
</html>`


describe('page-loader, parse response', () => {
    beforeEach(() => {
        PageLoader.params.response = null;
        PageLoader.params.url = 'https://hexlet.io';
        PageLoader.params.fileName = 'test_folder';
        PageLoader.params.resourcesDir = null;
        PageLoader.params.resources = [];
        PageLoader.params.resourcesFileNames = [];
        PageLoader.params.originalResources = [];
        process.argv = process.argv.slice(0, 2)
    })

    test('parse response, default', async () => {
        PageLoader.params.response = fixture1;
        await PageLoader.parsePage();
        expect(PageLoader.params.resources).toEqual(
            [
                "/assets/professions/nodejs.png",
                '/courses/assets/professions/nodejs1.png',
                "/assets/logos/funbox-3903337b3475d9698c0e77b5ad46720d8c0e4b94d17f6aa7d7fa19b40e39a356.svg"
            ])
    })

    test('saved files', async () => {
        PageLoader.params.response = fixture1;
        await PageLoader.parsePage();
        PageLoader.params.resourcesFileNames.map(file => {
            expect(fs.existsSync(file)).toBe(true)
        })
    })

    afterAll(() => {
        PageLoader.params.response = null;
        PageLoader.params.resources = [];
        PageLoader.params.resourcesFileNames = [];
        PageLoader.params.originalResources = [];
        fs.rm(PageLoader.params.resourcesDir, { recursive: true, force: true }, () => { })
    })
})