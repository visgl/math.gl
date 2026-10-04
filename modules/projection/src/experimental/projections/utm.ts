// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ProjectionPlugin} from '../types';
import {numberParameter} from '../parameters';
import {flagParameter} from '../kernel';
import {createTransverseMercator} from './transverse-mercator';

export const universalTransverseMercator: ProjectionPlugin = {
  name: 'utm',
  aliases: ['Universal Transverse Mercator System'],
  parameters: ['zone', 'south', 'approx'],
  flags: ['south', 'approx'],
  create(context) {
    const zone = numberParameter(context.parameters, 'zone', NaN);
    if (!Number.isInteger(zone) || zone < 1 || zone > 60) {
      throw new Error('UTM requires an integer +zone from 1 to 60');
    }
    const south = flagParameter(context.parameters, 'south');
    return createTransverseMercator({
      ...context,
      parameters: {
        ...context.parameters,
        lat_0: '0',
        lon_0: String(6 * zone - 183),
        x_0: '500000',
        y_0: south ? '10000000' : '0',
        k_0: '0.9996'
      }
    });
  }
};
