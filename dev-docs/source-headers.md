# Source headers

All tracked TypeScript, JavaScript, Python, CSS and HTML source files, including
tests, examples, declarations and tooling, declare their license and copyright holders
near the beginning of the file:

```typescript
// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
```

Use the file's existing license and copyright notices. Retain original names,
years and license expressions; a header change does not relicense the file.
List multiple copyright holders with separate `SPDX-FileCopyrightText` tags.
Do not invent years or replace upstream ownership with vis.gl ownership.
Keep Python interpreter directives on the first line.

Where relevant, use one `SPDX-FileComment` line to describe origins and
modifications. Distinguish direct ports and adaptations from inspiration and
original wrappers that merely call attributed routines. Retain full upstream
license blocks and distributed license texts alongside these tags.
The format follows the [SPDX source file tag convention](https://spdx.github.io/spdx-spec/v2.3/file-tags/).

`yarn check:source-headers` checks every tracked code file in CI and enforces
CesiumJS copyright, Apache-2.0 terms and provenance in known derived files. The projection
module also checks upstream copyright holders, source provenance and the
Equal Earth Apache-2.0 identifier with its attribution checker.
When a source generator emits headers, update the generator and its output
together.

## References and packaged notices

Run `yarn check:attributions` alongside the source-header check. Every public
package has a `THIRD-PARTY-NOTICES.md` index included in its `files` manifest.
Keep local license paths in source headers valid when moving files between
packages or entry points. The check validates those paths and that locally
linked notice files are declared for packaging; an npm pack dry-run verifies
actual inclusion when changing package files.

Use the [references and credits guide](../docs/references-and-credits.md) for
scientific and dataset references. Distinguish source adaptations, inspiration,
API compatibility and external dependencies. For an adaptation, record upstream
copyright, license, source revision (or explicitly unknown historical revision),
and modifications. A mathematical citation alone does not replace the source's
redistribution notice. The automated checks cannot discover unattributed copied
code or verify external license interpretations.
