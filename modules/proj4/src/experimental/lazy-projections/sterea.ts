// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Lazy metadata for the TypeScript projection; the algorithm retains its upstream notices.
import {createProjectionDescriptor} from '../projection-descriptor';
import type {ProjectionDescriptor} from '../projection-descriptor';
export const lazyObliqueStereographic: ProjectionDescriptor =
  /* @__PURE__ */ createProjectionDescriptor(
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
