window.onload = () => {
  chrome.storage.local.get(['token', 'host', 'runner_repo'], ({token, host, runner_repo}) => {
    document.getElementById('token').value = token || ''
    document.getElementById('host').value = host || ''
    document.getElementById('runner_repo').value = runner_repo || ''
  });
}

document.getElementById('save').addEventListener('click', () => {
  const token = document.getElementById('token').value
  const host = document.getElementById('host').value
  const runner_repo = document.getElementById('runner_repo').value

  if (token.length === 0 || host.length === 0 || runner_repo.length === 0) {
    return
  }

  chrome.storage.local.set({token, host, runner_repo}, () => window.close())
})

document.getElementById('clear').addEventListener('click', () => {
  document.getElementById('token').value = ''
  document.getElementById('host').value = ''
  document.getElementById('runner_repo').value = ''
  chrome.storage.local.clear()
})
