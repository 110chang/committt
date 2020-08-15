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

async function getAllCommits(author, from, to) {
  const repo = await nodegit.Repository.open(pathToRepo)
  const walker = nodegit.Revwalk.create(repo)
  walker.pushGlob('refs/heads/*')
  return await walker.getCommitsUntil(commits => true)
}

function filterCommits(commits, author, from, to) {
  return commits.filter((commit) => {
    const date = commit.date()
    const name = commit.author().name()
    const email = commit.author().email()
    return (author === name || author === email) && dayjs(date).isBetween(from, to)
  }).map((commit) => {
    const date = commit.date()
    const name = commit.author().name()
    const email = commit.author().email()
    return { date, sha: commit.sha(), name, email }
  })
}

async function main() {
  const author = await getAuthor(userNameOrEmail)
  const { from, to } = createDuration(targetMonth)
  const allCommits = await getAllCommits(author, from, to)
  const commits = filterCommits(allCommits, author, from, to)

  console.log(`${colors.cyan(commits.length)} of ${colors.cyan(allCommits.length)} commits are found in ${colors.cyan(dayjs(targetMonth).format('YYYY/MM'))}`)

  let dateHeaders = []
  commits.forEach((commit) => {
    const dateId = dayjs(commit.date).startOf('day').toISOString()
    const header = dateHeaders.find(c => c.id === dateId)
    if (header) {
      header.dates.push(commit.date)
    } else {
      dateHeaders.push({ id: dateId, dates: [commit.date] })
    }
  })
  console.log()
  dateHeaders.sort((a, b) => new Date(a.id).getTime() - new Date(b.id).getTime()).forEach((header) => {
    // console.log(`--- ${dayjs(header.id).tz(defaultTimezone).format('YYYY/MM/DD')} ---`)
    const commitTimes = header.dates.sort((a, b) => a.getTime() - b.getTime())
      .map((date) => dayjs(date).tz(defaultTimezone).format('HH:mm'))
      .filter((e, i, a) => a.indexOf(e) === i)
      .join(' ')
    console.log(`${colors.green(dayjs(header.id).tz(defaultTimezone).format('YYYY/MM/DD'))} | ${colors.yellow(commitTimes)} |`)
  })
  console.log()
}

main()

// ref: https://qiita.com/highwide/items/236ab304e74a53cd3854
// ref: https://stackoverflow.com/questions/38335804/getting-all-commits-on-all-branches-with-nodegit