// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {CapMap} from './cap-map';
import {DiscontinuousMap, type MapRegion} from './map-layout';
import {RAD, geographic, coordinates, dot, type Vector, type Position} from './math';
import {
  worldKernels,
  createWorldKernel,
  type WorldProjectionParameters,
  type WorldProjection
} from './world-kernels';
export type {WorldProjection, WorldProjectionParameters} from './world-kernels';
export type WorldMapOptions = {
  projection: WorldProjection;
  parameters?: WorldProjectionParameters;
  radius?: number;
  centralMeridian?: number;
};
type Kernel = ((lambda: number, phi: number) => number[]) & {
  invert?: (x: number, y: number) => number[] | null | undefined;
};
const PI = Math.PI,
  HALF = PI / 2;
const clamp = (x: number, low: number, high: number) => Math.max(low, Math.min(high, x));
const wrap = (x: number) => ((((x + PI) % (2 * PI)) + 2 * PI) % (2 * PI)) - PI;

/** Ordinary world projections with chart-local antimeridian limits and inverses. */
export function createWorldMap({
  projection,
  parameters,
  radius = 1,
  centralMeridian = 0
}: WorldMapOptions) {
  if (!Object.prototype.hasOwnProperty.call(worldKernels, projection))
    throw new Error('Unknown world projection');
  if (!Number.isFinite(radius) || radius <= 0 || !Number.isFinite(centralMeridian))
    throw new Error('Expected positive finite radius and finite centralMeridian');
  const kernel = createWorldKernel(projection, parameters) as Kernel;
  const aspect: Position =
    projection === 'bertin1953'
      ? [-16.5, -42]
      : projection === 'sinu-mollweide'
        ? [-20, -55]
        : [0, 0];
  return createKernelMap({kernel, radius, centralMeridian, aspect});
}

/** Internal chart builder shared by world and cap-clipped formulas. */
export function createKernelMap({
  kernel,
  radius = 1,
  centralMeridian = 0,
  aspect = [0, 0],
  clipAngle,
  frame
}: {
  kernel: Kernel;
  radius?: number;
  centralMeridian?: number;
  aspect?: readonly [number, number, number?];
  frame?: readonly [Vector, Vector, Vector];
  clipAngle?: number;
}): DiscontinuousMap {
  const cap = (clipAngle ?? 180) * RAD;
  const raw: Kernel = (lambda, phi) => {
    const x = Math.cos(lambda) * Math.cos(phi),
      theta = Math.acos(clamp(x, -1, 1));
    if (!clipAngle || theta <= cap) return kernel(lambda, phi);
    const y = Math.sin(lambda) * Math.cos(phi),
      z = Math.sin(phi),
      n = Math.hypot(y, z);
    if (n < 1e-14) return [0, 0];
    const q = coordinates([Math.cos(cap), (Math.sin(cap) * y) / n, (Math.sin(cap) * z) / n]);
    const p = kernel(q[0] * RAD, q[1] * RAD),
      taper = (PI - theta) / (PI - cap);
    return [p[0] * taper, p[1] * taper];
  };
  raw.invert = kernel.invert;
  const offset = wrap((centralMeridian - aspect[0]) * RAD);
  const pitch = aspect[1] * RAD;
  const rotateLatitude = (p: Position, angle: number): Position => {
    const [x, y, z] = geographic(p),
      c = Math.cos(angle),
      s = Math.sin(angle);
    return coordinates([c * x - s * z, y, s * x + c * z]);
  };
  const roll = (aspect[2] ?? 0) * RAD;
  const rotateRoll = (p: Position, angle: number): Position => {
    const [x, y, z] = geographic(p),
      c = Math.cos(angle),
      s = Math.sin(angle);
    return coordinates([x, c * y - s * z, s * y + c * z]);
  };
  const local = (p: readonly number[]): Position => {
    if (frame) {
      const v = geographic(p);
      return coordinates([dot(v, frame[0]), dot(v, frame[1]), dot(v, frame[2])]);
    }
    let q: Position = [p[0] - offset / RAD, p[1]];
    if (pitch) q = rotateLatitude(q, pitch);
    if (roll) q = rotateRoll(q, roll);
    return q;
  };
  const source = (p: Position): Position => {
    if (frame) {
      const v = geographic(p);
      return coordinates(
        [0, 1, 2].map(i => v[0] * frame[0][i] + v[1] * frame[1][i] + v[2] * frame[2][i]) as Vector
      );
    }
    let q = roll ? rotateRoll(p, -roll) : p;
    if (pitch) q = rotateLatitude(q, -pitch);
    return [wrap(q[0] * RAD + offset) / RAD, q[1]];
  };
  const regions: MapRegion[] = [];
  for (const sign of [1, -1])
    for (let i = 0; i < 4; i++) {
      if (clipAngle && clipAngle <= 90 && (i === 0 || i === 3)) continue;
      const west = -PI + i * HALF,
        east = west + HALF,
        center = (west + east) / 2;
      const south = sign < 0 ? -HALF : 0,
        north = sign < 0 ? 0 : HALF;
      const seeds: Position[] = [];
      for (let x = 0; x <= 4; x++)
        for (let y = 0; y <= 4; y++)
          seeds.push([west + ((east - west) * x) / 4, south + ((north - south) * y) / 4]);
      const projectedSeeds = seeds.map(p => raw(...p));
      const inside = (p: number[]) =>
        p?.length === 2 &&
        p.every(Number.isFinite) &&
        p[0] >= west - 1e-9 &&
        p[0] <= east + 1e-9 &&
        p[1] >= south - 1e-9 &&
        p[1] <= north + 1e-9 &&
        (!clipAngle || Math.cos(p[0]) * Math.cos(p[1]) >= Math.cos(cap) - 1e-12);
      const error = (p: number[], target: readonly number[]) =>
        Math.hypot(p[0] - target[0], p[1] - target[1]);
      const invert = (target: readonly number[]): Position | null => {
        // A flat pole edge is singular for a two-dimensional Newton solve.
        // Invert its one-dimensional limit before trying interior seeds.
        const pole = sign * HALF,
          left = raw(west, pole),
          right = raw(east, pole);
        const dx = right[0] - left[0],
          dy = right[1] - left[1],
          length = dx * dx + dy * dy;
        const fraction = length
          ? clamp(((target[0] - left[0]) * dx + (target[1] - left[1]) * dy) / length, 0, 1)
          : 0.5;
        const poleLambda = west + fraction * (east - west);
        if (inside([poleLambda, pole]) && error(raw(poleLambda, pole), target) < 1e-13)
          return [poleLambda, pole];

        const candidate = raw.invert?.(target[0], target[1]);
        if (
          candidate &&
          inside(candidate) &&
          error(raw(candidate[0], candidate[1]), target) < 1e-10
        )
          return [clamp(candidate[0], west, east), clamp(candidate[1], south, north)];
        const ordered = seeds
          .map((p, j) => ({p, error: error(projectedSeeds[j], target)}))
          .filter(s => Number.isFinite(s.error) && inside(s.p) && Math.abs(s.p[1]) < HALF - 1e-10)
          .sort((a, b) => a.error - b.error);
        const starts: Position[] = candidate && inside(candidate) ? [candidate as Position] : [];
        starts.push(...ordered.slice(0, 3).map(s => s.p));
        for (const seed of starts) {
          let lambda = clamp(seed[0], west, east),
            phi = clamp(seed[1], south, north);
          for (let iteration = 0; iteration < 35; iteration++) {
            const q = raw(lambda, phi),
              residual = error(q, target);
            if (residual < 1e-10) return [lambda, phi];
            const step = 1e-6;
            const lx = clamp(lambda + step, west, east),
              rx = lx === lambda ? lambda - step : lambda;
            const ly = clamp(phi + step, south, north),
              ry = ly === phi ? phi - step : phi;
            const x0 = raw(rx, phi),
              x1 = raw(lx, phi),
              y0 = raw(lambda, ry),
              y1 = raw(lambda, ly);
            const a = (x1[0] - x0[0]) / (lx - rx),
              b = (y1[0] - y0[0]) / (ly - ry),
              c = (x1[1] - x0[1]) / (lx - rx),
              d = (y1[1] - y0[1]) / (ly - ry);
            const determinant = a * d - b * c;
            if (!Number.isFinite(determinant) || Math.abs(determinant) < 1e-14) break;
            const dx = (d * (q[0] - target[0]) - b * (q[1] - target[1])) / determinant;
            const dy = (a * (q[1] - target[1]) - c * (q[0] - target[0])) / determinant;
            let improved = false;
            for (let damping = 1; damping >= 1 / 1024; damping /= 2) {
              const x = clamp(lambda - damping * dx, west, east),
                y = clamp(phi - damping * dy, south, north);
              if (inside([x, y]) && error(raw(x, y), target) < residual) {
                lambda = x;
                phi = y;
                improved = true;
                break;
              }
            }
            if (!improved) break;
          }
        }
        return null;
      };
      regions.push({
        id: `${sign > 0 ? 'north' : 'south'}-${i}`,
        boundary: [
          source([west / RAD, sign * 90]),
          source([west / RAD, 0]),
          source([east / RAD, 0])
        ],
        interior: source([center / RAD, sign * 45]),
        placement: [radius, 0, 0, radius, 0, 0],
        project: p => {
          const [lon, lat] = local(p);
          return raw(clamp(center + wrap(lon * RAD - center), west, east), lat * RAD) as Position;
        },
        unproject: p => {
          const q = invert(p);
          return q ? source([q[0] / RAD, q[1] / RAD]) : null;
        }
      });
    }
  return clipAngle
    ? new CapMap(regions, local, source, cap, radius)
    : new WorldMap(regions, !pitch);
}

class WorldMap extends DiscontinuousMap {
  constructor(
    regions: MapRegion[],
    private readonly polarLimits: boolean
  ) {
    super(regions);
  }
  override containsConvexPolygon(
    ring: readonly (readonly [number, number])[],
    id: string
  ): boolean {
    // Pole vertices may have different incoming and outgoing meridian limits.
    return !ring.some(p => Math.abs(p[1]) === 90) && super.containsConvexPolygon(ring, id);
  }
  protected override resolveSourceLimit(point: Vector, towards: Vector): Vector {
    if (
      this.polarLimits &&
      Math.hypot(point[0], point[1]) < 1e-14 &&
      Math.hypot(towards[0], towards[1]) > 1e-14
    )
      return geographic([Math.atan2(towards[1], towards[0]) / RAD, point[2] > 0 ? 90 : -90]);
    return point;
  }
}
