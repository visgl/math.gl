# AGENTS.md

## Publishing releases

- Publish only from `master` or a release branch named `<major>.<minor>-release`, such as `5.0-release`.
- Do not publish from `codex/*`, feature, or other temporary branches.
- Update `CHANGELOG.md` with the release version and release notes before running the publish command.
- Use `yarn run publish-beta` for prereleases and `yarn run publish-prod` for stable releases.
- After publishing, verify that the GitHub release workflow completes successfully and that every workspace package is present on npm at the released version.

## Pull requests

### Babysitting pull requests

- After opening a PR, or when asked to address reviews or babysit it, own the work until the latest revision is ready for merge. Continue after pushing fixes; local success alone does not finish the task.
- Wait 15 minutes after opening a PR for review comments, as in luma.gl. Use that time to inspect CI and coverage, and address comments as they arrive.
- Close the loop on every actionable review thread: implement the fix, add focused regression coverage when appropriate, run the required build/tests/formatting after the final changes, reply with what changed and how it was verified, then resolve the thread. Recheck for newly posted comments after each push.
- Keep the branch current with `master`, resolve merge conflicts promptly, and recheck mergeability after every push.
- Inspect all required CI checks and coverage on the latest head commit. Investigate failures; rerun transient jobs when the evidence supports it. Never lower coverage thresholds or add exclusions merely to make the PR pass.
- Treat CI as the final gate after review changes. Older successful runs and focused local checks do not replace green required checks on the current revision. Do not declare readiness while checks are failing or pending.
- Before finishing, recheck review threads, current `master`, mergeability, and the latest checks. A ready PR has no outstanding actionable review threads, passes every required check and coverage gate, and has an accurate Markdown description.
- Report the PR link, review fixes, verification, and any remaining blockers. Do not merge unless the user asks to merge.
