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
const authorNameOrEmail = program.author
const pathToRepo = path.resolve(program.path)
const targetMonth = program.target
// console.log('--author:', authorNameOrEmail)
// console.log('--path:', pathToRepo)
// console.log('--from:', program.from)
// console.log('--to:', program.to)

function createDuration(targetMonth) {
  let to, from;
  if (!targetMonth) {
    from = dayjs().startOf('month')
    to = dayjs().endOf('month')
  } else {
    from = dayjs(targetMonth).startOf('month')
    to = dayjs(targetMonth).endOf('month')
  }

  return { from, to }
}

async function getDefaultEmail() {
  const defaultConfig = await nodegit.Config.openDefault()
  return await defaultConfig.getStringBuf('user.email')
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
  // walker.pushHead()
  const allCommits = await walker.getCommitsUntil(commits => true)
  const commits = allCommits.filter((commit) => {
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
  console.log(commits.length, 'of', allCommits.length, 'commits are found')
  return commits
}

async function main() {
  let author = await getDefaultEmail()
  if (authorNameOrEmail) {
    author = authorNameOrEmail
  }
  // console.log('collect commit by user:', author, 'from', pathToRepo)
  const { from, to } = createDuration(targetMonth)
  console.log('Collect commits between:', from.format('YYYY/MM/DD'), 'to:', to.format('YYYY/MM/DD'))

  const commits = await getAllCommits(author, from, to)
  let dateHeaders = []
  commits.forEach((commit) => {
    const dateId = dayjs(commit.date).startOf('day').toISOString()
    const header = dateHeaders.find(c => c.id === dateId)
    if (header) {
      header.dates.push(commit.date)
    } else {
      dateHeaders.push({
        id: dateId,
        dates: [commit.date],
      })
    }
  })

  dateHeaders = dateHeaders.sort((a, b) => new Date(a.id).getTime() - new Date(b.id).getTime())

  dateHeaders.forEach((header) => {
    // console.log(`--- ${dayjs(header.id).tz(defaultTimezone).format('YYYY/MM/DD')} ---`)
    const commitTimes = header.dates.sort((a, b) => a.getTime() - b.getTime())
      .map((date) => dayjs(date).tz(defaultTimezone).format('HH:mm'))
      .filter((e, i, a) => a.indexOf(e) === i)
      .join(' ')
    console.log(`${colors.green(dayjs(header.id).tz(defaultTimezone).format('YYYY/MM/DD'))} | ${colors.yellow(commitTimes)} |`)
  })
}

main()

// ref: https://qiita.com/highwide/items/236ab304e74a53cd3854
// ref: https://stackoverflow.com/questions/38335804/getting-all-commits-on-all-branches-with-nodegit