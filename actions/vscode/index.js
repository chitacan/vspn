const {getInput, error, setOutput} = require("@actions/core");
const {exec} = require("@actions/exec");
const {join} = require('path');

(async () => {
  try {
    const workspace = process.env.GITHUB_WORKSPACE;

    const remote = getInput('remote');
    const folderUri = getInput('folderUri');
    const command = getInput('command');

    if (!remote && !folderUri) {
      error("'remote' or 'folderUri' required.");
      setOutput('status', 'failure');
      return;
    }

    if (remote) {
      await exec(command, ['-n', '--remote', remote, getInput('path')]);
    }

    if (folderUri) {
      await exec(command, ['-n', '--folder-uri', folderUri]);
    }

    setOutput('status', 'success');
  } catch (e) {
    error(e);
    setOutput('status', 'failure');
  }
})();
