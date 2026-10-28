# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.0.1] - 2026-07-08

First real release. Ports tech.resource to Squint as an ES module that works
end to end; the 0.0.1-alpha1 cherry build had several silently-broken paths
(gc registration was a no-op, dispose dispatch and stack-release fired on the
wrong value).

### Added
- stack + gc + combined first-wins tracking via `track`.
- `make-closeable-context` / `bind-and-execute` / `releasing-fn` for ES2023
  `using` and plain-JS callers; `Symbol.dispose` / `Symbol.asyncDispose` / `.close()` dispatch.
- cljc parity tests against tech.resource plus a `:cljs` `--expose-gc` suite.
- `LICENSE` (EPL-1.0), `prepublishOnly` build, `files` allow-list.

### Changed
- Compiler cherry-cljs -> squint-cljs.
- `stack-release` / `stack-ignore` match by `identical?`, not `=`.

## [0.0.1-alpha1] - 2024-12-12

Initial cherry-cljs pre-release. API shape only; several core paths did not work.
