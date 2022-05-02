import nodegit from 'nodegit'
import dayjs from 'dayjs'
import { defaultTimezone } from './config.js'

import isBetween from 'dayjs/plugin/isBetween.js'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'
dayjs.extend(isBetween)
dayjs.extend(utc)
dayjs.extend(timezone)

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

export default Utils;
