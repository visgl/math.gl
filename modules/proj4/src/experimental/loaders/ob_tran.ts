// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {createProjectionLoader} from '../projection-loader';
import type {ProjectionLoader} from '../projection-loader';
import type {ProjectionPlugin} from '../types';

/** The rotated projection and its child are both deferred until needed. */
export function obliqueTransformationLoader(
  wrapped: ProjectionPlugin | ProjectionLoader | 'longlat'
): ProjectionLoader {
  return createProjectionLoader(
    {
      name: 'ob_tran',
      aliases: ['General Oblique Transformation', 'General_Oblique_Transformation']
    },
    async () => {
      const [{obliqueTransformation}, child] = await Promise.all([
        import('@math.gl/proj4/projections/ob_tran'),
        typeof wrapped === 'string' || 'create' in wrapped ? wrapped : wrapped.preload()
      ]);
      return obliqueTransformation(child);
    }
  );
}
