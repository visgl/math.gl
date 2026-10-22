// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) PROJ contributors
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Ellipsoidal gnomonic dispatch and inverse Newton equations adapted from PROJ 9.5.1 src/projections/gnom.cpp (Karney geodesic formulation). See ../../../projection/PROJ-LICENSE.txt. Geodesic evaluation uses the shared ellipsoid geodesic API.
import {EllipsoidGeodesic} from '../../ellipsoid-geodesic';
import type {KernelParameters, Point} from './kernel';
import adjust_lon from './common/adjust_lon';

const degrees = 180 / Math.PI;
export type EllipsoidalGnomonic = {engine: EllipsoidGeodesic; latitude: number};

export function prepareEllipsoidalGnomonic(base: KernelParameters): EllipsoidalGnomonic {
  return {
    engine: new EllipsoidGeodesic({semiMajorAxis: 1, semiMinorAxis: Math.sqrt(1 - base.es)}),
    latitude: base.lat0 * degrees
  };
}

export function forwardEllipsoidalGnomonic(
  base: KernelParameters,
  state: EllipsoidalGnomonic,
  p: Point
): Point {
  const result = state.engine.inverse(
    state.latitude,
    0,
    p.y * degrees,
    adjust_lon(p.x - base.long0, base.over) * degrees
  );
  if (!(result.M12 > 0)) throw new Error('Coordinate is outside the ellipsoidal gnomonic horizon');
  const radius = (base.a * result.m12) / result.M12;
  const azimuth = result.azi1 / degrees;
  p.x = base.x0 + radius * Math.sin(azimuth);
  p.y = base.y0 + radius * Math.cos(azimuth);
  return p;
}

export function inverseEllipsoidalGnomonic(
  base: KernelParameters,
  state: EllipsoidalGnomonic,
  p: Point
): Point {
  const x = (p.x - base.x0) / base.a;
  const y = (p.y - base.y0) / base.a;
  const radius = Math.hypot(x, y);
  if (radius === 0) {
    p.x = base.long0;
    p.y = base.lat0;
    return p;
  }
  const line = state.engine.line(state.latitude, 0, Math.atan2(x, y) * degrees);
  const little = radius <= 1;
  const target = little ? radius : 1 / radius;
  let distance = Math.atan(radius);
  // d(m/M)/ds = 1/M². Use its reciprocal near the horizon to avoid
  // overflow, and evaluate once more at the converged distance.
  for (let iteration = 0; iteration < 20; iteration++) {
    const result = line.position(distance);
    const step = little
      ? (result.m12 - target * result.M12) * result.M12
      : (target * result.m12 - result.M12) * result.m12;
    if (!Number.isFinite(step)) break;
    distance -= step;
    if (Math.abs(step) < 1e-14) {
      const final = line.position(distance);
      if (!(final.M12 > 0)) break;
      p.x = adjust_lon(base.long0 + final.lon2 / degrees, base.over);
      p.y = final.lat2 / degrees;
      return p;
    }
  }
  throw new Error('Ellipsoidal gnomonic inverse did not converge');
}
