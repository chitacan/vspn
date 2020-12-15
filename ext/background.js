const GH_API = 'https://api.github.com'

async function getOptions() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['token', 'host', 'runner_repo'], (result) => {
      if (!result.token && !result.host) {
        chrome.runtime.openOptionsPage()
        reject('no options')
      } else {
        resolve(result)
      }
    })
  })
}

async function workflowDispatch(path, headRef) {
  console.log(path, headRef)

  const {host, token, runner_repo} = await getOptions();
  const [repo, branch] = headRef.split(':')
  const workflowId = `run_vscode_${host}.yml`

  await fetch(`${GH_API}/repos/${runner_repo}/actions/workflows/${workflowId}/dispatches`, {
    method: 'POST',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json'
    },
    body: JSON.stringify({
      ref: 'master',
      inputs: {
        repo,
        branch
      }
    })
  })

  // find workflow_run
  const workflowRun = await new Promise(resolve => {
    const id = setInterval(async () => {
      const {workflow_runs} = await fetch(`${GH_API}/repos/${runner_repo}/actions/workflows/${workflowId}/runs?status=in_progress`, {
        headers: {
          Authorization: `token ${token}`,
        }
      })
      .then(d => d.json());
      if (workflow_runs.length > 0) {
        clearInterval(id)
        resolve(workflow_runs[0])
      }
    }, 3500)
  })

  // check workflow_run completed
  await new Promise(resolve => {
    const id = setInterval(async () => {
      const {status} = await fetch(`${GH_API}/repos/${runner_repo}/actions/runs/${workflowRun.id}`, {
        headers: {
          Authorization: `token ${token}`
        }
      })
      .then(d => d.json());
      if (status === 'completed') {
        clearInterval(id)
        resolve()
      }
    }, 3500)
  })
}

chrome.runtime.onMessage.addListener(({command, path, headRef}, sender, send) => {
  if (command === 'OPEN_VSCODE') {
    workflowDispatch(path, headRef)
      .then(() => send(true))
      .catch(err => {
        console.error(err)
        send(false)
      })
  }

  return true
})
