// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {createFlatProjection} from '../flat-projection';
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
    return bindKernel('eqdc', createState(base), forward, inverse, createFlatProjection);
  }
};
