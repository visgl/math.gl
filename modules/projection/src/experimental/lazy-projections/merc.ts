// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Lazy metadata for the projection engine; the algorithm retains its upstream notices.
import {createProjectionDescriptor} from '../projection-descriptor';
import type {ProjectionDescriptor} from '../projection-descriptor';
export const lazyMercator: ProjectionDescriptor = /* @__PURE__ */ createProjectionDescriptor(
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
  async () => (await import('@math.gl/projection/projections/merc')).mercator
);
