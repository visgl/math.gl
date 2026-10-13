// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original plugin adapter for the numerical kernel directly ported from proj4js 2.22.0.
import type {ProjectionPlugin} from '../types';
import {catalogueParameters, bindCatalogueKernel} from '../catalogue-kernel';
import {numberParameter} from '../parameters';
import {createState, forward, inverse} from '../kernels/qsc';

export const quadrilateralizedSphericalCube: ProjectionPlugin = {
  name: 'qsc',
  aliases: ['Quadrilateralized Spherical Cube', 'Quadrilateralized_Spherical_Cube'],
  parameters: ['lon_0', 'x_0', 'y_0', 'lat_0'],
  create(context) {
    const base = catalogueParameters(context);

    const state = createState(base);
    const implementation = bindCatalogueKernel('qsc', context, state, forward, inverse);
    const x0 = numberParameter(context.parameters, 'x_0', 0);
    const y0 = numberParameter(context.parameters, 'y_0', 0);
    // A QSC rendering target is one cube face, including its square corners.
    return {
      ...implementation,
      profile: {
        bounds: [
          [x0 - base.a, y0 - base.a, 0],
          [x0 + base.a, y0 + base.a, 0]
        ],
        longitudeCenter: base.long0,
        maxLatitude: Math.PI / 2,
        normalize(point) {
          const [x, y] = implementation.forward(point.x, point.y);
          if (Math.abs(x - x0) <= base.a && Math.abs(y - y0) <= base.a) return;
          [point.x, point.y] = implementation.inverse(
            x0 + Math.max(-base.a, Math.min(base.a, x - x0)),
            y0 + Math.max(-base.a, Math.min(base.a, y - y0))
          );
        }
      }
    };
  }
};
