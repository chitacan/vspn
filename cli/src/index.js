const {Command, flags} = require('@oclif/command')
const {cli} = require('cli-ux')
const {Octokit} = require("@octokit/rest")
const {safeLoad} = require('js-yaml')
const {homedir, hostname} = require('os')
const {join, basename, resolve, extname} = require('path')
const {createHash} = require('crypto')
const fetch = require('node-fetch')
const {readFileSync, existsSync} = require('fs')
const fg = require('fast-glob')
const {exec} = require('child_process')
const {promisify} = require('util');
const {description, repository} = require('../package')

const GITHUB_URL = 'https://github.com'

const execAsync = promisify(exec)

class VspnCommand extends Command {
  async init() {
    this.self = hostname().replace('.local', '')
  }

  buildOptions(path, runWithVSCode) {
    if (path.startsWith(GITHUB_URL)) {
      const url = new URL(path)
      const [owner, repo] = url.pathname.split('/').filter(d => d)
      return {
        folderUri: `vscode-vfs://github/${owner}/${repo}`
      }
    } else if (!runWithVSCode) {
      return {
        command: 'arc',
        path: join('tunnel', this.self, path).toLowerCase()
      }
    } else if (extname(path) === '.code-workspace') {
      return {
        path: path,
        remote: `ssh-remote+${this.self}`
      }
    } else {
      const [workspaceFile] = fg.sync(join(path, '*.code-workspace'))
      return {
        path: workspaceFile || path,
        remote: `ssh-remote+${this.self}`
      }
    }
  }

  async run() {
    const {flags, args} = this.parse(VspnCommand)
    const [repo, owner] = (flags.slug || repository.url.replace('.git', '')).split('/').reverse()
    const slug = {owner, repo}
    const workflowFile = `run_vscode_${args.host}.yml`
    const requestId = createHash('sha1').update(args.path + new Date()).digest('hex')
    const configPath = join(homedir(), '/.config/gh/hosts.yml')
    const inputs = {
      requestId,
      ...this.buildOptions(args.path, flags.code)
    }

    if (args.host === this.self) {
      throw new Error(`open on ${this.self} is not allowed. (you are on ${this.self})`)
    }

    if (!existsSync(configPath)) {
      throw new Error(`cannot find gh config. install gh (https://cli.github.com/) and login first.`)
    }

    const auth = await execAsync('gh auth token').then(d => d.stdout.trim())
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
        inputs
      })
      cli.action.stop('requested')
    } else {
      this.log(slug)
      this.log(workflowFile)
      this.log(inputs)
    }
  }
}

VspnCommand.description = `${description}`

VspnCommand.flags = {
  version: flags.version({char: 'v'}),
  help: flags.help({char: 'h'}),
  slug: flags.string({
    char: 's',
    description: 'workflow slug <OWNER>/<REPO>'
  }),
  code: flags.boolean({char: 'c'}),
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
    description: 'target path or github url to open in vscode',
    parse: (input) => {
      if (input === '.') {
        return process.cwd()
      } else if (input.startsWith(GITHUB_URL)) {
        return input
      }
      return resolve(process.cwd(), input)
    },
    default: process.cwd()
  }
]

module.exports = VspnCommand
