// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Lazy metadata for the TypeScript projection; the algorithm retains its upstream notices.
import {createProjectionLoader} from '../projection-loader';
import type {ProjectionLoader} from '../projection-loader';
export const lambertConformalConicLoader: ProjectionLoader = /* @__PURE__ */ createProjectionLoader(
  {
    name: 'lcc',
    aliases: [
      'Lambert Tangential Conformal Conic Projection',
      'Lambert_Conformal_Conic',
      'Lambert_Conformal_Conic_1SP',
      'Lambert_Conformal_Conic_2SP',
      'Lambert Conic Conformal (1SP)',
      'Lambert Conic Conformal (2SP)'
    ]
  },
  async () => (await import('@math.gl/proj4/projections/lcc')).lambertConformalConic
);
