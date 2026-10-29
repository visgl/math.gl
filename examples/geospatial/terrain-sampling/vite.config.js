// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {fileURLToPath} from 'node:url';
export default {
  resolve: {
    alias: {
      '@math.gl/core': fileURLToPath(
        new URL('../../../modules/core/src/index.ts', import.meta.url)
      ),
      '@math.gl/geometry': fileURLToPath(
        new URL('../../../modules/geometry/src/index.ts', import.meta.url)
      ),
      '@math.gl/geospatial/terrain': fileURLToPath(
        new URL('../../../modules/geospatial/src/terrain/index.ts', import.meta.url)
      )
    }
  }
};
