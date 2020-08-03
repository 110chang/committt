const path = require('path')
const nodegit = require('nodegit')

// commanderモジュールをprogramオブジェクトとしてインポートする
const program = require("commander")
// コマンドライン引数をパースする
program.parse(process.argv)

const pathToRepo = path.resolve(program.args[0])

nodegit.Repository.open(pathToRepo)
  .then(function(repo) {
    return repo.getBranchCommit('develop')
  })
  .then(function(firstCommit){
    const history = firstCommit.history(nodegit.Revwalk.SORT.TIME)

    history.on('end', function(commits) {
      // Use commits
      console.log(commits.length)
      commits.forEach(commit => {
        console.log(`Commit: ${commit.sha()}`)
        console.log(`Author: ${commit.author().name()} ${commit.author().email()}`)
        console.log(`Date: ${commit.date()}`)
      })
    })

    history.start()
  })
// ref: https://qiita.com/highwide/items/236ab304e74a53cd3854