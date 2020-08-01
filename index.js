const path = require('path')
const nodegit = require('nodegit')
const pathToRepo = path.resolve('../mammoth2/.git')

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
