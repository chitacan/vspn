const {getInput, error, setOutput} = require("@actions/core");
const {exec} = require("@actions/exec");
const {join} = require('path');

(async () => {
  try {
    const workspace = process.env.GITHUB_WORKSPACE;

    const repo = getInput('repo');
    const uri = getInput('uri');

    if (!repo && !uri) {
      error("'repo' or 'uri' required.");
      setOutput('status', 'failure');
      return;
    }

    const branch = getInput('branch');
    const goto = getInput('goto');

    const folderUri = repo ? join(workspace, repo, branch) : getInput('uri');
    const gotoPath = (goto && goto !== '') ? ['--goto', join(workspace, goto)] : [];

    await exec('code', ['-n', '--folder-uri', folderUri, ...gotoPath]);
    setOutput('status', 'success');
  } catch (e) {
    setOutput('status', 'failure');
  }
})();
