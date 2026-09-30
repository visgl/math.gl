// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Lazy metadata for the TypeScript projection; the algorithm retains its upstream notices.
import {createProjectionLoader} from '../projection-loader';
import type {ProjectionLoader} from '../projection-loader';
export const cassiniSoldnerLoader: ProjectionLoader = /* @__PURE__ */ createProjectionLoader(
  {name: 'cass', aliases: ['Cassini', 'Cassini_Soldner']},
  async () => (await import('@math.gl/proj4/projections/cass')).cassiniSoldner
);
