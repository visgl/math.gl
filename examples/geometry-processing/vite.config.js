// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vite';
export default defineConfig({
  resolve: {
    alias: ['core', 'geometry', 'geometry-utils', 'types'].map(name => ({
      find: new RegExp(`^@math\\.gl/${name}$`),
      replacement: fileURLToPath(new URL(`../../modules/${name}/src/index.ts`, import.meta.url))
    }))
  }
});
