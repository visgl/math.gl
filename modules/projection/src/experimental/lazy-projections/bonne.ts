// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Lazy metadata for the projection engine; the algorithm retains its upstream notices.
import {createProjectionDescriptor} from '../projection-descriptor';
import type {ProjectionDescriptor} from '../projection-descriptor';
export const lazyBonne: ProjectionDescriptor = /* @__PURE__ */ createProjectionDescriptor(
  {name: 'bonne', aliases: ['Bonne (Werner lat_1=90)']},
  async () => (await import('@math.gl/projection/projections/bonne')).bonne
);
