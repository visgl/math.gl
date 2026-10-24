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

export type QuincuncialMapOptions = {radius?: number; centralMeridian?: number};
export type BerghausMapOptions = QuincuncialMapOptions & {lobes?: number};

/** Charts around the front/back axes. Each triangle is within an open hemisphere;
 * its projection owns the one-sided limit at cuts and the antipodal vertex.
 */
function fan(
  count: number,
  start: number,
  options: QuincuncialMapOptions,
  projection: (back: boolean, theta: number) => Pick<MapRegion, 'project' | 'unproject'>
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
      regions.push({
        id: `${back ? 'back' : 'front'}-${i}`,
        boundary: [axis, [0, Math.cos(a), Math.sin(a)], [0, Math.cos(b), Math.sin(b)]].map(p =>
          rotate(coordinates(p as Vector), 1)
        ),
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
