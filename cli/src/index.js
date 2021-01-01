const {Command, flags} = require('@oclif/command')
const {cli} = require('cli-ux')
const {Octokit} = require("@octokit/rest")
const {safeLoad} = require('js-yaml')
const {homedir, hostname} = require('os')
const {join, basename} = require('path')
const {createHash} = require('crypto')
const fetch = require('node-fetch')
const {readFileSync, existsSync} = require('fs')
const {description, repository} = require('../package')

class VspnCommand extends Command {
  async run() {
    const {flags, args} = this.parse(VspnCommand)
    const [repo, owner] = (flags.slug || repository.url.replace('.git', '')).split('/').reverse()
    const slug = {owner, repo}
    const workflowFile = `run_vscode_${args.host}.yml`
    const self = hostname().replace('.local', '')
    const uri = `vscode-remote://ssh-remote+${self}${args.path}`
    const requestId = createHash('sha1').update(uri + new Date()).digest('hex')
    const configPath = join(homedir(), '/.config/gh/hosts.yml')

    if (args.host === self) {
      throw new Error(`open on ${self} is not allowed. (you are on ${self})`)
    }

    if (!existsSync(configPath)) {
      throw new Error(`cannot find gh config. install gh (https://cli.github.com/) and login first.`)
    }
    const config = safeLoad(readFileSync(configPath))
    const auth = config['github.com'].oauth_token

    const octokit = new Octokit({ auth })

    const {data: {workflows}} = await octokit.actions.listRepoWorkflows(slug)
    const workflow = workflows.find(d => basename(d.path) === workflowFile)
    if (!workflow) {
      throw new Error(`cannot find workflow(${workflowFile}) on github`)
    }

    const {data: {runners}} = await octokit.actions.listSelfHostedRunnersForRepo(slug)
    const runner = runners.find(d => d.name === args.host);
    if (!runner) {
      throw new Error(`cannot find host(${args.host}) on runners`)
    }
    if (runner.status === 'offline') {
      throw new Error(`host(${args.host}) is offline`)
    }

    if (!flags['dry-run']) {
      cli.action.start('starting')
      await octokit.actions.createWorkflowDispatch({
        ...slug,
        workflow_id: workflowFile,
        ref: 'master',
        inputs: {
          requestId,
          uri
        }
      })
      cli.action.task.action = 'workflow dispatched'

      await new Promise((resolve, reject) => {
        const id = setInterval(async () => {
          const {status} = await fetch(`https://vspn.chitacan.io/api/status?requestId=${requestId}`)
            .then(res => res.json())
          cli.action.task.action = `runner status: ${status}`

          if (status === 'success') {
            clearInterval(id)
            cli.action.stop('done')
            resolve()
          } else if (status === 'failure') {
            clearInterval(id)
            cli.action.stop('error')
            reject()
          }
        }, 2000)
      })
    }
  }
}

VspnCommand.description = `${description}`

VspnCommand.flags = {
  version: flags.version({char: 'v'}),
  help: flags.help({char: 'h'}),
  slug: flags.string({
    char: 's',
    description: '<OWNER>/<REPO>'
  }),
  'dry-run': flags.boolean({char: 'd'})
}

VspnCommand.args = [
  {
    name: 'host',
    description: 'remote host to open vscode',
    required: true
  },
  {
    name: 'path',
    description: 'path to open in vscode',
    default: process.cwd()
  }
]

module.exports = VspnCommand
