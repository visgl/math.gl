// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Lazy metadata for the TypeScript projection; the algorithm retains its upstream notices.
import {createProjectionLoader} from '../projection-loader';
import type {ProjectionLoader} from '../projection-loader';
export const equidistantCylindricalLoader: ProjectionLoader =
  /* @__PURE__ */ createProjectionLoader(
    {
      name: 'eqc',
      aliases: ['Equirectangular', 'Equidistant_Cylindrical', 'Equidistant_Cylindrical_Spherical']
    },
    async () => (await import('@math.gl/proj4/projections/eqc')).equidistantCylindrical
  );
