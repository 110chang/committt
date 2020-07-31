const path = require('path')
const nodegit = require('nodegit')
const pathToRepo = path.resolve('../mammoth2/.git')

nodegit.Repository.open(pathToRepo)
  .then(function(repo) {
    return repo.getBranchCommit('develop');
  })
  .then(function(firstCommit){
    // History returns an event.
    var history = firstCommit.history(nodegit.Revwalk.SORT.TIME);

    // History emits "commit" event for each commit in the branch's history
    history.on("commit", function(commit) {
      console.log("commit " + commit.sha());
      console.log("Author:", commit.author().name() +
        " <" + commit.author().email() + ">");
      console.log("Date:", commit.date());
      console.log("\n    " + commit.message());
    });

    // Don't forget to call `start()`!
    history.start();
  })
  // .done();