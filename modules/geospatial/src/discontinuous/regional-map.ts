// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {CapMap} from './cap-map';
import {sphericalRotation} from './rotated-map';
import {createHammerRetroazimuthalMap} from './retroazimuthal-map';
import {armadilloRaw} from './world-kernels/armadillo.js';
import {createKernelMap} from './world-map';
import {airyRaw} from './world-kernels/airy.js';
import {craigRaw} from './world-kernels/craig.js';
import {littrowRaw} from './world-kernels/littrow.js';
import {satelliteRaw} from './world-kernels/satellite.js';
import {modifiedStereographicRaw, coefficients} from './world-kernels/modifiedStereographic.js';
import {chamberlinRaw} from './world-kernels/chamberlin.js';
import {twoPointEquidistantRaw} from './world-kernels/twoPointEquidistant.js';
import {wiechelRaw} from './world-kernels/wiechel.js';
import {geographic, coordinates, add, unit, cross, dot, angle, RAD, type Vector} from './math';
import type {WorldKernel} from './world-kernels';
export const REGIONAL_PROJECTIONS = Object.freeze([
  'hammer-retroazimuthal',
  'armadillo',
  'airy',
  'craig',
  'littrow',
  'satellite',
  'modified-stereographic-alaska',
  'modified-stereographic-gs48',
  'modified-stereographic-gs50',
  'modified-stereographic-miller',
  'modified-stereographic-lee',
  'chamberlin-africa',
  'two-point-azimuthal-usa',
  'two-point-equidistant-usa',
  'wiechel'
] as const);
export type RegionalProjection =
  | (typeof REGIONAL_PROJECTIONS)[number]
  | 'modified-stereographic'
  | 'chamberlin'
  | 'two-point-azimuthal'
  | 'two-point-equidistant';
export type RegionalMapOptions = {
  projection: RegionalProjection;
  /** Geographic cap center. Named control-point presets retain their own frame. */
  center?: readonly [number, number];
  radius?: number;
  /** Airy beta in degrees (D3's radius accessor); unrelated to output radius. */
  beta?: number;
  parallel?: number;
  distance?: number;
  tilt?: number;
  coefficients?: readonly (readonly [number, number])[];
  controlPoints?: readonly (readonly [number, number])[];
};
/** Regional formulas with spherical visibility clipping. */
export function createRegionalMap(options: RegionalMapOptions) {
  const {projection, radius = 1} = options;
  if (!Number.isFinite(radius) || radius <= 0) throw new Error('Expected positive finite radius');
  if (projection === 'hammer-retroazimuthal') {
    if (
      Object.keys(options).some(key => !['projection', 'radius', 'type', 'parallel'].includes(key))
    )
      throw new Error('Unsupported Hammer retroazimuthal option');
    return createHammerRetroazimuthalMap({radius, parallel: options.parallel});
  }
  if (projection === 'armadillo') {
    if (
      Object.keys(options).some(key => !['projection', 'radius', 'type', 'parallel'].includes(key))
    )
      throw new Error('Unsupported Armadillo option');
    const parallel = options.parallel ?? 20;
    if (!Number.isFinite(parallel) || parallel <= 0 || parallel >= 90)
      throw new Error('Armadillo parallel must be between 0 and 90');
    const rotation = sphericalRotation([0, -parallel]);
    const base = createKernelMap({kernel: armadilloRaw(parallel * RAD), radius});
    return new CapMap(
      [...base.regions],
      p => rotation.local([(((((p[0] + 180) % 360) + 360) % 360) - 180) / 2, p[1]]),
      p => {
        const q = rotation.source(p);
        return Math.abs(q[0]) > 90 + 1e-7
          ? [Math.sign(q[0]) * 180, 0]
          : [Math.max(-90, Math.min(90, q[0])) * 2, q[1]];
      },
      Math.PI / 2,
      radius,
      true,
      true
    );
  }
  const allowed: Record<string, string[]> = {
    airy: ['beta', 'center'],
    craig: ['parallel', 'center'],
    littrow: ['center'],
    satellite: ['distance', 'tilt', 'center'],
    'modified-stereographic': ['coefficients', 'center'],
    chamberlin: ['controlPoints'],
    'two-point-azimuthal': ['controlPoints'],
    'two-point-equidistant': ['controlPoints']
  };
  for (const key of Object.keys(options))
    if (!['projection', 'radius', 'type'].includes(key) && !allowed[projection]?.includes(key))
      throw new Error(`Unsupported ${projection} option: ${key}`);
  const value = (
    key: 'beta' | 'parallel' | 'distance' | 'tilt',
    fallback: number,
    low: number,
    high: number
  ) => {
    const n = options[key] ?? fallback;
    if (!Number.isFinite(n) || n <= low || n >= high)
      throw new Error(`Invalid ${projection} ${key}`);
    return n;
  };
  let kernel: WorldKernel,
    clipAngle = 90,
    aspect: [number, number, number?] = [0, 0],
    frame: [Vector, Vector, Vector] | undefined;
  if (options.center) {
    geographic(options.center);
    aspect = [-options.center[0], -options.center[1]];
  }
  if (projection === 'airy') {
    kernel = airyRaw(value('beta', 90, 0, 180) * RAD);
    clipAngle = 147;
  } else if (projection === 'craig') kernel = craigRaw(value('parallel', 0, -90, 90) * RAD);
  else if (projection === 'littrow') {
    kernel = littrowRaw;
    clipAngle = 89.999;
  } else if (projection === 'satellite') {
    const distance = value('distance', 2, 1, Infinity),
      tilt = value('tilt', 0, -90, 90) * RAD;
    // A tilted perspective must not put the horizon on the camera plane.
    const horizon = Math.acos(1 / distance);
    if (Math.abs(tilt) >= Math.PI / 2 - horizon)
      throw new Error('Satellite tilt crosses the horizon');
    kernel = satelliteRaw(distance, tilt);
    clipAngle = horizon / RAD - 1e-6;
  } else if (projection.startsWith('modified-stereographic')) {
    const key = projection.slice('modified-stereographic-'.length) as keyof typeof coefficients;
    const presets = {
      alaska: {center: [-152, 64], clip: 30},
      gs48: {center: [-95, 38], clip: 55},
      gs50: {center: [-120, 45], clip: 55},
      miller: {center: [20, 18], clip: 82},
      lee: {center: [-165, -10], clip: 130}
    };
    const preset = presets[key];
    const c = projection === 'modified-stereographic' ? options.coefficients : coefficients[key];
    if (!c?.length || c.length > 32 || !c.every(p => p.length === 2 && p.every(Number.isFinite)))
      throw new Error('Expected finite complex coefficients');
    if (preset) {
      aspect = [-preset.center[0], -preset.center[1]];
      clipAngle = preset.clip;
    }
    kernel = modifiedStereographicRaw(c.map(p => [...p]));
  } else if (projection === 'chamberlin' || projection === 'chamberlin-africa') {
    const points =
      projection === 'chamberlin-africa'
        ? [
            [0, 22],
            [45, 22],
            [22.5, -22]
          ]
        : options.controlPoints;
    if (points?.length !== 3) throw new Error('Chamberlin requires three control points');
    const v = points.map(geographic),
      c = unit(add(add(v[0], v[1]), v[2]));
    const origin = coordinates(c),
      east: Vector = [-Math.sin(origin[0] * RAD), Math.cos(origin[0] * RAD), 0];
    frame = [c, east, cross(c, east)];
    if (Math.abs(dot(cross(v[0], v[1]), v[2])) < 1e-8)
      throw new Error('Degenerate Chamberlin control points');
    const p = v.map(v =>
      coordinates([dot(v, frame![0]), dot(v, frame![1]), dot(v, frame![2])]).map(n => n * RAD)
    );
    kernel = chamberlinRaw(p[0], p[1], p[2]);
  } else if (projection.startsWith('two-point-')) {
    if (
      ![
        'two-point-azimuthal',
        'two-point-equidistant',
        'two-point-azimuthal-usa',
        'two-point-equidistant-usa'
      ].includes(projection)
    )
      throw new Error('Unknown regional projection');
    const usa = projection.endsWith('-usa'),
      points = usa
        ? [
            [-158, 21.5],
            [-77, 39]
          ]
        : options.controlPoints;
    if (points?.length !== 2) throw new Error('Two-point projection requires two control points');
    const [a, b] = points.map(geographic),
      distance = angle(a, b);
    if (distance < 1e-8 || Math.PI - distance < 1e-8)
      throw new Error('Distinct non-antipodal control points required');
    const c = unit(add(a, b)),
      east = unit([b[0] - a[0], b[1] - a[1], b[2] - a[2]]);
    frame = [c, east, cross(c, east)];
    const azimuthal = projection.includes('azimuthal');
    if (azimuthal) {
      const factor = Math.cos(distance / 2);
      kernel = (lambda, phi) => [Math.tan(lambda) * factor, Math.tan(phi) / Math.cos(lambda)];
      kernel.invert = (x, y) => {
        const lambda = Math.atan(x / factor);
        return [lambda, Math.atan(y * Math.cos(lambda))];
      };
      clipAngle = usa ? 60 : 89.999;
    } else {
      kernel = twoPointEquidistantRaw(distance / 2);
      clipAngle = usa ? 130 : 90;
    }
  } else if (projection === 'wiechel') {
    kernel = wiechelRaw;
    aspect = [0, -90, 45];
    clipAngle = 179.999;
  } else throw new Error('Unknown regional projection');
  return createKernelMap({kernel, radius, aspect, frame, clipAngle});
}
