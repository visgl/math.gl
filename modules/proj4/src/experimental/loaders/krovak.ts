// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Lazy metadata for the TypeScript projection; the algorithm retains its upstream notices.
import {createProjectionLoader} from '../projection-loader';
import type {ProjectionLoader} from '../projection-loader';
export const krovakLoader: ProjectionLoader = /* @__PURE__ */ createProjectionLoader(
  {
    name: 'krovak',
    aliases: [
      'Krovak',
      'Krovak Modified',
      'Krovak (North Orientated)',
      'Krovak Modified (North Orientated)'
    ]
  },
  async () => (await import('@math.gl/proj4/projections/krovak')).krovak
);
