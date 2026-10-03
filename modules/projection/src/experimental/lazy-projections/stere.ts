// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Lazy metadata for the projection engine; the algorithm retains its upstream notices.
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
  async () => (await import('@math.gl/projection/projections/stere')).stereographic
);
