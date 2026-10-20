<!--
SPDX-License-Identifier: MIT
SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
-->

# Vendored jsep

- Upstream: https://github.com/EricSmekens/jsep
- npm release: jsep 1.4.0 (MIT).
- Source: published dist/jsep.js and typings/tsd.d.ts.
- runtime.ts is the ESM runtime bundled without minification; its private default export is typed as any at the boundary. types.ts preserves the upstream declarations, replacing the ambient npm module wrapper with a local Jsep export. No parser algorithms are changed.
- LICENSE.txt retains the complete upstream license and copyright notice. It is distributed in the package's src directory.

## Refreshing

From the repository root after yarn install, run:

```sh
node scripts/vendor-expression-timezone-deps.mjs
```

The script pins upstream releases and SHA-512 tarball integrity values, verifies downloads, and never runs upstream package scripts. The repository lockfile pins the esbuild tool used for generation. Review upstream changes and licenses before changing pins. Keep the SPDX headers and license files when refreshing. Run the repository's build and existing expression/timezone and package boundary checks after a refresh. Vendored files are excluded from automatic formatting to preserve reproducible output.
