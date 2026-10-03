// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Lazy metadata for the TypeScript projection; the algorithm retains its upstream notices.
import {createProjectionDescriptor} from '../projection-descriptor';
import type {ProjectionDescriptor} from '../projection-descriptor';
export const lazyPolyconic: ProjectionDescriptor = /* @__PURE__ */ createProjectionDescriptor(
  {name: 'poly', aliases: ['Polyconic', 'American_Polyconic']},
  async () => (await import('@math.gl/projection/projections/poly')).polyconic
);
