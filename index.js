const path = require('path')
const nodegit = require('nodegit')
const program = require('commander')
program.parse(process.argv)

const pathToRepo = path.resolve(program.args[0])

async function main() {
  const repo = await nodegit.Repository.open(pathToRepo)
  const firstCommit = await repo.getBranchCommit('develop')
  const history = firstCommit.history(nodegit.Revwalk.SORT.TIME)
  const commits = await new Promise((resolve) => {
    history.on('end', c => resolve(c))
    history.start()
  })
  console.log(commits.length)
}

main()

// ref: https://qiita.com/highwide/items/236ab304e74a53cd3854
