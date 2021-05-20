#!/usr/bin/env node
import commander from 'commander';
import Util from '../src/index.js';

const { program } = commander;

const app = () => {
  program
    .version('1.0.0')
    .description('Сохранение страницы и ресурсов')
    .allowUnknownOption()
    .option('-o, --output [dir]', 'output dir')
    .option('-u, --url <url>', 'Set page address for downloading')
    .action((options) => Util(options.output, options.url)
      .then((filepath) => console.log(`Страница сохранена в "${filepath}"`))
      .catch((error) => {
        console.error(error.message);

        process.exit(1);
      }));

  program.parse(process.argv);
}

export default app;

