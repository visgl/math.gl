// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Lazy metadata for the TypeScript projection; the algorithm retains its upstream notices.
import {createProjectionDescriptor} from '../projection-descriptor';
import type {ProjectionDescriptor} from '../projection-descriptor';
export const lazyVanDerGrinten: ProjectionDescriptor = /* @__PURE__ */ createProjectionDescriptor(
  {name: 'vandg', aliases: ['Van_der_Grinten_I', 'VanDerGrinten', 'Van_der_Grinten']},
  async () => (await import('@math.gl/proj4/projections/vandg')).vanDerGrinten
);
