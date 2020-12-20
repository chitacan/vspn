window.onload = () => {
  chrome.storage.local.get(['token', 'host'], ({token, host}) => {
    document.getElementById('token').value = token || ''
    document.getElementById('host').value = host || ''
  });
}

document.getElementById('save').addEventListener('click', () => {
  const token = document.getElementById('token').value
  const host = document.getElementById('host').value

  if (token.length === 0 || host.length === 0) {
    return
  }

  chrome.storage.local.set({token, host}, () => window.close())
})

document.getElementById('clear').addEventListener('click', () => {
  document.getElementById('token').value = ''
  document.getElementById('host').value = ''
  chrome.storage.local.clear()
})
