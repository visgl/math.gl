// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ProjectionPlugin} from '../types';
import {conicBounds} from '../rendering-profile/rendering-bounds';
import {createAngularRanges} from '../rendering-profile/geographic-bounds';
import {withRectangleRenderingProfile} from '../rendering-profile/rectangular-rendering-profile';
import {createFlatProjection as createProjection} from '../flat-projection';
import {
  bindKernel,
  kernelParameters,
  ORIGIN_PARAMETERS,
  SCALE_PARAMETERS,
  validateConic
} from '../kernel';
import {createState, forward, inverse} from '../kernels/lcc';

export const lambertConformalConic: ProjectionPlugin = {
  name: 'lcc',
  aliases: [
    'Lambert Tangential Conformal Conic Projection',
    'Lambert_Conformal_Conic',
    'Lambert_Conformal_Conic_1SP',
    'Lambert_Conformal_Conic_2SP',
    'Lambert Conic Conformal (1SP)',
    'Lambert Conic Conformal (2SP)'
  ],
  parameters: [...ORIGIN_PARAMETERS, ...SCALE_PARAMETERS, 'lat_1', 'lat_2'],
  create(context) {
    const base = kernelParameters(context);
    validateConic(base, context.parameters);
    const state = createState(base);
    const implementation = bindKernel('lcc', state, forward, inverse);
    // The opposite pole diverges for LCC; its rendering target stops at 60 degrees.
    const projection = {
      ...createProjection(point => {
        const latitude = point.y;
        if (Math.abs(latitude) === Math.PI / 2 && latitude * state.ns < 0) {
          throw new Error('Lambert conformal conic is undefined at the opposite pole');
        }
        implementation.forwardInPlace!(point);
      }, implementation.inverseInPlace!)
    };
    return withRectangleRenderingProfile(
      projection,
      createAngularRanges(
        base.long0 - Math.PI,
        state.ns > 0 ? -Math.PI / 3 : -Math.PI / 2,
        base.long0 + Math.PI,
        state.ns > 0 ? Math.PI / 2 : Math.PI / 3
      ),
      ranges =>
        conicBounds(
          projection.forward,
          ranges,
          base.long0,
          state.ns,
          state.x0,
          state.y0 + state.k0 * state.rh,
          base.over
        ),
      base.primeMeridian,
      base.over
    );
  }
};
