# Publishing math.gl

Publish prereleases from a clean, current `master` checkout or a release branch
named `<major>.<minor>-release`. Publishing from a feature branch is rejected.

## Preparing 5.0.0-beta.1

The beta preparation PR leaves package versions and `lerna.json` at alpha.20.
After it lands, the release command selects `5.0.0-beta.1` explicitly instead of
incrementing the alpha series. Later runs increment the beta number, provided
`CHANGELOG.md` contains a heading and release notes for that version.

Before upgrading applications, review the breaking changes in
[the root-export migration guide](../docs/developer-guide/root-exports-migration.md)
and [the v5 upgrade guide](../docs/upgrade-guide.md). Package and capability roots
replace superseded API subpaths, Earth requires `astronomy-engine`, and core
exposes matrix/vector namespaces and prefixed individual operations. Catalog and
data paths remain available.

## Release steps

1. Pull latest master and validate the release: `yarn install --immutable`,
   `yarn build`, `yarn check:packages`, `node scripts/check-root-exports.mjs`, `yarn lint`,
   and `yarn test`. Confirm every public module already exists on npm and has a
   trusted publisher for `visgl/math.gl`, workflow `release.yml`.
2. Add the exact `## v<version>` heading and notes to `CHANGELOG.md`, commit them,
   and preview the target with `yarn run publish-beta --dry-run`. This preview
   does not create commits, tags, or publishes, and can run on a prep branch.
3. From the clean permitted branch, run `yarn run publish-beta` and confirm the
   version in Lerna's prompt. The command updates workspace versions and exact
   internal dependencies, creates the release commit/tag, and atomically pushes
   the branch and that tag. It does not publish directly to npm.
4. Verify the tag-triggered GitHub `release` workflow succeeds. That workflow
   builds, runs release tests, and publishes through npm trusted publishing with
   the `beta` dist-tag. Verify every publishable `modules/*` package exists at
   the released version on npm; processing can delay public availability.

If versioning or pushing fails, inspect the checkout and remote refs before
retrying. Do not rerun the version bump blindly: Lerna may already have created a
local release commit and tag. Keep the existing version while recovering a
partially completed release.

Stable releases continue to use `yarn run publish-prod`.
