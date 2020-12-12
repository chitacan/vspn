# vspn

open vscode on remote host.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/vspn.svg)](https://npmjs.org/package/vspn)
[![Downloads/week](https://img.shields.io/npm/dw/vspn.svg)](https://npmjs.org/package/vspn)
[![License](https://img.shields.io/npm/l/vspn.svg)](https://github.com/chitacan/vspn/blob/master/package.json)

## Prerequisite

* vscode [remote ssh connection](https://code.visualstudio.com/docs/remote/ssh) via hosts
  * for easy start, checkout [zerotier](https://www.zerotier.com/))
* [setup self-hosted runners](https://docs.github.com/en/free-pro-team@latest/actions/hosting-your-own-runners/adding-self-hosted-runners) on your hosts & repo
  * use same hostname on `self-hosted runner`, `ssh config` & [your mac](https://support.apple.com/guide/mac-help/mchlp2322/mac)
* [add workflows](./.github/workflows/)

## Usage

```sh-session
$ npm i -g vspn
$ vspn <REMOTE_HOST> [PATH]
```

## Development

```sh-session
$ npm i
$ ./bin/run --help
```
