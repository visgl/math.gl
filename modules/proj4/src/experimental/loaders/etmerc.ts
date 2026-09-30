// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Lazy metadata for the TypeScript projection; the algorithm retains its upstream notices.
import {createProjectionLoader} from '../projection-loader';
import type {ProjectionLoader} from '../projection-loader';
export const extendedTransverseMercatorLoader: ProjectionLoader =
  /* @__PURE__ */ createProjectionLoader(
    {name: 'etmerc', aliases: ['Extended_Transverse_Mercator', 'Extended Transverse Mercator']},
    async () => (await import('@math.gl/proj4/projections/etmerc')).extendedTransverseMercator
  );
