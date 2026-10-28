// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vite';
export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@math.gl/geometry',
        replacement: fileURLToPath(
          new URL('../../../modules/geometry/src/index.ts', import.meta.url)
        )
      },
      ...['core', 'geometry'].map(name => ({
        find: new RegExp(`^@math\\.gl/${name}$`),
        replacement: fileURLToPath(new URL(`../../../modules/${name}/src/index.ts`, import.meta.url))
      }))
    ]
  }
});
