// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Lazy metadata for the TypeScript projection; the algorithm retains its upstream notices.
import {createProjectionLoader} from '../projection-loader';
import type {ProjectionLoader} from '../projection-loader';
export const obliqueStereographicLoader: ProjectionLoader = /* @__PURE__ */ createProjectionLoader(
  {
    name: 'sterea',
    aliases: [
      'Stereographic_North_Pole',
      'Oblique_Stereographic',
      'Oblique Stereographic Alternative',
      'Double_Stereographic'
    ]
  },
  async () => (await import('@math.gl/proj4/projections/sterea')).obliqueStereographic
);
