// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {createFlatProjection} from '../flat-projection';
import type {ProjectionPlugin} from '../types';
import {conicBounds} from '../rendering-profile/rendering-bounds';
import {createAngularRanges} from '../rendering-profile/geographic-bounds';
import {withRectangleRenderingProfile} from '../rendering-profile/rectangular-rendering-profile';
import {bindKernel, kernelParameters, ORIGIN_PARAMETERS, validateConic} from '../kernel';
import {createState, forward, inverse} from '../kernels/aea';

export const albersEqualArea: ProjectionPlugin = {
  name: 'aea',
  aliases: ['Albers_Conic_Equal_Area', 'Albers_Equal_Area', 'Albers'],
  parameters: [...ORIGIN_PARAMETERS, 'lat_1', 'lat_2'],
  create(context) {
    const base = kernelParameters(context);
    validateConic(base, context.parameters);
    const state = createState(base);
    const projection = {
      ...bindKernel('aea', state, forward, inverse, createFlatProjection)
    };
    return withRectangleRenderingProfile(
      projection,
      createAngularRanges(base.long0 - Math.PI, -Math.PI / 2, base.long0 + Math.PI, Math.PI / 2),
      ranges =>
        conicBounds(
          projection.forward,
          ranges,
          base.long0,
          state.ns0,
          state.x0,
          state.y0 + state.rh,
          base.over
        ),
      base.primeMeridian,
      base.over
    );
  }
};
