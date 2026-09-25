# Release instructions

## Publishing releases

- Publish only from `master` or a release branch named `<major>.<minor>-release`, such as `5.0-release`.
- Do not publish from `codex/*`, feature, or other temporary branches.
- Update `CHANGELOG.md` with the release version and release notes before running the publish command.
- Use `yarn run publish-beta` for prereleases and `yarn run publish-prod` for stable releases.
- After publishing, verify that the GitHub release workflow completes successfully and that every workspace package is present on npm at the released version.
