// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Lazy metadata for the projection engine; the algorithm retains its upstream notices.
import {createProjectionDescriptor} from '../projection-descriptor';
import type {ProjectionDescriptor} from '../projection-descriptor';
export const lazyTransverseMercator: ProjectionDescriptor =
  /* @__PURE__ */ createProjectionDescriptor(
    {
      name: 'tmerc',
      aliases: [
        'Fast_Transverse_Mercator',
        'Fast Transverse Mercator',
        'Transverse_Mercator',
        'Transverse Mercator',
        'Gauss Kruger',
        'Gauss_Kruger'
      ]
    },
    async () => (await import('@math.gl/projection/projections/tmerc')).transverseMercator
  );
