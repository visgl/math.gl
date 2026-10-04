// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vite';
const source = name => fileURLToPath(new URL(`../../modules/${name}/src`, import.meta.url));
export default defineConfig({
  resolve: {
    alias: [
      {find: /^@math\.gl\/core\/(.+)$/, replacement: `${source('core')}/$1`},
      ...['core', 'types', 'geospatial', 'culling', 'polygon'].map(name => ({
        find: `@math.gl/${name}`,
        replacement: `${source(name)}/index.ts`
      }))
    ]
  },
  build: {outDir: 'dist'}
});
