// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
export default defineConfig({
  plugins: [
    {
      name: 'alpine-workspace-vector',
      enforce: 'pre',
      resolveId(source, importer) {
        if (source === '@math.gl/projection')
          return fileURLToPath(new URL('../../modules/projection/src/index.ts', import.meta.url));
        // Only this example uses workspace 5.x; deck.gl retains its installed math.gl 4.x.
        if (source === '@math.gl/core' && importer?.endsWith('/alpine-ice-age/scene.js')) {
          return fileURLToPath(new URL('../../modules/core/src/index.ts', import.meta.url));
        }
      }
    }
  ]
});
