// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Lazy metadata for the TypeScript projection; the algorithm retains its upstream notices.
import {createProjectionLoader} from '../projection-loader';
import type {ProjectionLoader} from '../projection-loader';
export const eckertVILoader: ProjectionLoader = /* @__PURE__ */ createProjectionLoader(
  {name: 'eck6', aliases: ['Eckert_VI']},
  async () => (await import('@math.gl/proj4/projections/eck6')).eckertVI
);
