// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {createProjectionDescriptor} from '../projection-descriptor';
import type {ProjectionDescriptor} from '../projection-descriptor';
import type {ProjectionPlugin} from '../types';

/** The rotated projection and its child are both deferred until needed. */
export function lazyObliqueTransformation(
  wrapped: ProjectionPlugin | ProjectionDescriptor | 'longlat'
): ProjectionDescriptor {
  return createProjectionDescriptor(
    {
      name: 'ob_tran',
      aliases: ['General Oblique Transformation', 'General_Oblique_Transformation']
    },
    async () => {
      const [{obliqueTransformation}, child] = await Promise.all([
        import('@math.gl/projection/projections/ob_tran'),
        typeof wrapped === 'string' || 'create' in wrapped ? wrapped : wrapped.preload()
      ]);
      return obliqueTransformation(child);
    }
  );
}
