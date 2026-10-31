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

## Resuming a partially published release

Do not delete the GitHub release, move the tag, or bump the version. After a
publishing fix lands, run the `release` workflow from `master` or a permitted
release branch whose package sources and existing locked dependencies still match
the tag. For example, beta.2 was recovered from `5.0-release`:

```sh
gh workflow run release.yml --ref 5.0-release -f tag=v5.0.0-beta.2
```

The workflow checks that the tag exists, is an ancestor of the build commit, and
matches every workspace version and the changelog. Recovery refuses package-source
changes since that tag; only the explicit publishing-tooling files may differ.
The build and its provenance identify the actual workflow/build commit;
the recovery tag is an input and is never moved. Do not override GitHub's OIDC or
source-identity environment variables to pretend the recovery ran on the old tag.
After unrelated dependency upgrades such as the Vitest 5 migration, recovering an
older tag from master is deliberately rejected; use its unchanged release branch.

The publisher reuses an existing GitHub release record, uses pinned Lerna 10.1.1
and its libnpmpublish 12.0.1 dependency, serializes publication, and retries known
provenance/network failures up to three times. It skips versions already present
on npm and fails if any version, dist-tag, or provenance attestation remains unverified after 15 minutes.
A 409 alone is never treated as proof of publication. Unknown registry errors and
non-retryable publish errors fail closed. Fix a wrong dist-tag separately instead
of trying to republish an immutable version.

The committed Yarn patch enables the existing Sigstore 5.0.0 Rekor recovery path:
on a 409 with a location, fetch the existing transparency-log entry and include
it in the normal signed provenance bundle. Retrieval failures still fail the
publish. Provenance is always enabled. `check-publishing-stack.mjs` verifies the
actual dependency chain, and offline tests exercise conflict recovery and errors.
Remove the patch only after that behavior is available through a tested upstream
upgrade. See npm/cli#10078 and sigstore/sigstore-js#1708/#1709.

Upstream dev-tools PR #71 adds idempotent GitHub releases and bounded partial
publish retries. This local helper also verifies the signing stack, guards
recovery sources and dependencies, and checks every npm version, dist-tag and
provenance attestation before reporting success.
