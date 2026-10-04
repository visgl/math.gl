// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vite';
export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@math\.gl\/core\/(.+)$/,
        replacement: fileURLToPath(new URL('../../modules/core/src/', import.meta.url)) + '$1'
      },
      'core',
      'geometry',
      'culling',
      'types'
    ].map(name => ({
      find: new RegExp(`^@math\\.gl/${name}$`),
      replacement: fileURLToPath(new URL(`../../modules/${name}/src/index.ts`, import.meta.url))
    }))
  }
});
