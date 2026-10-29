// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {fileURLToPath} from 'node:url';
export default {
  resolve: {
    alias: {
      '@math.gl/geospatial': fileURLToPath(
        new URL('../../../modules/geospatial/src/index.ts', import.meta.url)
      )
    }
  }
};
