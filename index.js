const path = require('path')
const nodegit = require('nodegit')
const program = require('commander')
program
  .version('0.0.1')
  .usage('[options] <file ...>')
  .option('-a --author <value>', 'Author Name Or Email')
  .requiredOption('-p --path <path>', 'Project Path')
  .parse(process.argv)

const authorNameOrEmail = program.author
const pathToRepo = path.resolve(program.path)
console.log('--author:', authorNameOrEmail)
console.log('--path:', pathToRepo)

async function getDefaultEmail() {
  const defaultConfig = await nodegit.Config.openDefault()
  return await defaultConfig.getStringBuf('user.email')
}

async function main() {
  let author = await getDefaultEmail()
  if (authorNameOrEmail) {
    author = authorNameOrEmail
  }
  console.log('collect commit by user:', author, 'from', pathToRepo)
  let data = []
  const repo = await nodegit.Repository.open(pathToRepo)
  const firstCommit = await repo.getBranchCommit('develop')
  const history = firstCommit.history(nodegit.Revwalk.SORT.TIME)
  const commits = await new Promise((resolve) => {
    history.on('commit', async (commit) => {
      const name = commit.author().name()
      const email = commit.author().email()
      if (author !== name && author !== email) return
      data.push({
        date: commit.date(),
        sha: commit.sha(),
        name,
        email,
      })
    })
    history.on('end', commits => resolve(commits))
    history.start()
  })

  console.log(data.length, 'of', commits.length, 'commits are found')
}

main()

// ref: https://qiita.com/highwide/items/236ab304e74a53cd3854
