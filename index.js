import path from 'path'
import { program } from 'commander'
import Output from './src/output.js'
import Utils from './src/utils.js'

import { createRequire } from "module";
const require = createRequire(import.meta.url);

program
  .version(require('./package.json').version)
  .option('-u, --user <value>', 'Author Name Or Email')
  .requiredOption('-p, --path <path>', 'Project Path')
  .option('-d, --date <date>', 'ISO 8601 format date like `2020-01`')
  // .option('-t, --target <string>', 'Target duration enum [`month`, `day`]')
  .parse()

const options = program.opts();

async function main() {
  const author = options.user ? options.user : await Utils.getAuthor()
  const { from, to } = Utils.createDuration(options.date)
  const allCommits = await Utils.getAllCommits(path.resolve(options.path))
  const commits = Utils.filterCommits(allCommits, author, from, to)

  Output.outputFoundMessage(commits.length, allCommits.length, options.date)
  Output.outputBlankLine()
  Output.outputTimeTable(Utils.createTimeTableFrom(commits))
  Output.outputBlankLine()
}

export default main;
