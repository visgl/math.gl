// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Lazy metadata for the projection engine; the algorithm retains its upstream notices.
import {createProjectionDescriptor} from '../projection-descriptor';
import type {ProjectionDescriptor} from '../projection-descriptor';
export const lazyAlbersEqualArea: ProjectionDescriptor = /* @__PURE__ */ createProjectionDescriptor(
  {name: 'aea', aliases: ['Albers_Conic_Equal_Area', 'Albers_Equal_Area', 'Albers']},
  async () => (await import('@math.gl/projection/projections/aea')).albersEqualArea
);
