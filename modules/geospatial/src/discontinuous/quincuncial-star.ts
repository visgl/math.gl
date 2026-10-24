// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {DiscontinuousMap, type MapRegion} from './map-layout';
import {coordinates, geographic, RAD, type Position, type Vector} from './math';
import {guyouRaw} from './quincuncial-kernel';

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
  const halfSide = guyouRaw(HALF_PI, 0)[0];
  const distance = 2 * halfSide * Math.SQRT1_2;
  return fan(4, PI / 4, options, (back, theta) => {
    const sx = Math.sign(Math.cos(theta) - Math.sin(theta));
    const sy = Math.sign(Math.cos(theta) + Math.sin(theta));
    const s = sx === sy ? 1 : -1;
    return {
      project: ([lon, lat]) => {
        let lambda = lon * RAD;
        if (back) lambda = wrap(lambda - PI);
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
                : guyouRaw(lambda, phi);
        const x = (p[0] - p[1]) * Math.SQRT1_2;
        const y = (p[0] + p[1]) * Math.SQRT1_2;
        // Back longitude reverses the local horizontal axis. This chart owns
        // one corner even when the geographic input is exactly on its cut.
        return back ? [s * x + sx * distance, s * y + sy * distance] : [x, y];
      },
      unproject: ([x0, y0]) => {
        let x = x0,
          y = y0;
        if (back) {
          x = (x - sx * distance) / s;
          y = (y - sy * distance) / s;
        }
        const u = (x + y) * Math.SQRT1_2,
          v = (y - x) * Math.SQRT1_2;
        if (Math.abs(u) > halfSide + 1e-9 || Math.abs(v) > halfSide + 1e-9) return null;
        if (Math.abs(Math.abs(u) - halfSide) < 1e-12 && Math.abs(Math.abs(v) - halfSide) < 1e-12)
          return [wrap(Math.sign(u) * HALF_PI + (back ? PI : 0)) / RAD, Math.sign(v) * 45];
        const p = guyouRaw.invert(u, v);
        return [wrap(p[0] + (back ? PI : 0)) / RAD, p[1] / RAD];
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
