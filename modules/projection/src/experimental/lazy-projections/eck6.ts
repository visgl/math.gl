// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Lazy metadata for the projection engine; the algorithm retains its upstream notices.
import {createProjectionDescriptor} from '../projection-descriptor';
import type {ProjectionDescriptor} from '../projection-descriptor';
export const lazyEckertVI: ProjectionDescriptor = /* @__PURE__ */ createProjectionDescriptor(
  {name: 'eck6', aliases: ['Eckert_VI']},
  async () => (await import('@math.gl/projection/projections/eck6')).eckertVI
);
