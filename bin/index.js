#!/usr/bin/env node
import commander from 'commander';
import main from '../src/index.js';

const { program } = commander;

const app = async () => {
  const defaultPath = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'))
  program
    .version('1.0.0')
    .description('Сохранение страницы и ресурсов')
    .allowUnknownOption()
    .option('-o, --output [dir]', 'output dir', defaultPath)
    .option('-u, --url <url>', 'Set page address for downloading')
    .action(async (options) => await main(options.output, options.url)
      .then(() => console.log(`Страница сохранена в "${PageLoader.params.finalPath}"`))
      .catch((error) => {
        console.error(error.message);

        process.exit(1);
      }));

  program.parse(process.argv);
};

app()
// export default app;
