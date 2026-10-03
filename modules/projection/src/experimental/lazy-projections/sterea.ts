// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Lazy metadata for the projection engine; the algorithm retains its upstream notices.
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
    async () => (await import('@math.gl/projection/projections/sterea')).obliqueStereographic
  );
