import chalk from 'chalk'
import dayjs from 'dayjs'
import { defaultTimezone } from './config.js'

import isBetween from 'dayjs/plugin/isBetween.js'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'
dayjs.extend(isBetween)
dayjs.extend(utc)
dayjs.extend(timezone)

class Output {
  static outputFoundMessage(found, total, month) {
    const foundMsg = chalk.cyan(found)
    const totalMsg = chalk.cyan(total)
    const monthMsg = chalk.cyan(dayjs(month).format('YYYY/MM'))
    console.log(`${foundMsg} of ${totalMsg} commits are found in ${monthMsg}`)
  }

  static outputDateRow(date, timesStr) {
    const dateMsg = chalk.green(dayjs(date).tz(defaultTimezone).format('YYYY/MM/DD'))
    console.log(`${dateMsg} | ${chalk.yellow(timesStr)} |`)
  }

  static outputTimeTable(rows = []) {
    rows.forEach(row => Output.outputDateRow(row.ISODate, row.commitTimes))
  }

  static outputBlankLine() {
    console.log()
  }
}

export default Output
