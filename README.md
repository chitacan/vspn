# vspn

Open vscode on self-hosted runner.

## See how ti works

[cli](./cli)

<kbd><img width="500" src="https://user-images.githubusercontent.com/286950/102256947-68e90500-3f4f-11eb-960a-72427d2c8b36.gif"/></kbd>

[ext](./ext)

<kbd><img width="500" src="https://user-images.githubusercontent.com/286950/102253229-6637e100-3f4a-11eb-8fee-d6d70bb89ac7.gif"/></kbd>

## Prerequisites

* setup vscode [remote ssh connection](https://code.visualstudio.com/docs/remote/ssh) your hosts
  * for easy start, checkout [zerotier](https://www.zerotier.com/)
* [setup self-hosted runners](https://docs.github.com/en/free-pro-team@latest/actions/hosting-your-own-runners/adding-self-hosted-runners) on your hosts & repo
  * use same hostname on `self-hosted runner`, `ssh config` & [your mac](https://support.apple.com/guide/mac-help/mchlp2322/mac)
* install & login [GitHub CLI](https://cli.github.com/) on your hosts
* [Firebase](https://firebase.google.com/) & [Vercel](https://vercel.com)
* [add workflows](./.github/workflows/)
