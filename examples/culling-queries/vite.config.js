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
        find: '@math.gl/culling/queries',
        replacement: fileURLToPath(new URL('../../modules/culling/src/queries.ts', import.meta.url))
      },
      ...['core', 'culling', 'types'].map(name => ({
        find: new RegExp(`^@math\\.gl/${name}$`),
        replacement: fileURLToPath(new URL(`../../modules/${name}/src/index.ts`, import.meta.url))
      }))
    ]
  }
});
