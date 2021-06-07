import commander from 'commander';
import main from './index.js';

const { program } = commander;

const app = async () => {
  program
    .version('1.0.0')
    .description('Сохранение страницы и ресурсов')
    .allowUnknownOption()
    .arguments('<pageUrl>')
    .option('-o, --output [dir]', 'output dir', process.cwd())
    .action((url, argv) => {
      const { output } = argv;
      main(url, output)
        .then(() => console.log(`Page loaded to ${output}`))
        .catch((error) => {
          console.error(error.message);
          process.exit(1);
        });
    })
    .parse(process.argv);
};

export default app;
