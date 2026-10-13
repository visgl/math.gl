// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original plugin adapter for the numerical kernel directly ported from proj4js 2.22.0.
import {numberParameter} from '../parameters';
import type {ProjectionPlugin} from '../types';
import {catalogueParameters, bindCatalogueKernel} from '../catalogue-kernel';
import {createState, forward, inverse} from '../kernels/eqearth';

export const equalEarth: ProjectionPlugin = {
  name: 'eqearth',
  aliases: ['Equal Earth', 'Equal_Earth'],
  parameters: ['lon_0', 'x_0', 'y_0'],
  create(context) {
    const base = catalogueParameters(context);

    const state = createState(base);
    // The kernel's authalic radius and polynomial determine the global extrema:
    // maximum width at the equatorial seam and maximum height at the poles.
    const e = Math.sqrt(context.eccentricitySquared);
    const radius =
      context.semiMajorAxis * (e ? Math.sqrt((1 + ((1 - e * e) * Math.atanh(e)) / e) / 2) : 1);
    const theta = Math.PI / 3,
      t2 = theta * theta,
      t6 = t2 ** 3;
    const width = (radius * Math.PI) / ((Math.sqrt(3) / 2) * 1.340264);
    const x0 = numberParameter(context.parameters, 'x_0', 0);
    const y0 = numberParameter(context.parameters, 'y_0', 0);
    const height = radius * theta * (1.340264 - 0.081106 * t2 + t6 * (0.000893 + 0.003796 * t2));
    return {
      ...bindCatalogueKernel('eqearth', context, state, forward, inverse),
      profile: {
        bounds: [
          [x0 - width, y0 - height, 0],
          [x0 + width, y0 + height, 0]
        ],
        longitudeCenter: base.long0,
        maxLatitude: Math.PI / 2
      }
    };
  }
};
