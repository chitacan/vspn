const {getInput, error, setOutput} = require("@actions/core");
const {exec} = require("@actions/exec");
const {join} = require('path');

(async () => {
  try {
    const workspace = process.env.GITHUB_WORKSPACE;

    const remote = getInput('remote');
    const folderUri = getInput('folderUri');
    const command = getInput('command');

    if (command !== 'arc' && !remote && !folderUri) {
      error("'command' or 'remote' or 'folderUri' required.");
      setOutput('status', 'failure');
      return;
    }

    if (command === 'arc') {
      const url = `https://vscode.dev/${getInput('path')}`
      await runAppleScript(`
        tell application "Arc"
          if (count of windows) is 0 then
            make new window
          end if

          tell front window
            make new tab with properties {URL: "${url}"}
          end tell

          activate
        end tell
      `)
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
