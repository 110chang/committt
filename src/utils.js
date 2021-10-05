const nodegit = require('nodegit')
const colors = require('colors')
const dayjs = require('dayjs')

dayjs.extend(require('dayjs/plugin/isBetween'))
dayjs.extend(require('dayjs/plugin/utc'))
dayjs.extend(require('dayjs/plugin/timezone'))

const defaultTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone

class Utils {
  static createDuration(date) {
    const from = dayjs(date).startOf('month')
    const to = dayjs(date).endOf('month')
  
    return { from, to }
  }

  static async getDefaultEmail() {
    const defaultConfig = await nodegit.Config.openDefault()
    return await defaultConfig.getStringBuf('user.email')
  }

  static async getAuthor() {
    const author = await Utils.getDefaultEmail()
    console.log(`Author not specified. Using email ${author} from global config`.grey)
    return author
  }

  static async getAllCommits(pathToRepo) {
    const repo = await nodegit.Repository.open(pathToRepo)
    const walker = nodegit.Revwalk.create(repo)
    walker.pushGlob('refs/heads/*')
    return await walker.getCommitsUntil(() => true)
  }

  static filterCommits(commits, author, from, to) {
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

  static outputFoundMessage(found, total, month) {
    const foundMsg = colors.cyan(found)
    const totalMsg = colors.cyan(total)
    const monthMsg = colors.cyan(dayjs(month).format('YYYY/MM'))
    console.log(`${foundMsg} of ${totalMsg} commits are found in ${monthMsg}`)
  }

  static outputDateRow(date, timesStr) {
    const dateMsg = colors.green(dayjs(date).tz(defaultTimezone).format('YYYY/MM/DD'))
    console.log(`${dateMsg} | ${colors.yellow(timesStr)} |`)
  }

  static outputTimeTable(rows = []) {
    rows.forEach(row => Utils.outputDateRow(row.ISODate, row.commitTimes))
  }

  static outputBlankLine() {
    console.log()
  }

  static createTimeTableFrom(commits) {
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

    rows = rows.sort((a, b) => new Date(a.ISODate).getTime() - new Date(b.ISODate).getTime()).map((row) => {
      const commitTimes = row.timetable.sort((a, b) => a.getTime() - b.getTime())
        .map((date) => dayjs(date).tz(defaultTimezone).format('HH:mm'))
        .filter((e, i, a) => a.indexOf(e) === i)
        .join(' ')

      return {
        ...row,
        commitTimes,
      }
    })

    return rows;
  }
}

module.exports = Utils;
module.exports.default = Utils;
