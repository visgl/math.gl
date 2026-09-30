// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Lazy metadata for the TypeScript projection; the algorithm retains its upstream notices.
import {createProjectionLoader} from '../projection-loader';
import type {ProjectionLoader} from '../projection-loader';
export const stereographicLoader: ProjectionLoader = /* @__PURE__ */ createProjectionLoader(
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
