// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Lazy metadata for the projection engine; the algorithm retains its upstream notices.
import {createProjectionDescriptor} from '../projection-descriptor';
import type {ProjectionDescriptor} from '../projection-descriptor';
export const lazyQuadrilateralizedSphericalCube: ProjectionDescriptor =
  /* @__PURE__ */ createProjectionDescriptor(
    {
      name: 'qsc',
      aliases: ['Quadrilateralized Spherical Cube', 'Quadrilateralized_Spherical_Cube']
    },
    async () => (await import('@math.gl/projection/projections/qsc')).quadrilateralizedSphericalCube
  );
