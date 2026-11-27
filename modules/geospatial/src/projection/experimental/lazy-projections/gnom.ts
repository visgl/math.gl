// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Lazy metadata for the projection engine; the algorithm retains its upstream notices.
import {createProjectionDescriptor} from '../projection-descriptor';
import type {ProjectionDescriptor} from '../projection-descriptor';
export const lazyGnomonic: ProjectionDescriptor = /* @__PURE__ */ createProjectionDescriptor(
  {name: 'gnom', aliases: []},
  async () => {
    const projectionModule = await import('@math.gl/geospatial/projection-projections-gnom');
    return projectionModule.gnomonic;
  }
);
