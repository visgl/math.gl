# CI execution and performance

The `test` workflow separates the package build, package/API checks, examples, coverage,
Node tests, website, and numerical qualification. The required `test` job checks every
worker result; a failure, cancellation, missing result, or unexpected skip fails the gate.
Job limits stay at 15 minutes for ordinary workers. Splitting work, rather than extending
the overloaded worker's deadline, gives tests room to grow and makes retries specific.

Packages build once. Consumers install dependencies independently and restore the
`package-build` tar artifact from the same workflow run. It contains `modules/*/dist`,
including nested entry points, assets, and file permissions. No build output is reused
across revisions. Website builds intentionally use a separate source-only checkout for
both `/math.gl/` and `/math.gl/next/`.

## Qualification cadence

| Work | Every PR / master push | Nightly / manual full run |
| --- | --- | --- |
| Complete Node and Chromium suites | Yes | Yes |
| All-files V8 coverage and 90% line gate | Yes | Yes |
| Package exports, types, budgets, source references and Node numerical qualification | Yes | Yes |
| Chromium independent numerical qualification | Yes | Yes |
| Firefox and WebKit independent numerical qualification | Tooling-change PRs | Yes |
| Complete browser timing/workload matrix and worker cost evaluation | Tooling-change PRs | Yes |
| Node timing, allocations, memory, startup evidence and matched three-browser scorecard | Tooling-change PRs | Yes |
| Paired projection/pipeline performance against the PR base | Every PR | Not on schedule/master |
| Example correctness and rendering regressions | Yes | Yes |

The full profile runs daily at **07:17 UTC** and through **Actions → test → Run workflow**.
Schedules become active after merge to the default branch. Full matrix assertions,
workloads and sample settings are retained; default local and release tests are unchanged.
Ordinary PRs can detect Firefox/WebKit-specific numerical regressions at the next full
run rather than before merge. Chromium and Node correctness remain immediate gates;
coverage is not used as a substitute for cross-browser qualification.

`scripts/ci-profile.mjs` also selects the full profile on PRs changing workflow/profile
scripts, Node/Yarn versions, root dependencies, test configuration/shared setup,
qualification scripts, projection test/reference helpers, reference fixtures or benchmark workloads. This validates the
nightly wiring before its definitions land. The `plan` job logs the selected profile.
Nightly and PR/master concurrency groups are separate so a new push does not cancel a
scheduled full run. Full evidence remains available in the `projection-scorecard` and
`projection-browser-qualification-*` artifacts. Scheduled failures fail the workflow.

## Measurement and follow-up

Successful master run [41093049118](https://github.com/visgl/math.gl/actions/runs/41093049118)
spent 13m47s in the old `checks` job, near its 15-minute deadline. Package compilation
was 24 seconds; scorecard collection was 247 seconds and browser coverage 137 seconds.
Measure complete hosted runs, including producer/consumer waiting and artifact transfer,
when assessing this split. More jobs add install/setup overhead and runner demand.

Related approaches: [luma.gl #3480](https://github.com/visgl/luma.gl/pull/3480) shares build
artifacts; [luma.gl #3578](https://github.com/visgl/luma.gl/pull/3578) validates nightly
workload definitions on PRs while retaining focused checks;
[loaders.gl #4289](https://github.com/visgl/loaders.gl/pull/4289) avoids repeated browser
system installs with a matching Playwright image. That container option requires an
available image matching math.gl's locked Playwright version; do not silently change
browser versions to adopt it. Browser caches and bounded apt downloads remain in use.

Further options, if measured runtimes justify them, are weighted Chromium coverage
shards with merged coverage and a matching preinstalled-browser image. Test isolation,
coverage scope and thresholds must be verified when changing either.

The world-wide polygon-refinement regression registers one test per target projection,
retaining the original complete target list, eight source polygons per target, area
assertions and 60-second timeout. This avoids timing out a single umbrella test as the
projection matrix grows; it neither removes targets nor increases individual deadlines.
