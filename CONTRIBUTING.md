# Contributing

---

Hi there, thanks for checking out our repo!

**@seek/logger** is package for backend application logging at SEEK.
While third-party contributions are certainly welcome,
this project is primarily driven by our internal priorities and technology strategy.

SEEKers: this repo is public,
so don't commit or post anything that isn't ready for the entire world to see.

---

## Getting started

**@seek/logger** is documented through its [README](README.md).
We maintain a [changelog] and [release notes] on GitHub,
and distribute it as an [npm package].

### I want to discuss or report something

[Submit an issue] if you have a question, feature request or bug report.

If you work at SEEK, start a discussion in [#typescriptification].

### I want to contribute a change

Feel free to [create a pull request] for trivial fixes and improvements.

For more substantial features, please [submit an issue] first.
This lets us evaluate whether the feature fits the direction of the project and discuss possible approaches.

If you work at SEEK, start a discussion in [#typescriptification].

---

## Development

### Prerequisites

**@seek/logger** is predominantly tested on macOS and Linux.
If you're on Windows, we recommend the [Windows Subsystem for Linux].

First, some JavaScript tooling:

- Node.js LTS
- Yarn 1.x

Next, install npm dependencies:

```shell
yarn install
```

### Git workflow

We use [GitHub flow](https://guides.github.com/introduction/flow/).

Create a new branch off of the latest commit on master:

```shell
git fetch origin
git switch --create your-branch-name origin/master
```

Develop, [test](#testing) and commit your changes on this branch.
(Make sure to include the appropriate [changeset](#creating-a-changeset).)

```shell
git add --all
git commit
```

Finally, push your branch to GitHub and [create a pull request]:

```shell
git push --set-upstream origin your-branch-name
```

If you don't have push access,
you may need to [fork the repo] and push there instead:

```shell
git remote add fork git@github.com:your-username/logger.git
git push --set-upstream fork your-branch-name
```

A maintainer will get to your pull request and review the changes.
If all is well, they will merge your pull request into master.

### Testing

You may find it easier to develop alongside unit tests:

```shell
yarn test --watch
```

Format your code once you're happy with it:

```shell
yarn format
```

We run linting and testing in CI,
but consider running these commands locally for a faster feedback loop:

```shell
yarn lint
yarn test
```

---

## Releases

### Creating a changeset

We use [Changesets] to manage package releases.
You'll see a 🦋 bot gliding around pull requests.

You should write a changeset if you are changing the public interface.
On the other hand,
a changeset is not necessary for:

- Documentation like the [README](README.md)
- Internal refactoring that preserves the existing interface
- [npm dev dependencies](https://github.com/seek-oss/logger/blob/master/package.json)

```shell
yarn changeset
```

The Changesets CLI is interactive and follows [semantic versioning]:

- Patch release `0.0.X`: fixes or tweaks to existing functionality
- Minor release `0.X.0`: new, backwards-compatible functionality
- Major release `X.0.0`: backwards-incompatible modification

The Changesets CLI will generate a Markdown file under [.changeset](https://github.com/seek-oss/logger/tree/master/.changeset),
which you should include in your pull request.
It doesn't need to be part of the same commit as the rest of your changes.
Feel free to manually edit this file to include more details about your change.

### Publishing a release

When a pull request with a changeset is merged,
our CI workflow will create a new `Version Packages` PR.
The changesets are used to infer the next semantic version and to update the [changelog].

This PR may be left open to collate multiple changes into the next version.
A maintainer will merge it once ready,
and our [release](https://github.com/seek-oss/logger/blob/master/.github/workflows/release.yml) GitHub Actions workflow will publish the associated GitHub release and npm package version.

### Publishing a prerelease

Prereleases can be created on demand via [seek-oss/changesets-snapshot].

Run the [Snapshot workflow] in GitHub Actions to publish a new snapshot version to npm.

<https://www.npmjs.com/package/@seek/logger?activeTab=versions>

[#typescriptification]: https://slack.com/app_redirect?channel=CDCPCEPV3
[changelog]: CHANGELOG.md
[changesets]: https://github.com/atlassian/changesets
[create a pull request]: https://github.com/seek-oss/logger/compare
[fork the repo]: https://github.com/seek-oss/logger/fork
[npm package]: https://www.npmjs.com/package/@seek/logger
[release notes]: https://github.com/seek-oss/logger/releases
[seek-oss/changesets-snapshot]: https://github.com/seek-oss/changesets-snapshot
[semantic versioning]: https://semver.org/
[snapshot workflow]: https://github.com/seek-oss/logger/actions/workflows/snapshot.yml
[submit an issue]: https://github.com/seek-oss/logger/issues/new/choose
[windows subsystem for linux]: https://en.wikipedia.org/wiki/Windows_Subsystem_for_Linux
