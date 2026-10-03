// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Lazy metadata for the TypeScript projection; the algorithm retains its upstream notices.
import {createProjectionDescriptor} from '../projection-descriptor';
import type {ProjectionDescriptor} from '../projection-descriptor';
export const lazyExtendedTransverseMercator: ProjectionDescriptor =
  /* @__PURE__ */ createProjectionDescriptor(
    {name: 'etmerc', aliases: ['Extended_Transverse_Mercator', 'Extended Transverse Mercator']},
    async () => (await import('@math.gl/projection/projections/etmerc')).extendedTransverseMercator
  );
