// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Lazy metadata for the TypeScript projection; the algorithm retains its upstream notices.
import {createProjectionDescriptor} from '../projection-descriptor';
import type {ProjectionDescriptor} from '../projection-descriptor';
export const lazyObliqueMercator: ProjectionDescriptor = /* @__PURE__ */ createProjectionDescriptor(
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
  async () => (await import('@math.gl/projection/projections/omerc')).obliqueMercator
);
