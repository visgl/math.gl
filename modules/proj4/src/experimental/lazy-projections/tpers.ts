// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Lazy metadata for the TypeScript projection; the algorithm retains its upstream notices.
import {createProjectionDescriptor} from '../projection-descriptor';
import type {ProjectionDescriptor} from '../projection-descriptor';
export const lazyTiltedPerspective: ProjectionDescriptor =
  /* @__PURE__ */ createProjectionDescriptor(
    {name: 'tpers', aliases: ['Tilted_Perspective']},
    async () => (await import('@math.gl/proj4/projections/tpers')).tiltedPerspective
  );
