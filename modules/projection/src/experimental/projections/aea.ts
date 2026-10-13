// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {createFlatProjection} from '../flat-projection';
import type {ProjectionPlugin} from '../types';
import {withRectangleRenderingProfile} from '../rendering-profile';
import {bindKernel, kernelParameters, ORIGIN_PARAMETERS, validateConic} from '../kernel';
import {createState, forward, inverse} from '../kernels/aea';

export const albersEqualArea: ProjectionPlugin = {
  name: 'aea',
  aliases: ['Albers_Conic_Equal_Area', 'Albers_Equal_Area', 'Albers'],
  parameters: [...ORIGIN_PARAMETERS, 'lat_1', 'lat_2'],
  create(context) {
    const base = kernelParameters(context);
    validateConic(base, context.parameters);
    return withRectangleRenderingProfile(
      {
        ...bindKernel('aea', createState(base), forward, inverse, createFlatProjection)
      },
      [base.long0 - Math.PI, -Math.PI / 2, base.long0 + Math.PI, Math.PI / 2]
    );
  }
};
