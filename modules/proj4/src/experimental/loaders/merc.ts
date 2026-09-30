// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Lazy metadata for the TypeScript projection; the algorithm retains its upstream notices.
import {createProjectionLoader} from '../projection-loader';
import type {ProjectionLoader} from '../projection-loader';
export const mercatorLoader: ProjectionLoader = /* @__PURE__ */ createProjectionLoader(
  {
    name: 'merc',
    aliases: [
      'Mercator',
      'Popular Visualisation Pseudo Mercator',
      'Mercator_1SP',
      'Mercator_Auxiliary_Sphere',
      'Mercator_Variant_A'
    ]
  },
  async () => (await import('@math.gl/proj4/projections/merc')).mercator
);
