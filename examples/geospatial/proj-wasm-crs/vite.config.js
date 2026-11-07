// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {prepareProjAssets} from './scripts/prepare-proj-assets.mjs';

export default async () => {
  return {
    base: './',
    ...await prepareProjAssets(),
    worker: {format: 'es'},
    build: {
      rollupOptions: {
        external: ['proj-wasm', /^node:/]
      }
    }
  };
};
