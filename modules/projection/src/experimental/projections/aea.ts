// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createFlatProjection} from '../flat-projection';
import type {ProjectionPlugin} from '../types';
import {bindKernel, kernelParameters, ORIGIN_PARAMETERS, validateConic} from '../kernel';
import {createState, forward, inverse} from '../kernels/aea';

export const albersEqualArea: ProjectionPlugin = {
  name: 'aea',
  aliases: ['Albers_Conic_Equal_Area', 'Albers_Equal_Area', 'Albers'],
  parameters: [...ORIGIN_PARAMETERS, 'lat_1', 'lat_2'],
  create(context) {
    const base = kernelParameters(context);
    validateConic(base, context.parameters);
    return bindKernel('aea', createState(base), forward, inverse, createFlatProjection);
  }
};
