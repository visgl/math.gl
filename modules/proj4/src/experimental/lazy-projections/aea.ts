// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Lazy metadata for the TypeScript projection; the algorithm retains its upstream notices.
import {createProjectionDescriptor} from '../projection-descriptor';
import type {ProjectionDescriptor} from '../projection-descriptor';
export const lazyAlbersEqualArea: ProjectionDescriptor = /* @__PURE__ */ createProjectionDescriptor(
  {name: 'aea', aliases: ['Albers_Conic_Equal_Area', 'Albers_Equal_Area', 'Albers']},
  async () => (await import('@math.gl/proj4/projections/aea')).albersEqualArea
);
