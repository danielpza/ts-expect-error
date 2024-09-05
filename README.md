# ts-expect-error

Inpired by https://github.com/airbnb/ts-migrate which is a very good tool but the reignore feature didn't work in some convoluted setups with workspaces. This is a smaller version only adding the `@ts-expect-error` directive.

Silence typescript errors by adding a @ts-expect-error directive.

## Usage

```shell
$ ts-expect-error --help
ts-expect-error <glob> [...options]

options
  -h, --help                   Show this help message.
  -v, --version                Display package version.
  -r, --remove-current-checks  Remove previously placed @ts-expect-error directives.
  -w, --cwd                    Change the current working directory.
```
