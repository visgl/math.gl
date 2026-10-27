// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vite';
export default defineConfig({
  resolve: {
    // Query kernels remain independent of the full culling bundle.
    alias: [
      {
        find: '@math.gl/geometry/culling',
        replacement: fileURLToPath(new URL('../../modules/geometry/src/culling/queries.ts', import.meta.url))
      },
      ...['core', 'culling', 'geospatial', 'types'].map(name => ({
        find: new RegExp(`^@math\\.gl/${name}$`),
        replacement: fileURLToPath(new URL(`../../modules/${name}/src/index.ts`, import.meta.url))
      }))
    ]
  }
});
