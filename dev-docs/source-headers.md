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
