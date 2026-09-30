// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Lazy metadata for the TypeScript projection; the algorithm retains its upstream notices.
import {createProjectionLoader} from '../projection-loader';
import type {ProjectionLoader} from '../projection-loader';
export const obliqueMercatorLoader: ProjectionLoader = /* @__PURE__ */ createProjectionLoader(
  {
    name: 'omerc',
    aliases: [
      'Hotine_Oblique_Mercator',
      'Hotine Oblique Mercator',
      'Hotine_Oblique_Mercator_variant_A',
      'Hotine_Oblique_Mercator_Variant_B',
      'Hotine_Oblique_Mercator_Azimuth_Natural_Origin',
      'Hotine_Oblique_Mercator_Two_Point_Natural_Origin',
      'Hotine_Oblique_Mercator_Azimuth_Center',
      'Oblique_Mercator'
    ]
  },
  async () => (await import('@math.gl/proj4/projections/omerc')).obliqueMercator
);
