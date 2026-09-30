// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Lazy metadata for the TypeScript projection; the algorithm retains its upstream notices.
import {createProjectionDescriptor} from '../projection-descriptor';
import type {ProjectionDescriptor} from '../projection-descriptor';
export const lazyNewZealandMapGrid: ProjectionDescriptor =
  /* @__PURE__ */ createProjectionDescriptor(
    {name: 'nzmg', aliases: ['New_Zealand_Map_Grid']},
    async () => (await import('@math.gl/proj4/projections/nzmg')).newZealandMapGrid
  );
