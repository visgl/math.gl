// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ProjectionPlugin} from '../types';
import {transverseBounds} from '../rendering-bounds';
import {createAngularRanges} from '../geographic-bounds';
import {withRectangleRenderingProfile} from '../rectangular-rendering-profile';
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
    const implementation = createTransverseMercator({
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
    const center = ((6 * zone - 183) * Math.PI) / 180;
    // Standard six-degree UTM zone coverage, independent of conversion validity.
    return withRectangleRenderingProfile(
      implementation,
      createAngularRanges(
        center - Math.PI / 60,
        south ? (-80 * Math.PI) / 180 : 0,
        center + Math.PI / 60,
        south ? 0 : (84 * Math.PI) / 180
      ),
      ranges => transverseBounds(implementation.forward, ranges, center),
      context.primeMeridian ?? 0,
      Object.prototype.hasOwnProperty.call(context.parameters, 'over')
    );
  }
};
