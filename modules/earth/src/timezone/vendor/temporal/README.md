<!--
SPDX-License-Identifier: MIT
SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
-->

# Vendored Temporal implementation

- Upstream: https://github.com/js-temporal/temporal-polyfill
- npm release: @js-temporal/polyfill 0.5.1 (ISC), published dist/index.esm.js.
- Bundled dependency: jsbi 4.3.2 (Apache-2.0), published dist/jsbi.mjs; upstream https://github.com/GoogleChromeLabs/jsbi.
- runtime.ts bundles the published ESM implementation and JSBI without minification or algorithm changes. The runtime boundary is typed using the upstream Temporal namespace declarations in types.ts; math.gl exposes its own typed numeric API.
- This is the library entry point: it does not install Temporal or Intl globals. It continues to use the host Intl timezone database.
- LICENSE.txt and JSBI-LICENSE.txt retain the complete upstream license texts and are distributed in the package's src directory.

## Refreshing

From the repository root after yarn install, run:

```sh
node scripts/vendor-expression-timezone-deps.mjs
```

The script pins upstream releases and SHA-512 tarball integrity values, verifies downloads, and never runs upstream package scripts. The repository lockfile pins the esbuild tool used for generation. Review upstream changes and licenses before changing pins. Keep the SPDX headers and license files when refreshing. Run the repository's build and existing expression/timezone and package boundary checks after a refresh. Vendored files are excluded from automatic formatting to preserve reproducible output.
