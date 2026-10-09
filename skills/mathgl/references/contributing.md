# Repository contributions

Read repository instructions and inspect the affected module's existing tests before editing. Source lives under `modules/<module>/src`, module tests under `modules/<module>/test`, and website documentation under `docs` with navigation in `docs/table-of-contents.json`.

Use the repository's Node version (`.nvmrc`) and Yarn version (`package.json`). Standard commands are `yarn lint`, `yarn build`, `yarn test-node`, and `yarn test` (Node and headless browser). Run checks appropriate to the changed behavior. Build documentation with `yarn workspace project-website build`; its post-build checks validate the Markdown exports and index. Exercise both `/math.gl/` and `/math.gl/next/` base paths when changing generated documentation URLs.

For math changes, meaningful tests include independently known results, mutation/aliasing behavior, singular or degenerate inputs, and scale-aware tolerances. Avoid exact floating-point equality unless it is part of the contract.

Adding an API requires public exports, declarations, documentation and suitable tests. Preserve documented allocation and mutation semantics. Package-boundary scripts in the root package.json verify selected modules' exports and optional dependencies.

Publishing is a separate user-authorized task. Follow AGENTS.md: release only from master or a major.minor-release branch, update CHANGELOG.md first, use the prescribed beta/stable command, then verify GitHub workflow completion and every workspace package on npm.
