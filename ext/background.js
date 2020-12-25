const GH_API = 'https://api.github.com'

async function getOptions(autoOptnOption = false) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['token', 'host'], (result) => {
      if (!result.token && !result.host) {
        if (autoOptnOption) {
          chrome.runtime.openOptionsPage()
        }
        reject('no options')
      } else {
        resolve(result)
      }
    })
  })
}

async function workflowDispatch(path, headRef, goto) {
  console.log(path, headRef)

  const {host, token} = await getOptions(true);
  const [repo, branch] = headRef.split(':')
  const runner_repo = 'chitacan/vspn'
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
        branch,
        goto
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

chrome.runtime.onMessage.addListener((message, sender, send) => {
  console.log(message)
  if (message.command === 'OPEN_VSCODE') {
    workflowDispatch(message.path, message.headRef, message.goto)
      .then(() => send(true))
      .catch(err => {
        console.error(err)
        send(false)
      })
  } else if (message.command === 'CHECK_OPTION') {
    getOptions()
      .then(() => send(true))
      .catch(() => send(false))
  }

  return true
})
