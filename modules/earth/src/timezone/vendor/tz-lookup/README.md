<!--
SPDX-License-Identifier: MIT
SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
-->

# Vendored timezone lookup

- Upstream: https://github.com/photostructure/tz-lookup
- npm release: @photostructure/tz-lookup 11.7.0 (CC0-1.0), published tz.js.
- runtime.ts contains the published lookup algorithm and compressed geographic table, converted from CommonJS to a private ESM default export without minification or algorithm/data changes. The private export is typed as any at the boundary.
- LICENSE.txt retains the full upstream CC0 dedication and is distributed in the package's src directory.
- Geographic lookup remains approximate, including near borders. It does not provide historical/date-specific timezone offsets. Updating this snapshot requires an explicit upstream version/data refresh.

## Refreshing

From the repository root after yarn install, run:

```sh
node scripts/vendor-expression-timezone-deps.mjs
```

The script pins upstream releases and SHA-512 tarball integrity values, verifies downloads, and never runs upstream package scripts. The repository lockfile pins the esbuild tool used for generation. Review upstream changes and licenses before changing pins. Keep the SPDX headers and license files when refreshing. Run the repository's build and existing expression/timezone and package boundary checks after a refresh. Vendored files are excluded from automatic formatting to preserve reproducible output.
