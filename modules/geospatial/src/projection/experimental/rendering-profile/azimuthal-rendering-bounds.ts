// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {KernelParameters} from '../kernel';
import {createAngularRanges} from './geographic-bounds';
import type {AngularRanges} from './geographic-bounds';
import type {Vector, AngularDomain} from './spherical-rendering-domain';
import {sphericalExtremum, sphericalRange, sphericalRatioRange} from './spherical-rendering-domain';
import {envelope, scale, add, multiply, ordered} from './rendering-bounds';

/** Exact extrema for spherical orthographic and linear-fractional azimuthal maps. */
export function sphericalAzimuthalBounds(
  base: KernelParameters,
  parameters: AngularRanges,
  domain: AngularDomain | undefined,
  kind: 'ortho' | 'gnom' | 'stere'
) {
  const north = [-Math.sin(base.lat0), 0, Math.cos(base.lat0)] as const;
  const center = [Math.cos(base.lat0), 0, Math.sin(base.lat0)] as const;
  const east = [0, 1, 0] as const;
  const constant = kind === 'stere' ? 1 : 0;
  const range = (vector: Vector) =>
    kind === 'ortho'
      ? sphericalRange(vector, parameters, domain)
      : sphericalRatioRange(vector, center, constant, parameters, domain);
  const factor = base.a * (kind === 'stere' ? 2 * base.k0 : 1);
  return envelope(
    add([base.x0, base.x0], scale(range(east), factor)),
    add([base.y0, base.y0], scale(range(north), factor))
  );
}

/** Enclose ellipsoidal orthographic ECEF components over the visible region. */
export function orthographicBounds(
  base: KernelParameters,
  parameters: AngularRanges,
  domain?: AngularDomain
) {
  const sin0 = Math.sin(base.lat0);
  const cos0 = Math.cos(base.lat0);
  const latitudeSin = sphericalRange([0, 0, 1], parameters, domain);
  if (Math.abs(sin0) < 1e-15 && (!domain || Math.abs(domain.distance - Math.PI / 2) < 1e-15)) {
    // On an equatorial hemisphere, visibility restricts longitude only. The
    // parallel radius decreases with |latitude|, so x has the same extremizers
    // as its spherical counterpart; ellipsoidal northing is monotone in sin(phi).
    const x = (maximize: boolean) => {
      const extremum = sphericalExtremum([0, 1, 0], parameters, domain, maximize);
      return extremum.value / Math.sqrt(1 - base.es * Math.sin(extremum.point[1]) ** 2);
    };
    const y = (sin: number) => ((1 - base.es) * sin) / Math.sqrt(1 - base.es * sin * sin);
    return envelope(
      add([base.x0, base.x0], scale([x(false), x(true)], base.a * base.k0)),
      add([base.y0, base.y0], scale([y(latitudeSin[0]), y(latitudeSin[1])], base.a * base.k0))
    );
  }

  const squareMin =
    latitudeSin[0] <= 0 && latitudeSin[1] >= 0
      ? 0
      : Math.min(latitudeSin[0] ** 2, latitudeSin[1] ** 2);
  const squareMax = Math.max(latitudeSin[0] ** 2, latitudeSin[1] ** 2);
  const nu = ordered(
    1 / Math.sqrt(1 - base.es * squareMin),
    1 / Math.sqrt(1 - base.es * squareMax)
  );
  const factor = base.a * base.k0;
  const yShift = (base.es * sin0 * cos0) / Math.sqrt(1 - base.es * sin0 * sin0);
  return envelope(
    add(
      [base.x0, base.x0],
      scale(multiply(sphericalRange([0, 1, 0], parameters, domain), nu), factor)
    ),
    add(
      [base.y0 + factor * yShift, base.y0 + factor * yShift],
      scale(
        multiply(sphericalRange([-sin0, 0, (1 - base.es) * cos0], parameters, domain), nu),
        factor
      )
    )
  );
}

/** The ellipsoid's maximum curvature radius bounds the shortest geodesic length. */
export function equidistantAzimuthalBounds(
  base: KernelParameters,
  parameters: AngularRanges,
  domain?: AngularDomain
) {
  const minimum = sphericalRange(
    [Math.cos(base.lat0), 0, Math.sin(base.lat0)],
    parameters,
    domain
  )[0];
  const radius = (base.a / Math.sqrt(1 - base.es)) * Math.acos(Math.max(-1, Math.min(1, minimum)));
  return envelope([base.x0 - radius, base.x0 + radius], [base.y0 - radius, base.y0 + radius]);
}

/** Equal-area azimuthal maps lie in the authalic disk (an ellipse after axis scaling). */
export function equalAreaAzimuthalBounds(
  base: KernelParameters,
  xFactor: number,
  yFactor: number,
  parameters: AngularRanges,
  domain: AngularDomain | undefined,
  latitude: number,
  transformLatitude: (latitude: number) => number
) {
  // Check the geodetic intersection before changing latitude: an empty target
  // must trigger default-profile fallback, rather than leave normalization unusable.
  const latitudes = domain && sphericalRange([0, 0, 1], parameters, domain);
  const region: AngularRanges = createAngularRanges(
    parameters[0][0],
    transformLatitude(latitudes ? Math.asin(Math.max(-1, latitudes[0])) : parameters[0][1]),
    parameters[1][0],
    transformLatitude(latitudes ? Math.asin(Math.min(1, latitudes[1])) : parameters[1][1])
  );
  // Authalic latitude has meridional metric >= (1-e²)² and longitude metric
  // >= 1. This lower bound on distance from the antipode encloses the transformed
  // geodetic cap; the spherical case retains its exact angular boundary.
  const cap = domain && {
    latitude,
    distance: Math.PI - (1 - base.es) ** 2 * (Math.PI - domain.distance)
  };
  const center = [Math.cos(latitude), 0, Math.sin(latitude)] as const;
  const north = [-Math.sin(latitude), 0, Math.cos(latitude)] as const;
  const d = sphericalRange(center, region, cap);
  const factor: [number, number] = [
    Math.sqrt(2 / (1 + Math.min(1, d[1]))),
    d[0] > -1 + 1e-14 ? Math.sqrt(2 / (1 + d[0])) : Infinity
  ];
  const axisBounds = (vector: Vector, unit: number) => {
    const range = sphericalRange(vector, region, cap);
    const minimum = range[0] === 0 ? 0 : range[0] * (range[0] < 0 ? factor[1] : factor[0]);
    const maximum = range[1] === 0 ? 0 : range[1] * (range[1] > 0 ? factor[1] : factor[0]);
    return scale([Math.max(-2, minimum), Math.min(2, maximum)], base.a * unit);
  };
  return envelope(
    add([base.x0, base.x0], axisBounds([0, 1, 0], xFactor)),
    add([base.y0, base.y0], axisBounds(north, yFactor))
  );
}

/** Conformal latitude is monotone. Its isometric shift is at most e*atanh(e),
 * which bounds angular displacement on the auxiliary sphere without sampling.
 */
export function ellipsoidalStereographicBounds(
  base: KernelParameters,
  conformalLatitude: (latitude: number) => number,
  centerLatitude: number,
  radius: number,
  parameters: AngularRanges,
  domain?: AngularDomain,
  longitudeScale = 1,
  latitudeError = base.e * Math.atanh(base.e)
) {
  const region: AngularRanges = createAngularRanges(
    parameters[0][0] * longitudeScale,
    conformalLatitude(parameters[0][1]),
    parameters[1][0] * longitudeScale,
    conformalLatitude(parameters[1][1])
  );
  const padding = 2 * latitudeError + Math.PI * Math.abs(longitudeScale - 1);
  // The conformal-sphere metric has minimum scale 1-e². Applying that
  // bound to distance from the antipode also handles strongly flattened axes.
  const capDistance =
    domain && longitudeScale === 1
      ? Math.min(domain.distance + padding, Math.PI - (1 - base.es) * (Math.PI - domain.distance))
      : domain && domain.distance + padding;
  const cap =
    capDistance && capDistance < Math.PI
      ? {latitude: centerLatitude, distance: capDistance}
      : undefined;
  const center = [Math.cos(centerLatitude), 0, Math.sin(centerLatitude)] as const;
  const north = [-Math.sin(centerLatitude), 0, Math.cos(centerLatitude)] as const;
  const longitudeWidth = region[1][0] - region[0][0];
  const wrapped =
    longitudeWidth >= 2 * Math.PI
      ? createAngularRanges(-Math.PI, region[0][1], Math.PI, region[1][1])
      : region;
  const x = sphericalRatioRange([0, 1, 0], center, 1, wrapped, cap);
  const y = sphericalRatioRange(north, center, 1, wrapped, cap);
  return envelope(
    add([base.x0, base.x0], scale(x, radius)),
    add([base.y0, base.y0], scale(y, radius))
  );
}

/** Perspective tilt preserves a linear-fractional form in sphere coordinates. */
export function perspectiveBounds(
  base: KernelParameters,
  p: number,
  tilt: number,
  azimuth: number,
  parameters: AngularRanges,
  domain?: AngularDomain
) {
  const center = [Math.cos(base.lat0), 0, Math.sin(base.lat0)];
  const north = [-Math.sin(base.lat0), 0, Math.cos(base.lat0)];
  const east = [0, 1, 0];
  const cg = Math.cos(azimuth),
    sg = Math.sin(azimuth),
    cw = Math.cos(tilt),
    sw = Math.sin(tilt);
  const up = north.map((value, index) => cg * value + sg * east[index]);
  const right = east.map((value, index) => cg * value - sg * north[index]);
  const denominator = center.map((value, index) => -cw * value + sw * up[index]) as [
    number,
    number,
    number
  ];
  const x = sphericalRatioRange(
    right as [number, number, number],
    denominator,
    cw * p,
    parameters,
    domain
  );
  const y = sphericalRatioRange(
    up as [number, number, number],
    denominator,
    cw * p,
    parameters,
    domain
  );
  // The existing numerical kernel returns image coordinates without false offsets.
  return envelope(
    add([base.x0, base.x0], scale(x, base.a * (p - 1) * cw)),
    add([base.y0, base.y0], scale(y, base.a * (p - 1)))
  );
}
