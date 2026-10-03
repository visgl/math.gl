// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Lazy metadata for the TypeScript projection; the algorithm retains its upstream notices.
import {createProjectionDescriptor} from '../projection-descriptor';
import type {ProjectionDescriptor} from '../projection-descriptor';
export const lazyEquidistantConic: ProjectionDescriptor =
  /* @__PURE__ */ createProjectionDescriptor(
    {name: 'eqdc', aliases: ['Equidistant_Conic']},
    async () => (await import('@math.gl/projection/projections/eqdc')).equidistantConic
  );
