function getPage() {
  // match pull request page
  if (location.pathname.match(/^\/.+\/.+\/pull\/\d+/g)) {
    return {
      name: 'pull_request',
      target: '.gh-header-show > div > div',
      btn: 'btn-sm',
      ref: () => document.querySelector(':not(.sticky-content) .commit-ref.head-ref').title,
      insert: (parent, node) => parent.prepend(node)
    }
  // match repo main page
  } else if (location.pathname.match(/^\/.+\/.+/g)) {
    return {
      name: 'repo_main',
      target: '.file-navigation',
      btn: 'btn-md',
      ref: () => {
        const branch = document.querySelector('#branch-select-menu > summary > span').textContent
        const [owner, repo] = location.pathname.split('/')
        return `${owner}/${repo}:${branch}`
      },
      insert: (parent, node) => parent.insertBefore(node, document.querySelector(".file-navigation > a[data-hotkey='t']"))
    }
  } else {
    return null
  }
}
function getPullRequestHeader() {
  return document.querySelector('.gh-header-show > div > div')
}

function htmlToElement(html) {
  const template = document.createElement('template')
  html = html.trim()
  template.innerHTML = html
  return template.content.firstChild
}

async function elementReady(selector) {
  return await new Promise(resolve => {
    if (!selector) {
      return
    }
    const id = setInterval(() => {
      setTimeout(() => clearInterval(id), 10 * 1000)
      const el = document.querySelector(selector)
      if (el) {
        clearInterval(id)
        resolve(el)
      }
    }, 300)
  })
}

(async () => {
  console.log('from vspn')

  const btn = document.createElement('button')
  const page = getPage();

  await elementReady(page.target)
    .then(target => {
      btn.classList.add(page.btn)
      page.insert(target, btn)
    })

  const headRef = page.ref()
  const spinner$ = htmlToElement(`<svg class="octicon anim-rotate js-check-step-loader mr-2 flex-shrink-0" width="16" height="16" viewBox="0 0 16 16" stroke="#dbab0a" xmlns="http://www.w3.org/2000/svg">
      <g fill="none" stroke-width="2">
        <circle opacity=".5" cx="8" cy="8" r="7"></circle>
        <path d="m12.9497 3.05025c1.3128 1.31276 2.0503 3.09323 2.0503 4.94975 0 1.85651-.7375 3.637-2.0503 4.9497"></path>
      </g>
    </svg>`)
  const icon$ = htmlToElement(`<svg class="octicon octicon-desktop-download mr-2" viewBox="0 0 16 16" version="1.1" width="16" height="16" aria-hidden="true">
    <path fill-rule="evenodd" d="M8.75 5V.75a.75.75 0 00-1.5 0V5H5.104a.25.25 0 00-.177.427l2.896 2.896a.25.25 0 00.354 0l2.896-2.896A.25.25 0 0010.896 5H8.75zM1.5 2.75a.25.25 0 01.25-.25h3a.75.75 0 000-1.5h-3A1.75 1.75 0 000 2.75v7.5C0 11.216.784 12 1.75 12h3.727c-.1 1.041-.52 1.872-1.292 2.757A.75.75 0 004.75 16h6.5a.75.75 0 00.565-1.243c-.772-.885-1.193-1.716-1.292-2.757h3.727A1.75 1.75 0 0016 10.25v-7.5A1.75 1.75 0 0014.25 1h-3a.75.75 0 000 1.5h3a.25.25 0 01.25.25v7.5a.25.25 0 01-.25.25H1.75a.25.25 0 01-.25-.25v-7.5zM9.018 12H6.982a5.72 5.72 0 01-.765 2.5h3.566a5.72 5.72 0 01-.765-2.5z"></path>
    </svg>`)

  btn.classList.add('btn')
  btn.textContent = 'Open with vspn'
  btn.prepend(icon$)
  btn.addEventListener('click', () => {
    console.log('send to background')
    const message = {
      command: 'OPEN_VSCODE',
      path: location.pathname,
      headRef
    }
    btn.replaceChild(spinner$, icon$)
    btn.disabled = true
    chrome.runtime.sendMessage(message, (res) => {
      console.log(res)
      btn.replaceChild(icon$, spinner$)
      btn.disabled = false
    })
  })

  btn.nextElementSibling.classList.remove('m-0')
})()
