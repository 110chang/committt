const path = require('path')
const { program } = require('commander')
const dayjs = require('dayjs')
const Output = require('./src/output.js')
const Utils = require('./src/utils.js')

dayjs.extend(require('dayjs/plugin/isBetween'))
dayjs.extend(require('dayjs/plugin/utc'))
dayjs.extend(require('dayjs/plugin/timezone'))

program
  .version(require('./package.json').version)
  .option('-u, --user <value>', 'Author Name Or Email')
  .requiredOption('-p, --path <path>', 'Project Path')
  .option('-d, --date <date>', 'Target month like `2020/01`')
  .option('-t, --target <string>', 'Target duration enum [`month`, `day`]')
  .parse()

const options = program.opts();

async function main() {
  const author = options.user ? options.user : await Utils.getAuthor()
  const { from, to } = Utils.createDuration(options.target)
  const allCommits = await Utils.getAllCommits(path.resolve(options.path))
  const commits = Utils.filterCommits(allCommits, author, from, to)

  Output.outputFoundMessage(commits.length, allCommits.length, options.target)
  Output.outputBlankLine()
  Output.outputTimeTable(Utils.createTimeTableFrom(commits))
  Output.outputBlankLine()
}

module.exports = main;
module.exports.default = main;
