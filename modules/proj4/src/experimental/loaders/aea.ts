// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Lazy metadata for the TypeScript projection; the algorithm retains its upstream notices.
import {createProjectionLoader} from '../projection-loader';
import type {ProjectionLoader} from '../projection-loader';
export const albersEqualAreaLoader: ProjectionLoader = /* @__PURE__ */ createProjectionLoader(
  {name: 'aea', aliases: ['Albers_Conic_Equal_Area', 'Albers_Equal_Area', 'Albers']},
  async () => (await import('@math.gl/proj4/projections/aea')).albersEqualArea
);
