// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {fileURLToPath} from 'node:url';
import {defineConfig} from 'vite';

// Older transitive dependencies still import the pre-consolidation package names.
const legacyEntries = {
  projection: '../../modules/geospatial/src/projection/index.ts',
  polygon: '../../modules/geometry/src/polygon/index.ts'
};

export default defineConfig({
  resolve: {
    alias: Object.entries(legacyEntries).map(([name, path]) => ({
      find: new RegExp(`^@math\\.gl/${name}$`),
      replacement: fileURLToPath(new URL(path, import.meta.url))
    }))
  }
});
