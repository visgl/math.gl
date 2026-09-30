// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Lazy metadata for the TypeScript projection; the algorithm retains its upstream notices.
import {createProjectionLoader} from '../projection-loader';
import type {ProjectionLoader} from '../projection-loader';
export const transverseMercatorLoader: ProjectionLoader = /* @__PURE__ */ createProjectionLoader(
  {
    name: 'tmerc',
    aliases: [
      'Fast_Transverse_Mercator',
      'Fast Transverse Mercator',
      'Transverse_Mercator',
      'Transverse Mercator',
      'Gauss Kruger',
      'Gauss_Kruger'
    ]
  },
  async () => (await import('@math.gl/proj4/projections/tmerc')).transverseMercator
);
