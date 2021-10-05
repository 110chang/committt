const colors = require('colors')
const dayjs = require('dayjs')
const { defaultTimezone } = require('./config.js')

dayjs.extend(require('dayjs/plugin/isBetween'))
dayjs.extend(require('dayjs/plugin/utc'))
dayjs.extend(require('dayjs/plugin/timezone'))

class Output {
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
    rows.forEach(row => Output.outputDateRow(row.ISODate, row.commitTimes))
  }

  static outputBlankLine() {
    console.log()
  }
}

module.exports = Output;
module.exports.default = Output;
