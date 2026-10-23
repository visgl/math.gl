// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {defineConfig} from 'vite';
import {fileURLToPath} from 'node:url';

export default defineConfig({
  plugins: [{
    name: 'workspace-discontinuous',
    enforce: 'pre',
    resolveId(source) {
      if (source === '@math.gl/geospatial/discontinuous')
        return fileURLToPath(new URL('../../modules/geospatial/src/discontinuous.ts', import.meta.url));
    }
  }]
});
