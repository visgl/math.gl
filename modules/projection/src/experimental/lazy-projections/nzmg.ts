// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Lazy metadata for the projection engine; the algorithm retains its upstream notices.
import {createProjectionDescriptor} from '../projection-descriptor';
import type {ProjectionDescriptor} from '../projection-descriptor';
export const lazyNewZealandMapGrid: ProjectionDescriptor =
  /* @__PURE__ */ createProjectionDescriptor(
    {name: 'nzmg', aliases: ['New_Zealand_Map_Grid']},
    async () => (await import('@math.gl/projection/projections/nzmg')).newZealandMapGrid
  );
