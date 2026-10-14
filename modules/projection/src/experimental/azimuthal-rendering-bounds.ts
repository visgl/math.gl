// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {KernelParameters} from './kernel';
import type {GeographicRenderingBounds} from './rendering-profile';
import type {Vector, AngularDomain} from './spherical-rendering-domain';
import {sphericalRange, sphericalRatioRange} from './spherical-rendering-domain';
import {envelope, scale, add} from './rendering-bounds';

/** Exact extrema for spherical orthographic and linear-fractional azimuthal maps. */
export function sphericalAzimuthalBounds(
  base: KernelParameters,
  coverage: GeographicRenderingBounds,
  domain: AngularDomain | undefined,
  kind: 'ortho' | 'gnom' | 'stere'
) {
  const north = [-Math.sin(base.lat0), 0, Math.cos(base.lat0)] as const;
  const center = [Math.cos(base.lat0), 0, Math.sin(base.lat0)] as const;
  const east = [0, 1, 0] as const;
  const constant = kind === 'stere' ? 1 : 0;
  const range = (vector: Vector) =>
    kind === 'ortho'
      ? sphericalRange(vector, coverage, domain)
      : sphericalRatioRange(vector, center, constant, coverage, domain);
  const factor = base.a * (kind === 'stere' ? 2 * base.k0 : 1);
  return envelope(
    add([base.x0, base.x0], scale(range(east), factor)),
    add([base.y0, base.y0], scale(range(north), factor))
  );
}

/** The ellipsoid's maximum curvature radius bounds the shortest geodesic length. */
export function equidistantAzimuthalBounds(
  base: KernelParameters,
  coverage: GeographicRenderingBounds,
  domain?: AngularDomain
) {
  const minimum = sphericalRange(
    [Math.cos(base.lat0), 0, Math.sin(base.lat0)],
    coverage,
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
  coverage: GeographicRenderingBounds,
  domain: AngularDomain | undefined,
  latitude: number,
  transformLatitude: (latitude: number) => number
) {
  const region: GeographicRenderingBounds = [
    coverage[0],
    transformLatitude(coverage[1]),
    coverage[2],
    transformLatitude(coverage[3])
  ];
  const center = [Math.cos(latitude), 0, Math.sin(latitude)] as const;
  const north = [-Math.sin(latitude), 0, Math.cos(latitude)] as const;
  const d = sphericalRange(center, region);
  const factor: [number, number] = [
    Math.sqrt(2 / (1 + Math.min(1, d[1]))),
    d[0] > -1 + 1e-14 ? Math.sqrt(2 / (1 + d[0])) : Infinity
  ];
  const axisBounds = (vector: Vector, unit: number) => {
    const range = sphericalRange(vector, region);
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
  coverage: GeographicRenderingBounds,
  domain?: AngularDomain,
  longitudeScale = 1,
  latitudeError = base.e * Math.atanh(base.e)
) {
  const region: GeographicRenderingBounds = [
    coverage[0] * longitudeScale,
    conformalLatitude(coverage[1]),
    coverage[2] * longitudeScale,
    conformalLatitude(coverage[3])
  ];
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
  const longitudeWidth = region[2] - region[0];
  const wrapped =
    longitudeWidth >= 2 * Math.PI ? ([-Math.PI, region[1], Math.PI, region[3]] as const) : region;
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
  coverage: GeographicRenderingBounds,
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
    coverage,
    domain
  );
  const y = sphericalRatioRange(
    up as [number, number, number],
    denominator,
    cw * p,
    coverage,
    domain
  );
  // The existing numerical kernel returns image coordinates without false offsets.
  return envelope(
    add([base.x0, base.x0], scale(x, base.a * (p - 1) * cw)),
    add([base.y0, base.y0], scale(y, base.a * (p - 1)))
  );
}
