// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Lazy metadata for the TypeScript projection; the algorithm retains its upstream notices.
import {createProjectionDescriptor} from '../projection-descriptor';
import type {ProjectionDescriptor} from '../projection-descriptor';
export const lazyStereographic: ProjectionDescriptor = /* @__PURE__ */ createProjectionDescriptor(
  {
    name: 'stere',
    aliases: [
      'Stereographic_South_Pole',
      'Polar_Stereographic_variant_A',
      'Polar_Stereographic_variant_B',
      'Polar_Stereographic'
    ]
  },
  async () => (await import('@math.gl/proj4/projections/stere')).stereographic
);
