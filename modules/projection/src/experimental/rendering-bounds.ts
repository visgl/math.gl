// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {ProjectionImplementation, ProjectionRenderingProfile} from './types';
import type {AngularRanges} from './geographic-bounds';
import {wrapLongitude} from './parameters';

export type Range = readonly [number, number];
export const ordered = (a: number, b: number): [number, number] => [Math.min(a, b), Math.max(a, b)];
export const add = (a: Range, b: Range): [number, number] => [a[0] + b[0], a[1] + b[1]];
export const scale = (a: Range, value: number): [number, number] =>
  ordered(a[0] * value, a[1] * value);
export function multiply(a: Range, b: Range): [number, number] {
  const values = [a[0] * b[0], a[0] * b[1], a[1] * b[0], a[1] * b[1]];
  return [Math.min(...values), Math.max(...values)];
}
export function sine([low, high]: Range): [number, number] {
  const values = [Math.sin(low), Math.sin(high)];
  for (const [phase, value] of [
    [Math.PI / 2, 1],
    [-Math.PI / 2, -1]
  ]) {
    if (Math.ceil((low - phase) / (2 * Math.PI)) <= Math.floor((high - phase) / (2 * Math.PI)))
      values.push(value);
  }
  return [Math.min(...values), Math.max(...values)];
}
export const cosine = (a: Range): [number, number] =>
  sine([a[0] + Math.PI / 2, a[1] + Math.PI / 2]);
export const maxAbs = (a: Range): number => Math.max(Math.abs(a[0]), Math.abs(a[1]));
export function envelope(x: Range, y: Range): ProjectionRenderingProfile['bounds'] {
  const padding = (range: Range) => Math.max(1, maxAbs(range)) * 1e-12;
  if (![...x, ...y].every(Number.isFinite))
    throw new Error('Projection rendering bounds are not finite');
  return [
    [x[0] - padding(x), y[0] - padding(y), 0],
    [x[1] + padding(x), y[1] + padding(y), 0]
  ];
}

/** Include both sides of the projection seam; a continuous geographic bbox can cross it. */
export function longitudeRange(
  parameters: AngularRanges,
  origin: number,
  over = false
): [number, number] {
  const low = parameters.longitude[0] - origin,
    high = parameters.longitude[1] - origin;
  if (over) return [low, high];
  if (high - low >= 2 * Math.PI - 1e-12) return [-Math.PI, Math.PI];
  const west = wrapLongitude(low),
    east = wrapLongitude(high);
  // A covered seam endpoint has equivalent representatives on both sides;
  // account for kernel rounding at the cut as well as strict seam crossings.
  if (Math.abs(west) >= Math.PI - 1e-12 || Math.abs(east) >= Math.PI - 1e-12)
    return [-Math.PI, Math.PI];
  return west <= east ? [west, east] : [-Math.PI, Math.PI];
}

/** Cylindrical x is linear in longitude; width is monotone on each side of the equator.
 * Latitude endpoints and the equator therefore contain all coordinate extrema.
 */
export function cylindricalBounds(
  project: ProjectionImplementation['forward'],
  parameters: AngularRanges,
  origin: number,
  over = false
): ProjectionRenderingProfile['bounds'] {
  const longitude = longitudeRange(parameters, origin, over);
  const latitudes = [
    parameters.latitude[0],
    parameters.latitude[1],
    Math.max(parameters.latitude[0], Math.min(parameters.latitude[1], 0))
  ];
  const points = longitude.flatMap(x => latitudes.map(y => project(origin + x, y)));
  return envelope(
    [Math.min(...points.map(p => p[0])), Math.max(...points.map(p => p[0]))],
    [Math.min(...points.map(p => p[1])), Math.max(...points.map(p => p[1]))]
  );
}

/** Transverse meridian strips are monotone away from their auxiliary equator
 * and central meridian. Both are extrema candidates in addition to strip corners.
 */
export function transverseBounds(
  project: ProjectionImplementation['forward'],
  parameters: AngularRanges,
  origin: number,
  over = false,
  equator = 0
): ProjectionRenderingProfile['bounds'] {
  const longitude = longitudeRange(parameters, origin, over);
  const longitudes = [
    longitude[0],
    longitude[1],
    Math.max(longitude[0], Math.min(longitude[1], 0))
  ];
  for (const meridian of [-Math.PI / 2, Math.PI / 2]) {
    if (meridian >= longitude[0] && meridian <= longitude[1]) longitudes.push(meridian);
  }
  const latitudes = [
    parameters.latitude[0],
    parameters.latitude[1],
    Math.max(parameters.latitude[0], Math.min(parameters.latitude[1], equator))
  ];
  const points = longitudes.flatMap(x => latitudes.map(y => project(origin + x, y)));
  return envelope(
    [Math.min(...points.map(p => p[0])), Math.max(...points.map(p => p[0]))],
    [Math.min(...points.map(p => p[1])), Math.max(...points.map(p => p[1]))]
  );
}

/** Van der Grinten is symmetric about the equator and central meridian;
 * each quadrant's coordinate extrema lie on those axes or the parameters corners.
 */
export function vanDerGrintenBounds(
  project: ProjectionImplementation['forward'],
  parameters: AngularRanges,
  origin: number,
  over = false
): ProjectionRenderingProfile['bounds'] {
  const longitude = longitudeRange(parameters, origin, over);
  const longitudes = [
    longitude[0],
    longitude[1],
    Math.max(longitude[0], Math.min(longitude[1], 0))
  ];
  const latitudes = [
    parameters.latitude[0],
    parameters.latitude[1],
    Math.max(parameters.latitude[0], Math.min(parameters.latitude[1], 0))
  ];
  const points = longitudes.flatMap(x => latitudes.map(y => project(origin + x, y)));
  return envelope(
    [Math.min(...points.map(p => p[0])), Math.max(...points.map(p => p[0]))],
    [Math.min(...points.map(p => p[1])), Math.max(...points.map(p => p[1]))]
  );
}

/** Conic radius is monotone in latitude and independent of longitude. */
export function conicBounds(
  project: ProjectionImplementation['forward'],
  parameters: AngularRanges,
  origin: number,
  cone: number,
  x0: number,
  centerY: number,
  over = false
): ProjectionRenderingProfile['bounds'] {
  const angles = scale(longitudeRange(parameters, origin, over), cone);
  const radii = ordered(
    centerY - project(origin, parameters.latitude[0])[1],
    centerY - project(origin, parameters.latitude[1])[1]
  );
  return envelope(
    add([x0, x0], multiply(radii, sine(angles))),
    add([centerY, centerY], scale(multiply(radii, cosine(angles)), -1))
  );
}
