// math.gl
// SPDX-License-Identifier: MIT AND ISC
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileCopyrightText: Copyright 2013-2021 Mike Bostock
// SPDX-FileComment: Interrupted formulas and land/hemisphere lobe tables follow d3-geo-projection 4.0.0 (D3-LICENSE.txt); ocean Goode lobes follow PROJ igh_o documentation. Original math.gl chart assembly and bounded inverse.

import {DiscontinuousMap, type MapRegion, type MapPlacement} from './map-layout';
import {grayFullerForward, grayFullerInverse} from './gray-fuller';
import {airOceanMesh} from './air-ocean-mesh';
import {
  add,
  coordinates,
  cross,
  dot,
  geographic,
  RAD,
  scale,
  unit,
  type Position,
  type Vector
} from './math';
const subtract = (a: Vector, b: Vector) => add(a, scale(b, -1));

/** 24-panel AirOcean cut arrangement with radial/gnomonic face mapping.
 * This is NOT the Gray-Fuller projection. Output units scale with radius.
 */
export function createAirOceanMap(options: {radius?: number} = {}): DiscontinuousMap {
  return airOceanMap(options, false);
}

/** Exact Gray–Fuller face transform on the 24-panel AirOcean net. */
export function createGrayFullerMap(options: {radius?: number} = {}): DiscontinuousMap {
  return airOceanMap(options, true);
}

function airOceanMap(options: {radius?: number}, fuller: boolean) {
  const radius = validRadius(options.radius);
  const {
    mesh: {vertices, faces},
    joins
  } = airOceanMesh();
  // Split panels retain the original icosahedron face frame.
  const original = faces.slice(0, 20).map(face => [...face]);
  original[14] = [11, 2, 10];
  original[15] = [1, 2, 4];
  original[19] = [1, 10, 2];
  const parentFaces = [...Array.from({length: 20}, (_, i) => i), 15, 15, 14, 19];
  const charts = faces.map((panel, i) => {
    const face = fuller ? original[parentFaces[i]] : panel;
    const origin = vertices[face[0]],
      x = unit(subtract(vertices[face[1]], origin));
    const normal = unit(cross(x, subtract(vertices[face[2]], origin))),
      y = cross(normal, x);
    const height = dot(normal, origin);
    const plane = (p: Vector): Position => [
      dot(subtract(p, origin), x),
      dot(subtract(p, origin), y)
    ];
    if (!fuller)
      return {
        origin,
        x,
        y,
        normal,
        height,
        plane,
        project: (p: Vector) => plane(scale(p, height / dot(normal, p))),
        inverse: ([u, v]: Position) => unit(add(origin, add(scale(x, u), scale(y, v))))
      };
    const center = unit(face.map(v => vertices[v]).reduce(add, [0, 0, 0]));
    const up = unit(subtract(vertices[face[0]], scale(center, dot(center, vertices[face[0]]))));
    const right = cross(up, center);
    const project = (p: Vector) =>
      grayFullerForward(dot(right, p) / dot(center, p), dot(up, p) / dot(center, p));
    return {
      origin,
      x,
      y,
      normal,
      height,
      plane: project,
      project,
      inverse: ([u, v]: Position) => {
        const q = grayFullerInverse(u, v);
        return q ? unit(add(center, add(scale(right, q[0]), scale(up, q[1])))) : null;
      }
    };
  });
  const placements: MapPlacement[] = [];
  placements[0] = [radius, 0, 0, radius, 0, 0];
  const place = (i: number, p: Position): Position => {
    const [a, b, c, d, tx, ty] = placements[i];
    return [a * p[0] + c * p[1] + tx, b * p[0] + d * p[1] + ty];
  };
  // Solve each rigid 2D placement from its shared edge. No animated state is needed.
  const pending = [...joins];
  while (pending.length) {
    const index = pending.findIndex(([parent]) => placements[parent]);
    if (index < 0) throw new Error('Invalid AirOcean placement tree');
    const [parent, child] = pending.splice(index, 1)[0];
    const shared = faces[child].filter(v => faces[parent].includes(v));
    if (shared.length !== 2) throw new Error('Invalid AirOcean join');
    const p = charts[child].plane(vertices[shared[0]]),
      q = charts[child].plane(vertices[shared[1]]);
    const u = place(parent, charts[parent].plane(vertices[shared[0]])),
      v = place(parent, charts[parent].plane(vertices[shared[1]]));
    const dx = q[0] - p[0],
      dy = q[1] - p[1],
      length = dx * dx + dy * dy;
    const a = ((v[0] - u[0]) * dx + (v[1] - u[1]) * dy) / length;
    const b = ((v[1] - u[1]) * dx - (v[0] - u[0]) * dy) / length;
    placements[child] = [a, b, -b, a, u[0] - a * p[0] + b * p[1], u[1] - b * p[0] - a * p[1]];
  }
  return new DiscontinuousMap(
    faces.map((face, i): MapRegion => {
      const chart = charts[i];
      return {
        id: `face-${i}`,
        boundary: face.map(v => coordinates(vertices[v])),
        interior: coordinates(unit(face.map(v => vertices[v]).reduce(add, [0, 0, 0]))),
        placement: placements[i],
        project: position => chart.project(geographic(position)),
        unproject: position => {
          const p = chart.inverse([...position]);
          return p && coordinates(p);
        }
      };
    })
  );
}

/** Independent six-lobe sinusoidal layout. Coordinates are spherical radians
 * times radius, not an ellipsoidal CRS. Equatorial joins remain continuous.
 */
export function createInterruptedSinusoidalMap(options: {radius?: number} = {}): DiscontinuousMap {
  return interruptedMap('sinusoidal', options.radius);
}

/** Six-lobe Mollweide map using the same independent cuts as the sinusoidal preset. */
export function createInterruptedMollweideMap(options: {radius?: number} = {}): DiscontinuousMap {
  return interruptedMap('mollweide', options.radius);
}

/** Goode homolosine formula with independent six-lobe cuts (not PROJ's IGH layout). */
export function createInterruptedHomolosineMap(options: {radius?: number} = {}): DiscontinuousMap {
  return interruptedMap('homolosine', options.radius);
}

/** Goode's land-oriented homolosine interruption (two northern, four southern lobes). */
export function createGoodeMap(options: {radius?: number} = {}): DiscontinuousMap {
  return interruptedMap('homolosine', options.radius, true);
}

/** Boggs eumorphic with land-oriented equatorial interruptions. */
export function createInterruptedBoggsMap(options: {radius?: number} = {}) {
  return interruptedMap('boggs', options.radius, true);
}
/** Sinu-Mollweide formula with independent equatorial six-lobe cuts. */
export function createInterruptedSinuMollweideMap(options: {radius?: number} = {}) {
  return interruptedMap('sinu-mollweide', options.radius, true);
}
/** Quartic authalic with paired hemispheric lobes. */
export function createInterruptedQuarticAuthalicMap(options: {radius?: number} = {}) {
  return interruptedMap('quartic-authalic', options.radius, false, 'hemispheres', -20);
}
/** Two Mollweide hemispheres, with a -20° central meridian. */
export function createInterruptedMollweideHemispheresMap(options: {radius?: number} = {}) {
  return interruptedMap('mollweide', options.radius, false, 'hemispheres', -20);
}
/** Ocean-oriented Goode, centered at -160°; no duplicate extension lobes. */
export function createGoodeOceanMap(options: {radius?: number} = {}) {
  return interruptedMap('homolosine', options.radius, false, 'ocean', -160);
}

function interruptedMap(
  kind: InterruptedProjection,
  value?: number,
  goode = false,
  layout: 'default' | 'ocean' | 'hemispheres' = 'default',
  centralMeridian = 0,
  customLobes?: InterruptedMapOptions['lobes']
): DiscontinuousMap {
  const radius = validRadius(value);
  const mollweide = (latitude: number): Position => {
    // Bisection stays bounded at the poles where Newton's derivative vanishes.
    let low = -Math.PI / 2,
      high = Math.PI / 2;
    const target = Math.PI * Math.sin(latitude);
    for (let i = 0; i < 55; i++) {
      const theta = (low + high) / 2;
      if (2 * theta + Math.sin(2 * theta) < target) low = theta;
      else high = theta;
    }
    const theta =
      Math.abs(latitude) >= Math.PI / 2 ? (Math.sign(latitude) * Math.PI) / 2 : (low + high) / 2;
    return [((2 * Math.SQRT2) / Math.PI) * Math.cos(theta), Math.SQRT2 * Math.sin(theta)];
  };
  // Solve the nonzero intersection of the two horizontal scale factors.
  let low = 0.5,
    high = 1;
  for (let i = 0; i < 50; i++) {
    const latitude = (low + high) / 2;
    if (mollweide(latitude)[0] < Math.cos(latitude)) low = latitude;
    else high = latitude;
  }
  const transition = (low + high) / 2;
  const correction = mollweide(transition)[1] - transition;
  const profile = (latitude: number): Position => {
    if (kind === 'sinusoidal' || (kind === 'homolosine' && Math.abs(latitude) <= transition))
      return [Math.cos(latitude), latitude];
    if (kind === 'quartic-authalic')
      return [Math.cos(latitude) / Math.cos(latitude / 2), 2 * Math.sin(latitude / 2)];
    const [width, height] = mollweide(latitude);
    if (kind === 'boggs')
      return [
        2.00276 / (1 / Math.cos(latitude) + 1.11072 / ((width * Math.PI) / (2 * Math.SQRT2))),
        (latitude + height) / 2.00276
      ];
    if (kind === 'sinu-mollweide')
      return latitude > -transition ? [width, height + correction] : [Math.cos(latitude), latitude];
    return [width, height - (kind === 'homolosine' ? Math.sign(latitude) * correction : 0)];
  };
  const equatorialScale = profile(0)[0];
  const minHeight = profile(-Math.PI / 2)[1],
    maxHeight = profile(Math.PI / 2)[1];
  const asinClamped = (x: number) => Math.asin(Math.max(-1, Math.min(1, x)));
  const inverseProfile = (height: number): Position => {
    if (
      kind === 'sinusoidal' ||
      (kind === 'homolosine' && Math.abs(height) <= transition) ||
      (kind === 'sinu-mollweide' && height <= -transition)
    )
      return [height, Math.cos(height)];
    if (kind === 'quartic-authalic') {
      const latitude = 2 * asinClamped(height / 2);
      return [latitude, Math.cos(latitude) / Math.cos(latitude / 2)];
    }
    if (kind !== 'boggs') {
      const mollHeight =
        kind === 'homolosine'
          ? height + Math.sign(height) * correction
          : kind === 'sinu-mollweide'
            ? height - correction
            : height;
      const theta = asinClamped(mollHeight / Math.SQRT2);
      return [
        asinClamped((2 * theta + Math.sin(2 * theta)) / Math.PI),
        ((2 * Math.SQRT2) / Math.PI) * Math.cos(theta)
      ];
    }
    // Boggs combines latitude with Mollweide height and needs a bounded inverse solve.
    let low = -Math.PI / 2,
      high = Math.PI / 2;
    for (let i = 0; i < 55; i++) {
      const mid = (low + high) / 2;
      if (profile(mid)[1] < height) low = mid;
      else high = mid;
    }
    const latitude = (low + high) / 2;
    return [latitude, profile(latitude)[0]];
  };
  // Split the wide Eurasian lobe into two convex computational charts sharing
  // one projection. The extra meridian is a continuous join, not a map cut.
  const lobes = customLobes
    ? [customLobes.north, customLobes.south].map(hemisphere =>
        hemisphere.flatMap(([west, center, east]) => {
          const count = Math.ceil((east - west) / 90);
          return Array.from({length: count}, (_, i) => [
            west + ((east - west) * i) / count,
            center,
            west + ((east - west) * (i + 1)) / count
          ]);
        })
      )
    : layout === 'ocean'
      ? [
          [
            [-180, -140, -90],
            [-90, -10, 60],
            [60, 130, 180]
          ],
          [
            [-180, -110, -60],
            [-60, 20, 90],
            [90, 150, 180]
          ]
        ]
      : layout === 'hemispheres'
        ? [0, 1].map(() => [
            [-180, -90, -90],
            [-90, -90, 0],
            [0, 90, 90],
            [90, 90, 180]
          ])
        : goode
          ? [
              [
                [-180, -100, -40],
                [-40, 30, 30],
                [30, 30, 180]
              ],
              [
                [-180, -160, -100],
                [-100, -60, -20],
                [-20, 20, 80],
                [80, 140, 180]
              ]
            ]
          : [
              [-180, -60, 60, 180],
              [-180, -100, 20, 180]
            ].map(limits =>
              limits.slice(1).map((east, i) => [limits[i], (limits[i] + east) / 2, east])
            );
  const equator = [...new Set(lobes.flat().flatMap(([west, , east]) => [west, east]))].sort(
    (a, b) => a - b
  );
  const regions: MapRegion[] = [];
  lobes.forEach((limits, hemisphere) => {
    const sign = hemisphere === 0 ? 1 : -1;
    for (let i = 0; i < limits.length; i++) {
      const [west, center, east] = limits[i];
      const boundary: Position[] = [
        [west, 90 * sign],
        ...equator.filter(lon => lon >= west && lon <= east).map(lon => [lon, 0] as Position)
      ];
      regions.push({
        id: `${sign > 0 ? 'north' : 'south'}-${i}`,
        boundary: boundary.map(([lon, lat]) => [lon + centralMeridian, lat]),
        interior: [(west + east) / 2 + centralMeridian, 45 * sign],
        project: ([lon, lat]) => {
          let delta = ((((lon - centralMeridian - center + 180) % 360) + 360) % 360) - 180;
          if (customLobes) {
            // A wide lobe can own either copy of the antimeridian. The chart,
            // rather than longitude normalization, chooses the one-sided limit.
            if (delta + center < west - 1e-8) delta += 360;
            if (delta + center > east + 1e-8) delta -= 360;
          }
          const [width, height] = profile(lat * RAD);
          return [radius * (equatorialScale * center * RAD + delta * RAD * width), radius * height];
        },
        unproject: ([x, y]) => {
          const height = y / radius;
          if (height > maxHeight + 1e-10 || height < minHeight - 1e-10) return null;
          const [latitude, width] = inverseProfile(height);
          const relativeX = x / radius - equatorialScale * center * RAD;
          if (Math.abs(width) < 1e-12)
            return Math.abs(relativeX) < 1e-10 ? [center + centralMeridian, sign * 90] : null;
          const delta = relativeX / width / RAD;
          if (Math.abs(delta) > 180 + 1e-8) return null;
          return [center + delta + centralMeridian, latitude / RAD];
        }
      });
    }
  });
  return new DiscontinuousMap(regions);
}

export type InterruptedProjection =
  | 'sinusoidal'
  | 'mollweide'
  | 'homolosine'
  | 'boggs'
  | 'sinu-mollweide'
  | 'quartic-authalic';
/** Longitudes relative to centralMeridian, in degrees: [west, center, east]. */
export type InterruptedLobe = readonly [number, number, number];
export type InterruptedMapOptions = {
  radius?: number;
  centralMeridian?: number;
  projection: InterruptedProjection;
  lobes: {
    north: readonly InterruptedLobe[];
    south: readonly InterruptedLobe[];
  };
};

/** Configurable equatorial interruptions. Each hemisphere must tile [-180, 180]
 * in west-to-east order. Wide lobes are split into joined computational charts.
 */
export function createInterruptedMap(options: InterruptedMapOptions): DiscontinuousMap {
  if (
    ![
      'sinusoidal',
      'mollweide',
      'homolosine',
      'boggs',
      'sinu-mollweide',
      'quartic-authalic'
    ].includes(options.projection)
  )
    throw new Error('Unknown interrupted projection');
  const centralMeridian = options.centralMeridian ?? 0;
  if (!Number.isFinite(centralMeridian)) throw new Error('Expected finite centralMeridian');
  for (const hemisphere of [options.lobes?.north, options.lobes?.south]) {
    if (!Array.isArray(hemisphere) || !hemisphere.length)
      throw new Error('Expected nonempty north and south lobe arrays');
    let edge = -180;
    for (const lobe of hemisphere) {
      if (!Array.isArray(lobe) || lobe.length !== 3 || !lobe.every(Number.isFinite))
        throw new Error('Expected finite [west, center, east] lobes');
      const [west, center, east] = lobe;
      if (
        west !== edge ||
        east <= west ||
        east > 180 ||
        center < west ||
        center > east ||
        Math.max(center - west, east - center) > 180
      )
        throw new Error(
          'Lobes must partition [-180, 180] with centers inside and at most 180 degrees from either edge'
        );
      edge = east;
    }
    if (edge !== 180) throw new Error('Lobes must cover [-180, 180]');
  }
  return interruptedMap(
    options.projection,
    options.radius,
    false,
    'default',
    ((((centralMeridian + 180) % 360) + 360) % 360) - 180,
    options.lobes
  );
}
function validRadius(value = 1): number {
  if (!Number.isFinite(value) || value <= 0) throw new Error('Radius must be finite and positive');
  return value;
}
