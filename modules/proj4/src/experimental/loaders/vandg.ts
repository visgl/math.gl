// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Lazy metadata for the TypeScript projection; the algorithm retains its upstream notices.
import {createProjectionLoader} from '../projection-loader';
import type {ProjectionLoader} from '../projection-loader';
export const vanDerGrintenLoader: ProjectionLoader = /* @__PURE__ */ createProjectionLoader(
  {name: 'vandg', aliases: ['Van_der_Grinten_I', 'VanDerGrinten', 'Van_der_Grinten']},
  async () => (await import('@math.gl/proj4/projections/vandg')).vanDerGrinten
);
