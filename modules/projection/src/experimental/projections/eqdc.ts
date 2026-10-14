// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {createFlatProjection} from '../flat-projection';
import {conicBounds} from '../rendering-bounds';
import {withRectangleRenderingProfile} from '../rectangular-rendering-profile';
import type {ProjectionPlugin} from '../types';
import {bindKernel, kernelParameters, ORIGIN_PARAMETERS, validateConic} from '../kernel';
import {createState, forward, inverse} from '../kernels/eqdc';

export const equidistantConic: ProjectionPlugin = {
  name: 'eqdc',
  aliases: ['Equidistant_Conic'],
  parameters: [...ORIGIN_PARAMETERS, 'lat_1', 'lat_2'],
  create(context) {
    const base = kernelParameters(context);
    validateConic(base, context.parameters);
    const state = createState(base);
    // The rendering target covers one world; +over still permits conversion beyond it.
    const projection = bindKernel('eqdc', state, forward, inverse, createFlatProjection);
    return withRectangleRenderingProfile(
      projection,
      [base.long0 - Math.PI, -Math.PI / 2, base.long0 + Math.PI, Math.PI / 2],
      coverage =>
        conicBounds(
          projection.forward,
          coverage,
          base.long0,
          state.ns,
          state.x0,
          state.y0 + state.rh,
          base.over
        )
    );
  }
};
