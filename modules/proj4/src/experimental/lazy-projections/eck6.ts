// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Lazy metadata for the TypeScript projection; the algorithm retains its upstream notices.
import {createProjectionDescriptor} from '../projection-descriptor';
import type {ProjectionDescriptor} from '../projection-descriptor';
export const lazyEckertVI: ProjectionDescriptor = /* @__PURE__ */ createProjectionDescriptor(
  {name: 'eck6', aliases: ['Eckert_VI']},
  async () => (await import('@math.gl/proj4/projections/eck6')).eckertVI
);
