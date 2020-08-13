const path = require('path')
const nodegit = require('nodegit')
const program = require('commander')
const dayjs = require('dayjs')
const isBetween = require('dayjs/plugin/isBetween')
const utc = require('dayjs/plugin/utc') // dependent on utc plugin
const timezone = require('dayjs/plugin/timezone')
dayjs.extend(isBetween)
dayjs.extend(utc)
dayjs.extend(timezone)

program
  .version('0.0.1')
  .usage('[options] <file ...>')
  .option('-a --author <value>', 'Author Name Or Email')
  .requiredOption('-p --path <path>', 'Project Path')
  .option('--from <date>', 'Duration from')
  .option('--to <date>', 'Duration to')
  .parse(process.argv)

const authorNameOrEmail = program.author
const pathToRepo = path.resolve(program.path)
const fromDate = program.from
const toDate = program.to
// console.log('--author:', authorNameOrEmail)
// console.log('--path:', pathToRepo)
// console.log('--from:', program.from)
// console.log('--to:', program.to)

function createDuration(fromStr, toStr) {
  let to, from;
  if (!fromStr && !toStr) {
    from = dayjs().startOf('month')
    to = dayjs().endOf('month')
  } else if (fromStr && !toStr) {
    from = dayjs(fromStr).startOf('month')
    to = dayjs(from).endOf('month')
  } else if (!fromStr && toStr) {
    to = dayjs(toStr).endOf('month')
    from = dayjs(to).startOf('month')
  } else {
    from = dayjs(fromStr).startOf('month')
    to = dayjs(toStr).endOf('month')
  }

  return {
    from: from.toDate(),
    to: to.toDate(),
  }
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
  console.log('collect commit by user:', author, 'from', pathToRepo)
  const { from, to } = createDuration(fromDate, toDate)
  console.log('collect commit between:', from, 'to:', to)

  const commits = await getAllCommits(author, from, to)
  let commitsByDay = {}
  commits.forEach((commit) => {
    const dateKey = dayjs(commit.date).startOf('day').toISOString()
    if (commitsByDay[dateKey]) {
      commitsByDay[dateKey].push(commit.date)
    } else {
      commitsByDay[dateKey] = [commit.date]
    }
    // console.log(dayjs(commit.date).tz('Asia/Tokyo').format('YYYY/MM/DD HH:mm'))
  })
  // console.log(commitsByDay)
  for (let day in commitsByDay) {
    console.log(dayjs(day).tz('Asia/Tokyo').format('YYYY/MM/DD'))
    const commitTimes = commitsByDay[day].sort((a, b) => {
      return a.getTime() - b.getTime()
    }).map(day => {
      return dayjs(day).tz('Asia/Tokyo').format('HH:mm')
    }).join(' ')
    console.log(`| ${commitTimes} |`)
  }
}

main()

// ref: https://qiita.com/highwide/items/236ab304e74a53cd3854
