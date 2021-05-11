/**
 * @jest-environment node
 */
const PageLoader = require('../src/index');
const fs = require('fs');
const nock = require('nock');
const { setTimeout } = require('timers');

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


const fixture2 = `<!DOCTYPE html>
<html lang="ru">
  <head>
    <meta charset="utf-8">
    <title>Курсы по программированию Хекслет</title>
    <link rel="stylesheet" media="all" href="https://cdn2.hexlet.io/assets/menu.css">
    <link rel="stylesheet" media="all" href="/assets/application.css" />
    <link href="/courses" rel="canonical">
  </head>
  <body>
    <img src="/assets/professions/nodejs.png" alt="Иконка профессии Node.js-программист" />
    <h3>
      <a href="/professions/nodejs">Node.js-программист</a>
    </h3>
    <script src="https://js.stripe.com/v3/"></script>
    <script src="https://ru.hexlet.io/packs/js/runtime.js"></script>
  </body>
</html>`

describe('page-loader, parse response', () => {
  let scope1, scope2, scope3;
  beforeEach(() => {
    PageLoader.params.response = null;
    PageLoader.params.url = 'https://hexlet.io';
    PageLoader.params.fileName = 'test_folder';
    PageLoader.params.resourcesDir = null;
    PageLoader.params.resources = [];
    PageLoader.params.resourcesFileNames = [];
    PageLoader.params.originalResources = [];
    process.argv = process.argv.slice(0, 2)
    scope1 = nock('https://hexlet.io')
      .get(/.*/)
      .reply(200, 'some bytes')
    scope2 = nock('https://ru.hexlet.io')
      .get(/.*/)
      .reply(200, 'some bytes')
    scope3 = nock('https://cdn2.hexlet.io')
      .get(/.*/)
      .reply(200, 'some bytes')


  })

  test('parse img, default', async () => {
    PageLoader.params.response = fixture1;
    await PageLoader.parseForElement('img', 'src');
    expect(PageLoader.params.resources).toEqual(
      [
        "/assets/professions/nodejs.png",
        '/courses/assets/professions/nodejs1.png',
        "/assets/logos/funbox-3903337b3475d9698c0e77b5ad46720d8c0e4b94d17f6aa7d7fa19b40e39a356.svg"
      ])
  })

  test('parse links, default', async () => {
    PageLoader.params.response = fixture2;
    await PageLoader.parseForElement('link', 'href', PageLoader.linkCondition);
    expect(PageLoader.params.resources).toEqual(
      [
        "/assets/menu.css",
        '/assets/application.css',
      ])
  })

  test('parse scripts, default', async () => {
    PageLoader.params.response = fixture2;
    await PageLoader.parseForElement('script', 'src');
    expect(PageLoader.params.resources).toEqual(
      [
        "/packs/js/runtime.js"
      ])
  })


  test('parse all', async () => {
    PageLoader.params.response = fixture2;
    await PageLoader.parsePage();
    expect(PageLoader.params.resources).toEqual(
      [
        '/assets/professions/nodejs.png',
        "/assets/menu.css",
        '/assets/application.css',
        "/packs/js/runtime.js"
      ])
  })

  test('saved files', async () => {
    PageLoader.params.response = fixture2;
    await PageLoader.parsePage();
    await PageLoader.savePage();
    PageLoader.params.resourcesFileNames.map(file => {
      expect(fs.existsSync(file)).toBe(true)
    })
  })

  afterAll(() => {
    PageLoader.params.response = null;
    PageLoader.params.resources = [];
    PageLoader.params.resourcesFileNames = [];
    PageLoader.params.originalResources = [];
    // fs.rm(PageLoader.params.resourcesDir, { recursive: true, force: true }, () => { })
    scope1.done();
    scope2.done();
    scope3.done();
  })
})