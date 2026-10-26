// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      '@math.gl/geospatial/discontinuous': fileURLToPath(
        new URL('../../modules/geospatial/src/discontinuous.ts', import.meta.url)
      ),
      '@math.gl/core': fileURLToPath(new URL('../../modules/core/src/index.ts', import.meta.url)),
      '@math.gl/geometry': fileURLToPath(
        new URL('../../modules/geometry/src/index.ts', import.meta.url)
      )
    }
  }
});
