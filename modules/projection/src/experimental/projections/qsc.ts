// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original plugin adapter for the numerical kernel directly ported from proj4js 2.22.0.
import type {ProjectionPlugin} from '../types';
import {createGeographicProfile} from '../rendering-profile/geographic-rendering-profile';
import {catalogueParameters, bindCatalogueKernel} from '../catalogue-kernel';
import {numberParameter} from '../parameters';
import {createState, forward, inverse} from '../kernels/qsc';
import {createAngularRanges} from '../rendering-profile/geographic-bounds';
import {createRectangleRenderingProfile} from '../rendering-profile/rectangular-rendering-profile';
import {sphericalRange} from '../rendering-profile/spherical-rendering-domain';
import {envelope} from '../rendering-profile/rendering-bounds';

export const quadrilateralizedSphericalCube: ProjectionPlugin = {
  name: 'qsc',
  aliases: ['Quadrilateralized Spherical Cube', 'Quadrilateralized_Spherical_Cube'],
  parameters: ['lon_0', 'x_0', 'y_0', 'lat_0'],
  create(context) {
    const base = catalogueParameters(context);
    const primeMeridian = context.primeMeridian ?? 0;

    const state = createState(base);
    const implementation = bindCatalogueKernel('qsc', context, state, forward, inverse);
    const x0 = numberParameter(context.parameters, 'x_0', 0);
    const y0 = numberParameter(context.parameters, 'y_0', 0);
    // A QSC rendering target is one cube face, including its square corners.
    return {
      ...implementation,
      longitudeOrigin: base.long0,
      getRenderingProfile(coverage) {
        if (coverage)
          return createRectangleRenderingProfile(
            region => {
              const latitude = (phi: number) =>
                base.es ? Math.atan((1 - base.es) * Math.tan(phi)) : phi;
              const local = createAngularRanges(
                region[0][0] - base.long0,
                latitude(region[0][1]),
                region[1][0] - base.long0,
                latitude(region[1][1])
              );
              const axis =
                state.face === 5
                  ? ([0, 0, 1] as const)
                  : state.face === 6
                    ? ([0, 0, -1] as const)
                    : ([1, 0, 0] as const);
              const cosine = sphericalRange(axis, local)[0];
              // QSC's reduced sector has |mu|, |theta| <= pi/4. Bound its
              // denominator away from zero over the whole sector analytically.
              const radius = base.a * Math.sqrt((1 - cosine) / (0.5 * (1 - Math.SQRT1_2)));
              return envelope([x0 - radius, x0 + radius], [y0 - radius, y0 + radius]);
            },
            coverage,
            base.long0,
            primeMeridian
          );
        const defaultBounds = [
          [x0 - base.a, y0 - base.a, 0],
          [x0 + base.a, y0 + base.a, 0]
        ] as const;
        return {
          bounds: defaultBounds,
          normalize(point) {
            createGeographicProfile(context.parameters, primeMeridian)().normalize!(point);
            const [x, y] = implementation.forward(point.x, point.y);
            if (Math.abs(x - x0) <= base.a && Math.abs(y - y0) <= base.a) return;
            [point.x, point.y] = implementation.inverse(
              x0 + Math.max(-base.a, Math.min(base.a, x - x0)),
              y0 + Math.max(-base.a, Math.min(base.a, y - y0))
            );
          }
        };
      }
    };
  }
};
