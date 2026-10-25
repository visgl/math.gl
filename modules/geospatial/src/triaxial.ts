// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original normal/parametric/geocentric surface coordinates and Cartesian geodesic ODE. Qualified independently against GeographicLib 2.7 Jacobi trajectories (Charles Karney, MIT), not a port of that implementation.
import type {NumericArray} from '@math.gl/core/types';
import {integrateGeodesic} from './triaxial/integrate';
export type TriaxialCoordinates = 'geodetic' | 'parametric' | 'geocentric';
export type TriaxialParameters = {radii: readonly [number, number, number]};
export type CartesianGeodesicState = {
  position: [number, number, number];
  direction: [number, number, number];
  distance: number;
};
export interface TriaxialGeodesicLine {
  position(distance: number): CartesianGeodesicState;
}
type Vec = Readonly<NumericArray>;
function unit(v: Vec): [number, number, number] {
  const scale = Math.max(Math.abs(v[0]), Math.abs(v[1]), Math.abs(v[2]));
  if (!(scale > 0 && Number.isFinite(scale)))
    throw new RangeError('Expected nonzero finite direction');
  const x = v[0] / scale,
    y = v[1] / scale,
    z = v[2] / scale,
    n = Math.hypot(x, y, z);
  return [x / n, y / n, z / n];
}
function vector(v: Vec) {
  if (v.length !== 3 || !v.every(Number.isFinite))
    throw new RangeError('Expected three finite coordinates');
}
function system(s: TriaxialCoordinates) {
  if (!['geodetic', 'parametric', 'geocentric'].includes(s))
    throw new RangeError('Unknown triaxial coordinate system');
}
function trig(degrees: number) {
  const x = (((degrees % 360) + 540) % 360) - 180;
  return {
    s: x === 0 || Math.abs(x) === 180 ? 0 : Math.sin((x * Math.PI) / 180),
    c: Math.abs(x) === 90 ? 0 : Math.cos((x * Math.PI) / 180)
  };
}
/** Surface-only coordinate/direction conversions on three-radius ellipsoids.
 * Angles are degrees, pole longitude is zero. Shapes need not be axis-sorted.
 */
export class TriaxialEllipsoid {
  private readonly snapshot: readonly [number, number, number];
  private readonly scale: number;
  private readonly axes: readonly number[];
  constructor({radii}: TriaxialParameters) {
    if (
      radii.length !== 3 ||
      !radii.every(x => Number.isFinite(x) && x >= 1e-60 && x <= 1e60) ||
      Math.min(...radii) / Math.max(...radii) < 0.25
    )
      throw new RangeError('Triaxial axes require [1e-60,1e60] and min/max >= 0.25');
    this.snapshot = Object.freeze([...radii]) as readonly [number, number, number];
    this.scale = Math.max(...radii);
    this.axes = Object.freeze(radii.map(r => r / this.scale));
  }
  get radii(): readonly [number, number, number] {
    return this.snapshot;
  }
  /** Area-uniform surface point from independent uniform [0,1) random draws.
   * Rejection corrects the linear sphere-to-ellipsoid area Jacobian; work is bounded.
   */
  sampleSurface(random: () => number = Math.random): [number, number, number] {
    const draw = () => {
      const u = random();
      if (!Number.isFinite(u) || u < 0 || u >= 1)
        throw new RangeError('Random draws must be in [0,1)');
      return u;
    };
    const minimum = Math.min(...this.axes);
    for (let attempt = 0; attempt < 1024; attempt++) {
      const z = 2 * draw() - 1,
        angle = 2 * Math.PI * draw(),
        radius = Math.sqrt((1 - z) * (1 + z));
      const u = [radius * Math.cos(angle), radius * Math.sin(angle), z];
      const acceptance =
        minimum === 1 ? 1 : Math.min(1, minimum * Math.hypot(...u.map((x, i) => x / this.axes[i])));
      if (draw() < acceptance)
        return u.map((x, i) => x * this.radii[i]) as [number, number, number];
    }
    throw new RangeError('Surface sampling work limit exceeded');
  }
  toCartesian(
    latitude: number,
    longitude: number,
    coordinates: TriaxialCoordinates = 'geodetic'
  ): [number, number, number] {
    system(coordinates);
    if (!Number.isFinite(latitude) || Math.abs(latitude) > 90 || !Number.isFinite(longitude))
      throw new RangeError('Invalid triaxial latitude/longitude');
    const p = trig(latitude),
      l = trig(longitude),
      n = [p.c * l.c, p.c * l.s, p.s],
      r = this.axes;
    if (coordinates === 'parametric')
      return n.map((x, i) => x * this.radii[i]) as [number, number, number];
    const denominator =
      coordinates === 'geodetic'
        ? Math.hypot(...n.map((x, i) => x * r[i]))
        : Math.hypot(...n.map((x, i) => x / r[i]));
    return n.map(
      (x, i) => (this.scale * x * (coordinates === 'geodetic' ? r[i] * r[i] : 1)) / denominator
    ) as [number, number, number];
  }
  fromCartesian(
    position: Vec,
    coordinates: TriaxialCoordinates = 'geodetic'
  ): {latitude: number; longitude: number} {
    system(coordinates);
    const p = this.surface(position);
    const v = p.map((x, i) =>
      coordinates === 'geodetic'
        ? x / this.axes[i] ** 2
        : coordinates === 'parametric'
          ? x / this.axes[i]
          : x
    );
    return {
      latitude: (Math.atan2(v[2], Math.hypot(v[0], v[1])) * 180) / Math.PI,
      longitude: v[0] === 0 && v[1] === 0 ? 0 : (Math.atan2(v[1], v[0]) * 180) / Math.PI
    };
  }
  directionToCartesian(position: Vec, azimuth: number): [number, number, number] {
    if (!Number.isFinite(azimuth)) throw new RangeError('Invalid triaxial bearing');
    const {north, east} = this.basis(position),
      a = trig(azimuth);
    return unit(north.map((x, i) => x * a.c + east[i] * a.s));
  }
  directionFromCartesian(position: Vec, direction: Vec): number {
    vector(direction);
    const {north, east, normal} = this.basis(position),
      v = unit(direction);
    if (Math.abs(v.reduce((s, x, i) => s + x * normal[i], 0)) > 2e-12)
      throw new RangeError('Direction must be tangent');
    return (
      (Math.atan2(
        v.reduce((s, x, i) => s + x * east[i], 0),
        v.reduce((s, x, i) => s + x * north[i], 0)
      ) *
        180) /
      Math.PI
    );
  }
  private surface(position: Vec): number[] {
    vector(position);
    const p = Array.from(position, x => x / this.scale);
    const residual = p.reduce((s, x, i) => s + (x / this.axes[i]) ** 2, 0);
    if (!Number.isFinite(residual) || Math.abs(residual - 1) > 2e-12)
      throw new RangeError('Point must lie on the ellipsoid surface');
    return p;
  }
  private basis(position: Vec) {
    const p = this.surface(position),
      normal = unit(p.map((x, i) => x / this.axes[i] ** 2));
    const horizontal = Math.hypot(p[0], p[1]),
      meridian = horizontal ? [-p[1] / horizontal, p[0] / horizontal, 0] : [0, 1, 0];
    const cross = (a: Vec, b: Vec) => [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]
    ];
    const north = unit(cross(normal, meridian)),
      east = unit(cross(north, normal));
    return {north, east, normal};
  }
  /** Cartesian initial-value geodesic. No global triaxial inverse is implied. */
  line(position: Vec, direction: Vec): TriaxialGeodesicLine {
    const p = this.surface(position);
    this.directionFromCartesian(position, direction);
    const v = unit(direction),
      initial = Object.freeze([...p, ...v]),
      q = this.axes.map(r => 1 / (r * r)),
      scale = this.scale;
    return {
      position: (distance: number) => {
        if (!Number.isFinite(distance) || Math.abs(distance) > 2 * Math.PI * scale)
          throw new RangeError('Triaxial distance exceeds one max-axis circuit');
        const y =
          distance === 0 ? Array.from(initial) : integrateGeodesic(initial, q, distance / scale);
        return {
          position: y.slice(0, 3).map(x => x * scale) as [number, number, number],
          direction: y.slice(3) as [number, number, number],
          distance
        };
      }
    };
  }
  direct(position: Vec, direction: Vec, distance: number): CartesianGeodesicState {
    return this.line(position, direction).position(distance);
  }
}
