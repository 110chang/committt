const path = require('path')
const nodegit = require('nodegit')
const program = require('commander')
const colors = require('colors')
const dayjs = require('dayjs')

dayjs.extend(require('dayjs/plugin/isBetween'))
dayjs.extend(require('dayjs/plugin/utc'))
dayjs.extend(require('dayjs/plugin/timezone'))

program
  .version('0.0.1')
  .option('-u --user <value>', 'Author Name Or Email')
  .requiredOption('-p --path <path>', 'Project Path')
  .option('-t --target <date>', 'Target month like `2020/01`')
  .parse(process.argv)

const defaultTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
const userNameOrEmail = program.user
const pathToRepo = path.resolve(program.path)
const targetMonth = program.target

function createDuration(targetMonth) {
  const from = dayjs(targetMonth).startOf('month')
  const to = dayjs(targetMonth).endOf('month')

  return { from, to }
}

async function getDefaultEmail() {
  const defaultConfig = await nodegit.Config.openDefault()
  return await defaultConfig.getStringBuf('user.email')
}

async function getAuthor(nameOrEmail) {
  if (nameOrEmail) return nameOrEmail

  const author = await getDefaultEmail()
  console.log(`Author not specified. Using email ${author} from global config`.grey)
  return author
}

// async function getCommitsOf(branchName, author, from, to) {
//   let data = []
//   const repo = await nodegit.Repository.open(pathToRepo)
//   const firstCommit = await repo.getBranchCommit(branchName)
//   const history = firstCommit.history(nodegit.Revwalk.SORT.TIME)
//   const commits = await new Promise((resolve) => {
//     history.on('commit', async (commit) => {
//       const date = commit.date()
//       const name = commit.author().name()
//       const email = commit.author().email()
//       if (author !== name && author !== email) return
//       if (!dayjs(date).isBetween(from, to)) return
//       data.push({ date, sha: commit.sha(), name, email })
//     })
//     history.on('end', commits => resolve(commits))
//     history.start()
//   })
//   console.log(data.length, 'of', commits.length, 'commits are found')
//   return data
// }

async function getAllCommits() {
  const repo = await nodegit.Repository.open(pathToRepo)
  const walker = nodegit.Revwalk.create(repo)
  walker.pushGlob('refs/heads/*')
  return await walker.getCommitsUntil(() => true)
}

function filterCommits(commits, author, from, to) {
  return commits.filter((commit) => {
    const date = new Date(commit.author().when().time() * 1000)
    const name = commit.author().name()
    const email = commit.author().email()
    return (author === name || author === email) && dayjs(date).isBetween(from, to)
  }).map((commit) => {
    const date = new Date(commit.author().when().time() * 1000)
    const name = commit.author().name()
    const email = commit.author().email()
    return { date, sha: commit.sha(), name, email }
  })
}

function outputFoundMessage(found, total, month) {
  const foundMsg = colors.cyan(found)
  const totalMsg = colors.cyan(total)
  const monthMsg = colors.cyan(dayjs(month).format('YYYY/MM'))
  console.log(`${foundMsg} of ${totalMsg} commits are found in ${monthMsg}`)
}

function outputDateRow(date, timesStr) {
  const dateMsg = colors.green(dayjs(date).tz(defaultTimezone).format('YYYY/MM/DD'))
  console.log(`${dateMsg} | ${colors.yellow(timesStr)} |`)
}

function outputBlankLine() {
  console.log()
}

async function main() {
  const author = await getAuthor(userNameOrEmail)
  const { from, to } = createDuration(targetMonth)
  const allCommits = await getAllCommits()
  const commits = filterCommits(allCommits, author, from, to)

  outputFoundMessage(commits.length, allCommits.length, targetMonth)

  let rows = []
  commits.forEach((commit) => {
    const ISODate = dayjs(commit.date).startOf('day').toISOString()
    const existingRow = rows.find(r => r.ISODate === ISODate)
    if (existingRow) {
      existingRow.timetable.push(commit.date)
    } else {
      rows.push({ ISODate, timetable: [commit.date] })
    }
  })
  outputBlankLine()
  rows.sort((a, b) => new Date(a.ISODate).getTime() - new Date(b.ISODate).getTime()).forEach((row) => {
    const commitTimes = row.timetable.sort((a, b) => a.getTime() - b.getTime())
      .map((date) => dayjs(date).tz(defaultTimezone).format('HH:mm'))
      .filter((e, i, a) => a.indexOf(e) === i)
      .join(' ')

    outputDateRow(row.ISODate, commitTimes)
  })
  outputBlankLine()
}

module.exports = main;
module.exports.default = main;

// ref: https://qiita.com/highwide/items/236ab304e74a53cd3854
// ref: https://stackoverflow.com/questions/38335804/getting-all-commits-on-all-branches-with-nodegit