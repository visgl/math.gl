// math.gl
// SPDX-License-Identifier: MIT AND ISC
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileCopyrightText: Copyright 2013-2021 Mike Bostock
// SPDX-FileComment: Quincuncial arrangement and Berghaus formula adapted from d3-geo-projection 4.0.0; see D3-LICENSE.txt. Original math.gl chart and boundary handling.

import {DiscontinuousMap, type MapRegion} from './map-layout';
import {coordinates, geographic, RAD, type Position, type Vector} from './math';
import {guyouRaw} from './quincuncial-kernel';
import {gringortenRaw} from './gringorten-kernel';

const PI = Math.PI;
const HALF_PI = PI / 2;
const clamp = (x: number) => Math.max(-1, Math.min(1, x));
const wrap = (x: number) => ((((x + PI) % (2 * PI)) + 2 * PI) % (2 * PI)) - PI;

export type QuincuncialMapOptions = {
  radius?: number;
  centralMeridian?: number;
};
export type BerghausMapOptions = QuincuncialMapOptions & {lobes?: number};
export type GingeryMapOptions = BerghausMapOptions & {coreAngle?: number};

/** Charts around the front/back axes. Each triangle is within an open hemisphere;
 * its projection owns the one-sided limit at cuts and the antipodal vertex.
 */
function fan(
  count: number,
  start: number,
  options: QuincuncialMapOptions,
  projection: (back: boolean, theta: number) => Pick<MapRegion, 'project' | 'unproject'>,
  seamStart?: number
) {
  const radius = options.radius ?? 1;
  const longitude = options.centralMeridian ?? 0;
  if (!Number.isFinite(radius) || radius <= 0 || !Number.isFinite(longitude))
    throw new Error('Expected a positive finite radius and finite centralMeridian');
  const offset = wrap(longitude * RAD);
  const rotate = ([lon, lat]: Position, direction: number): Position => [
    wrap(lon * RAD + offset * direction) / RAD,
    lat
  ];
  const regions: MapRegion[] = [];
  for (const back of [false, true]) {
    for (let i = 0; i < count; i++) {
      const a = start + (i * 2 * PI) / count;
      const b = start + ((i + 1) * 2 * PI) / count;
      const theta = (a + b) / 2;
      const axis: Vector = [back ? -1 : 1, 0, 0];
      const kernel = projection(back, theta);
      const boundary: Vector[] = [
        axis,
        [0, Math.cos(a), Math.sin(a)],
        [0, Math.cos(b), Math.sin(b)]
      ];
      if (!back && seamStart !== undefined) {
        const point = (angle: number): Vector => [
          Math.cos(seamStart),
          Math.sin(seamStart) * Math.cos(angle),
          Math.sin(seamStart) * Math.sin(angle)
        ];
        boundary.splice(1, 0, point(a));
        boundary.push(point(b));
      }
      regions.push({
        id: `${back ? 'back' : 'front'}-${i}`,
        boundary: boundary.map(p => rotate(coordinates(p), 1)),
        interior: rotate(coordinates([axis[0], Math.cos(theta), Math.sin(theta)]), 1),
        placement: [radius, 0, 0, radius, 0, 0],
        project: p => kernel.project(rotate([...p], -1)),
        unproject: p => {
          const source = kernel.unproject(p);
          return source && source.every(Number.isFinite) ? rotate(source, 1) : null;
        }
      });
    }
  }
  return new DiscontinuousMap(regions);
}

/** Peirce quincuncial: central hemisphere and four corner half-squares.
 * Equatorial aspect centered on centralMeridian, latitude zero; not D3's default rotation.
 */
export function createPeirceQuincuncialMap(options: QuincuncialMapOptions = {}) {
  return squareMap(options, guyouRaw);
}

/** Equal-area Gringorten quincuncial, in equatorial aspect. */
export function createGringortenQuincuncialMap(options: QuincuncialMapOptions = {}) {
  return squareMap(options, gringortenRaw);
}

/** Conformal Guyou: two joined hemisphere squares centered at ±90° longitude. */
export function createGuyouMap(options: QuincuncialMapOptions = {}) {
  return squareMap(
    {...options, centralMeridian: (options.centralMeridian ?? 0) + 90},
    guyouRaw,
    true
  );
}

type SquareKernel = ((lambda: number, phi: number) => number[]) & {
  invert: (x: number, y: number) => number[];
};
function squareMap(options: QuincuncialMapOptions, raw: SquareKernel, rectangular = false) {
  const halfSide = raw(HALF_PI, 0)[0];
  const distance = 2 * halfSide * Math.SQRT1_2;
  return fan(4, PI / 4, options, (back, theta) => {
    const sx = Math.sign(Math.cos(theta) - Math.sin(theta));
    const sy = Math.sign(Math.cos(theta) + Math.sin(theta));
    const s = sx === sy ? 1 : -1;
    return {
      project: ([lon, lat]) => {
        let lambda = lon * RAD;
        if (back) lambda = wrap(lambda - PI);
        // Region clipping owns this hemisphere. Rotation roundoff must not
        // select the other complex branch just beyond its ±90° boundary.
        lambda = Math.max(-HALF_PI, Math.min(HALF_PI, lambda));
        // The four branch points lie at hemisphere corners. Their finite limit
        // is known exactly; the elliptic formula otherwise encounters 0 * Infinity.
        const phi = lat * RAD;
        const p =
          Math.abs(Math.abs(lambda) - HALF_PI) < 1e-12 && Math.abs(Math.abs(phi) - PI / 4) < 1e-12
            ? [Math.sign(lambda) * halfSide, Math.sign(phi) * halfSide]
            : Math.abs(Math.abs(phi) - HALF_PI) < 1e-12
              ? [0, Math.sign(phi) * halfSide]
              : Math.abs(Math.abs(lambda) - HALF_PI) < 1e-12 && Math.abs(phi) < 1e-12
                ? [Math.sign(lambda) * halfSide, 0]
                : raw(lambda, phi);
        if (rectangular) return [p[0] + (back ? -halfSide : halfSide), p[1]];
        const x = (p[0] - p[1]) * Math.SQRT1_2;
        const y = (p[0] + p[1]) * Math.SQRT1_2;
        // Back longitude reverses the local horizontal axis. This chart owns
        // one corner even when the geographic input is exactly on its cut.
        return back ? [s * x + sx * distance, s * y + sy * distance] : [x, y];
      },
      unproject: ([x0, y0]) => {
        let x = x0,
          y = y0;
        if (back && !rectangular) {
          x = (x - sx * distance) / s;
          y = (y - sy * distance) / s;
        }
        const u = rectangular ? x - (back ? -halfSide : halfSide) : (x + y) * Math.SQRT1_2,
          v = rectangular ? y : (y - x) * Math.SQRT1_2;
        if (Math.abs(u) > halfSide + 1e-9 || Math.abs(v) > halfSide + 1e-9) return null;
        if (Math.abs(Math.abs(u) - halfSide) < 1e-12 && Math.abs(Math.abs(v) - halfSide) < 1e-12)
          return [wrap(Math.sign(u) * HALF_PI + (back ? PI : 0)) / RAD, Math.sign(v) * 45];
        // The square perimeter is the hemisphere boundary. The complex
        // elliptic inverse is ill-conditioned there; solve its monotone
        // one-dimensional forward limit instead of choosing a complex branch.
        const vertical = Math.abs(Math.abs(u) - halfSide) < 1e-12;
        const horizontal = Math.abs(Math.abs(v) - halfSide) < 1e-12;
        if (vertical || horizontal) {
          let low = vertical ? 0 : PI / 4;
          let high = vertical ? PI / 4 : HALF_PI;
          for (let i = 0; i < 55; i++) {
            const phi = (low + high) / 2;
            const q = raw(HALF_PI, phi);
            if (vertical ? q[1] < Math.abs(v) : q[0] > Math.abs(u)) low = phi;
            else high = phi;
          }
          return [
            wrap(Math.sign(u) * HALF_PI + (back ? PI : 0)) / RAD,
            (Math.sign(v) * (low + high)) / (2 * RAD)
          ];
        }
        // Forward Guyou is odd in each coordinate. Invert the first quadrant
        // and reflect explicitly: the elliptic inverse can select another
        // boundary branch when its complex cosine approaches zero.
        const p = raw.invert(Math.abs(u), Math.abs(v));
        return [wrap(Math.sign(u) * p[0] + (back ? PI : 0)) / RAD, (Math.sign(v) * p[1]) / RAD];
      }
    };
  });
}

/** Berghaus star: azimuthal-equidistant front hemisphere and interrupted back lobes.
 * Formula follows Berghaus as documented by d3-geo-projection (ISC).
 */
export function createBerghausMap(options: BerghausMapOptions = {}) {
  const lobes = options.lobes ?? 5;
  if (!Number.isInteger(lobes) || lobes < 3 || lobes > 24)
    throw new Error('Berghaus lobes must be an integer from 3 to 24');
  const half = PI / lobes;
  const bend = (r: number, delta: number) => {
    const alpha = Math.atan2(Math.sin(delta), 2 - Math.cos(delta));
    return Math.asin(clamp((PI / r) * Math.sin(alpha))) - alpha;
  };
  return fan(lobes, HALF_PI - half, options, (back, theta) => ({
    project: position => {
      const [x, y, z] = geographic(position);
      const r = Math.acos(clamp(x));
      let angle = Math.atan2(z, y);
      if (back) angle = theta + bend(r, wrap(angle - theta));
      if (r > PI - 1e-12) angle = theta;
      return [r * Math.cos(angle), r * Math.sin(angle)];
    },
    unproject: ([x, y]) => {
      const r = Math.hypot(x, y);
      if (r > PI + 1e-10 || (back ? r < HALF_PI - 1e-10 : r > HALF_PI + 1e-10)) return null;
      let angle = Math.atan2(y, x);
      if (back) {
        if (r > PI - 1e-10) return [180, 0];
        const beta = wrap(angle - theta);
        if (Math.abs(beta) > bend(r, half) + 1e-10) return null;
        let low = -half,
          high = half;
        for (let i = 0; i < 55; i++) {
          const delta = (low + high) / 2;
          if (bend(r, delta) < beta) low = delta;
          else high = delta;
        }
        angle = theta + (low + high) / 2;
      }
      return coordinates([
        Math.cos(r),
        Math.sin(r) * Math.cos(angle),
        Math.sin(r) * Math.sin(angle)
      ]);
    }
  }));
}

/** Gingery star, equatorial aspect. coreAngle is the uncut central cap in degrees.
 * Arc-length construction adapted from d3-geo-projection 4.0.0 gingery.js (ISC).
 * Chart-owned lobe selection and bracketed inverses are math.gl additions.
 */
export function createGingeryMap(options: GingeryMapOptions = {}) {
  const lobes = options.lobes ?? 6;
  const coreAngle = options.coreAngle ?? 30;
  if (!Number.isInteger(lobes) || lobes < 3 || lobes > 24)
    throw new Error('Gingery lobes must be an integer from 3 to 24');
  if (!Number.isFinite(coreAngle) || coreAngle <= 0 || coreAngle >= 90)
    throw new Error('Gingery coreAngle must be greater than 0 and less than 90 degrees');
  const rho = coreAngle * RAD;
  const half = PI / lobes;
  // Match the published D3 quadrature; all solves are bounded. The integration
  // interval and angle are local to one lobe, including at its one-sided edges.
  const shape = (alpha: number) => {
    const start = rho * Math.cos(alpha);
    const k = (rho * Math.sin(alpha) - alpha * Math.sin(start)) / (HALF_PI - start);
    const height = (x: number) => alpha * Math.sin(x) - (x < HALF_PI ? k * (x - HALF_PI) : 0);
    const speed = (x: number) => Math.hypot(1, alpha * Math.cos(x) - (x < HALF_PI ? k : 0));
    const integral = (end: number) => {
      const step = (end - start) / 50;
      let sum = speed(start) + speed(end);
      for (let i = 1; i < 50; i++) sum += 2 * speed(start + i * step);
      return (sum * step) / 2;
    };
    return {start, height, speed, integral};
  };
  return fan(
    lobes,
    -half,
    options,
    (_back, theta) => ({
      project: position => {
        const [vx, vy, vz] = geographic(position);
        const r = Math.acos(clamp(vx));
        const angle = Math.atan2(vz, vy);
        if (r <= rho) return [r * Math.cos(angle), r * Math.sin(angle)];
        if (r >= PI - 1e-12) return [PI * Math.cos(theta), PI * Math.sin(theta)];
        const alpha = Math.max(-half, Math.min(half, wrap(angle - theta)));
        const curve = shape(alpha);
        const factor = (PI - rho) / curve.integral(PI);
        let low = curve.start,
          high = PI,
          x = r;
        for (let i = 0; i < 30; i++) {
          const error = rho + curve.integral(x) * factor - r;
          if (Math.abs(error) < 1e-12) break;
          if (error < 0) low = x;
          else high = x;
          const next = x - error / (curve.speed(x) * factor);
          x = next > low && next < high ? next : (low + high) / 2;
        }
        const y = curve.height(x);
        return [
          x * Math.cos(theta) - y * Math.sin(theta),
          x * Math.sin(theta) + y * Math.cos(theta)
        ];
      },
      unproject: ([px, py]) => {
        let r = Math.hypot(px, py),
          angle = Math.atan2(py, px);
        if (r > rho + 1e-12) {
          const x = px * Math.cos(theta) + py * Math.sin(theta);
          const y = -px * Math.sin(theta) + py * Math.cos(theta);
          if (x > PI + 1e-10 || x < rho * Math.cos(half) - 1e-10) return null;
          if (x >= PI - 1e-12) return Math.abs(y) < 1e-10 ? [180, 0] : null;
          if (Math.abs(y) > shape(half).height(x) + 1e-10) return null;
          let low = -half,
            high = half;
          for (let i = 0; i < 45; i++) {
            const alpha = (low + high) / 2;
            if (shape(alpha).height(x) < y) low = alpha;
            else high = alpha;
          }
          const alpha = (low + high) / 2;
          const curve = shape(alpha);
          r = rho + (curve.integral(x) * (PI - rho)) / curve.integral(PI);
          if (r < rho - 1e-9 || r > PI + 1e-9) return null;
          angle = theta + alpha;
        }
        return coordinates([
          Math.cos(r),
          Math.sin(r) * Math.cos(angle),
          Math.sin(r) * Math.sin(angle)
        ]);
      }
    }),
    rho
  );
}
