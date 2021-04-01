# Committt

Summarize monthly commit times for each day


## Usage

```
Usage: committt [options]

Options:
  -V, --version       output the version number
  -u --user <value>   Author Name Or Email
  -p --path <path>    Project Path
  -t --target <date>  Target month like `2020/01`
  -h, --help          display help for command
```

## Sample output

```sh
18 of 3468 commits are found in 2020/10

2020/10/02 | 11:16 12:17 12:53 15:01 15:19 15:22 |
2020/10/09 | 18:14 |
2020/10/16 | 18:31 19:31 |
2020/10/30 | 11:11 14:09 14:57 15:04 17:49 18:18 18:20 19:05 19:16 |
```

## Test locally

```sh
$ npm link
$ committt -p .
```

# Acknowledgments

- https://qiita.com/highwide/items/236ab304e74a53cd3854
- https://stackoverflow.com/questions/38335804/getting-all-commits-on-all-branches-with-nodegit