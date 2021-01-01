const GH_API = 'https://api.github.com'

async function digestMessage(message) {
  const msgUint8 = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgUint8)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

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

async function workflowDispatch({path, headRef, goto}) {
  console.log(path, headRef)

  const requestId = await digestMessage(`${path},${headRef}`)
  const {host, token} = await getOptions(true);
  const [repo, branch] = headRef.split(':')
  const runner_repo = 'chitacan/vspn'
  const workflowId = `run_vscode_${host}.yml`
  const body = {
    ref: 'master',
    inputs: {
      requestId,
      repo,
      branch,
      goto
    }
  }

  console.log('dispatching', body)

  await fetch(`${GH_API}/repos/${runner_repo}/actions/workflows/${workflowId}/dispatches`, {
    method: 'POST',
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json'
    },
    body: JSON.stringify(body)
  })

  await new Promise(resolve => {
    const id = setInterval(async () => {
      const {status} = await fetch(`https://vspn.chitacan.io/api/status?requestId=${requestId}`)
      .then(d => d.json());

      if (status === 'success') {
        clearInterval(id)
        resolve()
      } else if (status === 'failure') {
        clearInterval(id)
        reject()
      }
    }, 2000)
  })
}

chrome.runtime.onMessage.addListener((message, sender, send) => {
  if (message.command === 'OPEN_VSCODE') {
    workflowDispatch(message)
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
