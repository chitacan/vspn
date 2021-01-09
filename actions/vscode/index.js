const {getInput, setFailed} = require("@actions/core");
const {exec} = require("@actions/exec");
const {join} = require('path');

(async () => {
  try {
    const workspace = process.env.GITHUB_WORKSPACE;

    const repo = getInput('repo');
    const uri = getInput('uri');

    if (!repo && !uri) {
      setFailed("'repo' or 'uri' required.");
      return;
    }

    const branch = getInput('branch');
    const goto = getInput('goto');

    const folderUri = repo ?
      join(workspace, repo, branch) :
      getInput('uri');
    const gotoPath = goto ?
      join(workspace, goto) :
      '';

    await exec('code', ['-n', '--folder-uri', folderUri, '--goto', gotoPath]);
  } catch (error) {
    setFailed(error);
  }
})();
