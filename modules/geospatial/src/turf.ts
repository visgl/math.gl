// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GeoArrowArray, GeoArrowColumn} from './geoarrow/types';
import {isGeoArrowValueValid} from './geoarrow/layout';
import {getGeoArrowRowBounds, mapGeoArrowCoordinates, rewindGeoArrow} from './geoarrow/kernels';

/** A nullable, row-aligned numeric or boolean result. Validity is an Arrow bitmap. */
export type TurfBatchResult<T extends Float64Array | Uint8Array> = {
  values: T;
  validity: Uint8Array;
};
export type TurfUnits = 'kilometers' | 'meters' | 'miles' | 'nauticalmiles' | 'radians' | 'degrees';
export type TurfDistanceOptions = {units?: TurfUnits};
export type TurfPointInPolygonOptions = {ignoreBoundary?: boolean};

const RADIUS = 6371008.8;
const RAD = Math.PI / 180;
const depths: Record<string, number> = {
  'geoarrow.point': 0,
  'geoarrow.multipoint': 1,
  'geoarrow.linestring': 1,
  'geoarrow.multilinestring': 2,
  'geoarrow.polygon': 2,
  'geoarrow.multipolygon': 3
};
type Point = [number, number];
type Row = {array: GeoArrowArray; index: number; valid: boolean};

function rows(column: GeoArrowColumn, allowed: string[]): Row[] {
  if (!allowed.includes(column.encoding))
    throw new Error(
      `Unsupported GeoArrow encoding ${column.encoding}; expected ${allowed.join(', ')}`
    );
  const result: Row[] = [];
  for (const array of column.chunks)
    for (let index = 0; index < array.length; index++)
      result.push({array, index, valid: isGeoArrowValueValid(array.validity, index)});
  return result;
}
function range(array: GeoArrowArray, index: number): [number, number] {
  if (array.kind !== 'list') throw new Error('Invalid GeoArrow list storage');
  const i = (array.offset || 0) + index;
  const base = Number(array.offsetBase ?? 0);
  const a = Number(array.offsets[i]) - base,
    b = Number(array.offsets[i + 1]) - base;
  if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b))
    throw new Error('Invalid GeoArrow list offsets');
  return [a, b];
}
function scalar(array: GeoArrowArray, index: number): number {
  if (array.kind !== 'primitive') throw new Error('Invalid GeoArrow coordinate');
  if (!isGeoArrowValueValid(array.validity, index)) return NaN;
  return Number(array.values[(array.offset || 0) + index * (array.stride || 1)]);
}
function point(array: GeoArrowArray, index: number): Point | null {
  if (!isGeoArrowValueValid(array.validity, index)) return null;
  if (array.kind === 'fixed-size-list') {
    const i = ((array.offset || 0) + index) * array.size;
    const x = scalar(array.child, i),
      y = scalar(array.child, i + 1);
    return !Number.isFinite(x) || !Number.isFinite(y) ? null : [x, y];
  }
  if (array.kind === 'struct') {
    const i = (array.offset || 0) + index;
    const x = scalar(array.children['x'], i),
      y = scalar(array.children['y'], i);
    return !Number.isFinite(x) || !Number.isFinite(y) ? null : [x, y];
  }
  throw new Error('Invalid GeoArrow coordinate storage');
}
function walk(array: GeoArrowArray, index: number, depth: number, visit: (p: Point) => void): void {
  if (!isGeoArrowValueValid(array.validity, index)) return;
  if (!depth) {
    const p = point(array, index);
    if (p) visit(p);
    return;
  }
  const [a, b] = range(array, index);
  if (array.kind !== 'list') throw new Error('Invalid GeoArrow list storage');
  for (let i = a; i < b; i++) walk(array.child, i, depth - 1, visit);
}
/** Visit each line or ring with its topology preserved, without constructing geometry objects. */
function lines(
  array: GeoArrowArray,
  index: number,
  depth: number,
  visit: (array: GeoArrowArray, start: number, end: number) => void
): void {
  if (!isGeoArrowValueValid(array.validity, index)) return;
  const [a, b] = range(array, index);
  if (array.kind !== 'list') throw new Error('Invalid GeoArrow list storage');
  if (depth === 1) visit(array.child, a, b);
  else for (let i = a; i < b; i++) lines(array.child, i, depth - 1, visit);
}
function valid(bitmap: Uint8Array, i: number): void {
  bitmap[i >> 3] |= 1 << (i & 7);
}
function result(n: number, boolean = false): TurfBatchResult<Float64Array | Uint8Array> {
  return {
    values: boolean ? new Uint8Array(n) : new Float64Array(n),
    validity: new Uint8Array(Math.ceil(n / 8))
  };
}
function paired(a: Row[], b: Row[]): number {
  if (a.length === b.length) return a.length;
  if (a.length === 1) return b.length;
  if (b.length === 1) return a.length;
  throw new Error('GeoArrow batch lengths must match or one input must contain one row');
}
function units(radians: number, unit: TurfUnits = 'kilometers'): number {
  switch (unit) {
    case 'kilometers':
      return (radians * RADIUS) / 1000;
    case 'meters':
      return radians * RADIUS;
    case 'miles':
      return (radians * RADIUS) / 1609.344;
    case 'nauticalmiles':
      return (radians * RADIUS) / 1852;
    case 'radians':
      return radians;
    case 'degrees':
      return radians / RAD;
    default:
      throw new Error(`Unsupported units: ${unit}`);
  }
}
function angular(a: Point, b: Point): number {
  const dlat = (b[1] - a[1]) * RAD,
    dlon = (b[0] - a[0]) * RAD;
  const h =
    Math.sin(dlat / 2) ** 2 + Math.cos(a[1] * RAD) * Math.cos(b[1] * RAD) * Math.sin(dlon / 2) ** 2;
  return 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
}
const native = Object.keys(depths);
const points = ['geoarrow.point'];
const polygons = ['geoarrow.polygon', 'geoarrow.multipolygon'];

/** Per-row XY bounds, flattened as xmin, ymin, xmax, ymax. Empty rows are null. */
export function bbox(column: GeoArrowColumn): TurfBatchResult<Float64Array> {
  rows(column, native);
  const bounds = getGeoArrowRowBounds(column),
    out = {
      values: new Float64Array(bounds.length * 4),
      validity: new Uint8Array(Math.ceil(bounds.length / 8))
    };
  bounds.forEach((b, i) => {
    if (b) {
      out.values.set(b, i * 4);
      valid(out.validity, i);
    }
  });
  return out;
}
function pointPair(
  a: GeoArrowColumn,
  b: GeoArrowColumn,
  fn: (a: Point, b: Point) => number
): TurfBatchResult<Float64Array> {
  const left = rows(a, points),
    right = rows(b, points),
    n = paired(left, right),
    out = result(n) as TurfBatchResult<Float64Array>;
  for (let i = 0; i < n; i++) {
    const x = left[left.length === 1 ? 0 : i],
      y = right[right.length === 1 ? 0 : i];
    if (!x.valid || !y.valid) continue;
    const p = point(x.array, x.index),
      q = point(y.array, y.index);
    if (p && q) {
      out.values[i] = fn(p, q);
      valid(out.validity, i);
    }
  }
  return out;
}
/** Great-circle distance; defaults to kilometers. */
export function distance(
  a: GeoArrowColumn,
  b: GeoArrowColumn,
  options: TurfDistanceOptions = {}
): TurfBatchResult<Float64Array> {
  return pointPair(a, b, (p, q) => units(angular(p, q), options.units));
}
/** Initial great-circle bearing in degrees. */
export function bearing(a: GeoArrowColumn, b: GeoArrowColumn): TurfBatchResult<Float64Array> {
  return pointPair(a, b, (p, q) => {
    const d = (q[0] - p[0]) * RAD,
      y = Math.sin(d) * Math.cos(q[1] * RAD),
      x =
        Math.cos(p[1] * RAD) * Math.sin(q[1] * RAD) -
        Math.sin(p[1] * RAD) * Math.cos(q[1] * RAD) * Math.cos(d);
    return Math.atan2(y, x) / RAD;
  });
}
/** Great-circle line length; empty lines have length zero. */
export function length(
  column: GeoArrowColumn,
  options: TurfDistanceOptions = {}
): TurfBatchResult<Float64Array> {
  const input = rows(column, ['geoarrow.linestring', 'geoarrow.multilinestring']),
    out = result(input.length) as TurfBatchResult<Float64Array>;
  input.forEach((row, i) => {
    if (!row.valid) return;
    let sum = 0;
    lines(row.array, row.index, depths[column.encoding], (array, a, b) => {
      let prev: Point | null = null;
      for (let j = a; j < b; j++) {
        const p = point(array, j);
        if (p && prev) sum += angular(prev, p);
        prev = p;
      }
    });
    out.values[i] = units(sum, options.units);
    valid(out.validity, i);
  });
  return out;
}
function ringArea(array: GeoArrowArray, a: number, b: number): number {
  // Turf's spherical ring algorithm excludes the repeated closing coordinate.
  const n = b - a - 1;
  if (n <= 2) return 0;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const p = point(array, a + i),
      q = point(array, a + ((i + 1) % n)),
      r = point(array, a + ((i + 2) % n));
    if (p && q && r) sum += (r[0] - p[0]) * RAD * Math.sin(q[1] * RAD);
  }
  return (sum * RADIUS * RADIUS) / 2;
}
function polygonArea(array: GeoArrowArray, index: number): number {
  const [a, b] = range(array, index);
  if (array.kind !== 'list') throw new Error('Invalid polygon');
  if (a === b || !isGeoArrowValueValid(array.child.validity, a)) return 0;
  let sum = 0;
  for (let i = a; i < b; i++) {
    if (!isGeoArrowValueValid(array.child.validity, i)) continue;
    const [x, y] = range(array.child, i);
    if (array.child.kind !== 'list') throw new Error('Invalid polygon ring');
    const v = Math.abs(ringArea(array.child.child, x, y));
    sum += i === a ? v : -v;
  }
  return sum;
}
/** Spherical polygon area in square meters. Empty polygons have area zero. */
export function area(column: GeoArrowColumn): TurfBatchResult<Float64Array> {
  const input = rows(column, polygons),
    out = result(input.length) as TurfBatchResult<Float64Array>;
  input.forEach((row, i) => {
    if (!row.valid) return;
    let sum = 0;
    if (column.encoding === 'geoarrow.polygon') sum = polygonArea(row.array, row.index);
    else {
      const [a, b] = range(row.array, row.index);
      if (row.array.kind !== 'list') throw new Error('Invalid multipolygon');
      for (let j = a; j < b; j++)
        if (isGeoArrowValueValid(row.array.child.validity, j))
          sum += polygonArea(row.array.child, j);
    }
    out.values[i] = sum;
    valid(out.validity, i);
  });
  return out;
}
/** Arithmetic mean of vertices, excluding duplicate polygon ring closing vertices. Empty rows are null. */
export function centroid(column: GeoArrowColumn): GeoArrowColumn {
  const input = rows(column, native),
    values = new Float64Array(input.length * 2),
    validity = new Uint8Array(Math.ceil(input.length / 8));
  input.forEach((row, i) => {
    if (!row.valid) return;
    let x = 0,
      y = 0,
      n = 0;
    const add = (p: Point) => {
      x += p[0];
      y += p[1];
      n++;
    };
    if (polygons.includes(column.encoding))
      lines(row.array, row.index, depths[column.encoding], (array, a, b) => {
        for (let j = a; j < Math.max(a, b - 1); j++) {
          const p = point(array, j);
          if (p) add(p);
        }
      });
    else walk(row.array, row.index, depths[column.encoding], add);
    if (n) {
      values[i * 2] = x / n;
      values[i * 2 + 1] = y / n;
      valid(validity, i);
    }
  });
  return {
    encoding: 'geoarrow.point',
    dimension: 'xy',
    coordinateLayout: 'interleaved',
    spatialReference: column.spatialReference,
    edges: column.edges,
    metadata: column.metadata,
    chunks: [
      {
        kind: 'fixed-size-list',
        size: 2,
        length: input.length,
        validity: {values: validity},
        child: {kind: 'primitive', length: values.length, values}
      }
    ]
  };
}
function ringContains(array: GeoArrowArray, a: number, b: number, p: Point): number {
  let inside = false;
  for (let i = a, j = b - 1; i < b; j = i++) {
    const u = point(array, i),
      v = point(array, j);
    if (!u || !v) continue;
    const cross = (p[0] - u[0]) * (v[1] - u[1]) - (p[1] - u[1]) * (v[0] - u[0]);
    if (
      cross === 0 &&
      p[0] >= Math.min(u[0], v[0]) &&
      p[0] <= Math.max(u[0], v[0]) &&
      p[1] >= Math.min(u[1], v[1]) &&
      p[1] <= Math.max(u[1], v[1])
    )
      return 0;
    if (
      u[1] > p[1] !== v[1] > p[1] &&
      p[0] < ((v[0] - u[0]) * (p[1] - u[1])) / (v[1] - u[1]) + u[0]
    )
      inside = !inside;
  }
  return inside ? 1 : -1;
}
function polygonContains(array: GeoArrowArray, index: number, p: Point): number {
  const [a, b] = range(array, index);
  if (array.kind !== 'list') throw new Error('Invalid polygon');
  if (a === b || !isGeoArrowValueValid(array.child.validity, a)) return -1;
  for (let i = a; i < b; i++) {
    if (!isGeoArrowValueValid(array.child.validity, i)) continue;
    const [x, y] = range(array.child, i);
    if (array.child.kind !== 'list') throw new Error('Invalid polygon ring');
    const c = ringContains(array.child.child, x, y, p);
    if (c === 0) return 0;
    if ((i === a && c < 0) || (i > a && c > 0)) return -1;
  }
  return a === b ? -1 : 1;
}
/** Point-in-polygon predicate; boundary counts as inside unless ignored. */
export function booleanPointInPolygon(
  pointColumn: GeoArrowColumn,
  polygonColumn: GeoArrowColumn,
  options: TurfPointInPolygonOptions = {}
): TurfBatchResult<Uint8Array> {
  const a = rows(pointColumn, points),
    b = rows(polygonColumn, polygons),
    n = paired(a, b),
    out = result(n, true) as TurfBatchResult<Uint8Array>;
  for (let i = 0; i < n; i++) {
    const x = a[a.length === 1 ? 0 : i],
      y = b[b.length === 1 ? 0 : i];
    if (!x.valid || !y.valid) continue;
    const p = point(x.array, x.index);
    if (!p) continue;
    let hit = false;
    if (polygonColumn.encoding === 'geoarrow.polygon') {
      const c = polygonContains(y.array, y.index, p);
      hit = c > 0 || (c === 0 && !options.ignoreBoundary);
    } else {
      const [start, end] = range(y.array, y.index);
      if (y.array.kind !== 'list') throw new Error('Invalid multipolygon');
      for (let j = start; j < end; j++) {
        if (!isGeoArrowValueValid(y.array.child.validity, j)) continue;
        const c = polygonContains(y.array.child, j, p);
        if (c > 0 || (c === 0 && !options.ignoreBoundary)) {
          hit = true;
          break;
        }
      }
    }
    out.values[i] = Number(hit);
    valid(out.validity, i);
  }
  return out;
}

/** Deep-copies native coordinate and topology buffers. */
export function clone(column: GeoArrowColumn): GeoArrowColumn {
  rows(column, native);
  return mapGeoArrowCoordinates(column, coordinate => coordinate);
}

/** Rounds coordinate ordinates to a decimal precision without mutating the input. */
export function truncate(
  column: GeoArrowColumn,
  options: {precision?: number} = {}
): GeoArrowColumn {
  rows(column, native);
  const precision = options.precision ?? 6;
  if (!Number.isInteger(precision) || precision < 0 || precision > 15) {
    throw new RangeError('precision must be an integer between 0 and 15');
  }
  const factor = 10 ** precision;
  return mapGeoArrowCoordinates(column, coordinate =>
    coordinate.map(value => Math.round(value * factor) / factor)
  );
}

/** Projects longitude/latitude degrees to spherical Web Mercator meters. */
export function toMercator(column: GeoArrowColumn): GeoArrowColumn {
  rows(column, native);
  const radius = 6378137;
  const maximum = 20037508.342789244;
  return {
    ...mapGeoArrowCoordinates(column, coordinate => {
      const longitude =
        Math.abs(coordinate[0]) <= 180
          ? coordinate[0]
          : coordinate[0] - Math.sign(coordinate[0]) * 360;
      const x = radius * longitude * RAD;
      const y = radius * Math.log(Math.tan(Math.PI / 4 + (coordinate[1] * RAD) / 2));
      return [
        Math.max(-maximum, Math.min(maximum, x)),
        Math.max(-maximum, Math.min(maximum, y)),
        ...coordinate.slice(2)
      ];
    }),
    spatialReference: null
  };
}

/** Converts spherical Web Mercator meters to longitude/latitude degrees. */
export function toWgs84(column: GeoArrowColumn): GeoArrowColumn {
  rows(column, native);
  return {
    ...mapGeoArrowCoordinates(column, coordinate => [
      coordinate[0] / 6378137 / RAD,
      (2 * Math.atan(Math.exp(coordinate[1] / 6378137)) - Math.PI / 2) / RAD,
      ...coordinate.slice(2)
    ]),
    spatialReference: null
  };
}

function pointOutput(
  source: GeoArrowColumn,
  count: number,
  calculate: (index: number) => Point | null
): GeoArrowColumn {
  const values = new Float64Array(count * 2);
  const validity = new Uint8Array(Math.ceil(count / 8));
  for (let i = 0; i < count; i++) {
    const p = calculate(i);
    if (p) {
      values.set(p, i * 2);
      valid(validity, i);
    }
  }
  return {
    encoding: 'geoarrow.point',
    dimension: 'xy',
    coordinateLayout: 'interleaved',
    spatialReference: source.spatialReference,
    metadata: source.metadata,
    edges: source.edges,
    chunks: [
      {
        kind: 'fixed-size-list',
        size: 2,
        length: count,
        validity: {values: validity},
        child: {kind: 'primitive', length: values.length, values}
      }
    ]
  };
}

/** Center of each geometry's XY bounding box. */
export function center(column: GeoArrowColumn): GeoArrowColumn {
  rows(column, native);
  const bounds = getGeoArrowRowBounds(column);
  return pointOutput(column, bounds.length, i =>
    bounds[i] ? [(bounds[i][0] + bounds[i][2]) / 2, (bounds[i][1] + bounds[i][3]) / 2] : null
  );
}

function destinationPoint(p: Point, radians: number, bearingDegrees: number): Point {
  const latitude = p[1] * RAD,
    bearing = bearingDegrees * RAD;
  const y = Math.asin(
    Math.sin(latitude) * Math.cos(radians) +
      Math.cos(latitude) * Math.sin(radians) * Math.cos(bearing)
  );
  const x =
    p[0] * RAD +
    Math.atan2(
      Math.sin(bearing) * Math.sin(radians) * Math.cos(latitude),
      Math.cos(radians) - Math.sin(latitude) * Math.sin(y)
    );
  return [x / RAD, y / RAD];
}

/** Destination for each point at a common great-circle distance and bearing. */
export function destination(
  column: GeoArrowColumn,
  distanceValue: number,
  bearingDegrees: number,
  options: TurfDistanceOptions = {}
): GeoArrowColumn {
  if (!Number.isFinite(distanceValue) || !Number.isFinite(bearingDegrees))
    throw new RangeError('Distance and bearing must be finite');
  const input = rows(column, points),
    radians = distanceValue / units(1, options.units);
  return pointOutput(column, input.length, i => {
    const row = input[i];
    const p = row.valid ? point(row.array, row.index) : null;
    return p ? destinationPoint(p, radians, bearingDegrees) : null;
  });
}

/** Great-circle midpoint with row pairing or single-row broadcasting. */
export function midpoint(a: GeoArrowColumn, b: GeoArrowColumn): GeoArrowColumn {
  const left = rows(a, points),
    right = rows(b, points),
    count = paired(left, right);
  return pointOutput(a, count, i => {
    const x = left[left.length === 1 ? 0 : i],
      y = right[right.length === 1 ? 0 : i];
    if (!x.valid || !y.valid) return null;
    const p = point(x.array, x.index),
      q = point(y.array, y.index);
    if (!p || !q) return null;
    const delta = (q[0] - p[0]) * RAD;
    const angle = Math.atan2(
      Math.sin(delta) * Math.cos(q[1] * RAD),
      Math.cos(p[1] * RAD) * Math.sin(q[1] * RAD) -
        Math.sin(p[1] * RAD) * Math.cos(q[1] * RAD) * Math.cos(delta)
    );
    return destinationPoint(p, angular(p, q) / 2, angle / RAD);
  });
}

function rhumbAngle(a: Point, b: Point): number {
  let longitude = (b[0] - a[0]) * RAD;
  if (Math.abs(longitude) > Math.PI) longitude += longitude > 0 ? -2 * Math.PI : 2 * Math.PI;
  const latitude = Math.log(
    Math.tan((b[1] * RAD) / 2 + Math.PI / 4) / Math.tan((a[1] * RAD) / 2 + Math.PI / 4)
  );
  return Math.atan2(longitude, latitude);
}

/** Constant-bearing distance on Turf's spherical earth, in the selected units. */
export function rhumbDistance(
  a: GeoArrowColumn,
  b: GeoArrowColumn,
  options: TurfDistanceOptions = {}
): TurfBatchResult<Float64Array> {
  return pointPair(a, b, (p, q) => {
    const delta = (q[1] - p[1]) * RAD;
    let longitude = Math.abs(q[0] - p[0]) * RAD;
    if (longitude > Math.PI) longitude = 2 * Math.PI - longitude;
    const psi = Math.log(
      Math.tan((q[1] * RAD) / 2 + Math.PI / 4) / Math.tan((p[1] * RAD) / 2 + Math.PI / 4)
    );
    const scale = Math.abs(psi) > 1e-11 ? delta / psi : Math.cos(p[1] * RAD);
    return units(Math.hypot(delta, scale * longitude), options.units);
  });
}

/** Constant-bearing heading in degrees, with optional reciprocal final bearing. */
export function rhumbBearing(
  a: GeoArrowColumn,
  b: GeoArrowColumn,
  options: {final?: boolean} = {}
): TurfBatchResult<Float64Array> {
  return pointPair(a, b, (p, q) => rhumbAngle(options.final ? q : p, options.final ? p : q) / RAD);
}

function rhumbDestinationPoint(p: Point, radians: number, bearingDegrees: number): Point {
  const phi = p[1] * RAD,
    theta = bearingDegrees * RAD;
  const delta = radians * Math.cos(theta);
  let latitude = phi + delta;
  if (Math.abs(latitude) > Math.PI / 2)
    latitude = latitude > 0 ? Math.PI - latitude : -Math.PI - latitude;
  const psi = Math.log(Math.tan(latitude / 2 + Math.PI / 4) / Math.tan(phi / 2 + Math.PI / 4));
  const scale = Math.abs(psi) > 1e-11 ? delta / psi : Math.cos(phi);
  let longitude =
    (((p[0] * RAD + (radians * Math.sin(theta)) / scale + 3 * Math.PI) % (2 * Math.PI)) - Math.PI) /
    RAD;
  if (longitude - p[0] > 180) longitude -= 360;
  if (p[0] - longitude > 180) longitude += 360;
  return [longitude, latitude / RAD];
}

/** Constant-bearing destination for each input point. */
export function rhumbDestination(
  column: GeoArrowColumn,
  distanceValue: number,
  bearingDegrees: number,
  options: TurfDistanceOptions = {}
): GeoArrowColumn {
  if (!Number.isFinite(distanceValue) || !Number.isFinite(bearingDegrees))
    throw new RangeError('Distance and bearing must be finite');
  const input = rows(column, points),
    radians = distanceValue / units(1, options.units);
  return pointOutput(column, input.length, i => {
    const row = input[i],
      p = row.valid ? point(row.array, row.index) : null;
    return p ? rhumbDestinationPoint(p, radians, bearingDegrees) : null;
  });
}

/** Translates every vertex along a rhumb line, preserving Z and M. */
export function transformTranslate(
  column: GeoArrowColumn,
  distanceValue: number,
  direction: number,
  options: TurfDistanceOptions = {}
): GeoArrowColumn {
  rows(column, native);
  if (!Number.isFinite(distanceValue) || !Number.isFinite(direction))
    throw new RangeError('Distance and direction must be finite');
  const radians = distanceValue / units(1, options.units);
  return mapGeoArrowCoordinates(column, p => [
    ...rhumbDestinationPoint([p[0], p[1]], radians, direction),
    ...p.slice(2)
  ]);
}

/** Rotates each geometry around an explicit pivot, using Turf's rhumb convention. */
export function transformRotate(
  column: GeoArrowColumn,
  angle: number,
  options: {pivot: readonly [number, number]}
): GeoArrowColumn {
  rows(column, native);
  if (!Number.isFinite(angle) || !options.pivot.every(Number.isFinite))
    throw new RangeError('Angle and pivot must be finite');
  const pivot: Point = [options.pivot[0], options.pivot[1]];
  return mapGeoArrowCoordinates(column, p => {
    const phi = (p[1] - pivot[1]) * RAD;
    const psi = Math.log(
      Math.tan((p[1] * RAD) / 2 + Math.PI / 4) / Math.tan((pivot[1] * RAD) / 2 + Math.PI / 4)
    );
    const q = Math.abs(psi) > 1e-11 ? phi / psi : Math.cos(pivot[1] * RAD);
    let longitude = Math.abs(p[0] - pivot[0]) * RAD;
    if (longitude > Math.PI) longitude = 2 * Math.PI - longitude;
    const distance = Math.hypot(phi, q * longitude);
    return [
      ...rhumbDestinationPoint(pivot, distance, rhumbAngle(pivot, [p[0], p[1]]) / RAD + angle),
      ...p.slice(2)
    ];
  });
}

function generatedPaths(
  source: GeoArrowColumn,
  count: number,
  size: number,
  polygon: boolean,
  generate: (row: number, vertex: number) => Point | null
): GeoArrowColumn {
  const values = new Float64Array(count * size * 2),
    validity = new Uint8Array(Math.ceil(count / 8));
  const offsets = new Int32Array(count + 1);
  for (let row = 0; row < count; row++) {
    offsets[row + 1] = (row + 1) * size;
    let present = true;
    for (let vertex = 0; vertex < size; vertex++) {
      const p = generate(row, vertex);
      if (p) values.set(p, (row * size + vertex) * 2);
      else present = false;
    }
    if (present) valid(validity, row);
  }
  const coordinates: GeoArrowArray = {
    kind: 'fixed-size-list',
    size: 2,
    length: count * size,
    child: {kind: 'primitive', length: values.length, values}
  };
  const paths: GeoArrowArray = {kind: 'list', length: count, offsets, child: coordinates};
  const geometry: GeoArrowArray = polygon
    ? {
        kind: 'list',
        length: count,
        offsets: Int32Array.from({length: count + 1}, (_, i) => i),
        child: paths,
        validity: {values: validity}
      }
    : {...paths, validity: {values: validity}};
  return {
    encoding: polygon ? 'geoarrow.polygon' : 'geoarrow.linestring',
    dimension: 'xy',
    coordinateLayout: 'interleaved',
    spatialReference: source.spatialReference,
    metadata: source.metadata,
    edges: source.edges,
    chunks: [geometry]
  };
}

function checkedSteps(steps = 64): number {
  if (!Number.isInteger(steps) || steps < 4 || steps > 65536)
    throw new RangeError('steps must be an integer from 4 through 65536');
  return steps;
}

/** Generates one spherical circle polygon per point. */
export function circle(
  column: GeoArrowColumn,
  radius: number,
  options: TurfDistanceOptions & {steps?: number} = {}
): GeoArrowColumn {
  const input = rows(column, points),
    steps = checkedSteps(options.steps);
  if (!Number.isFinite(radius) || radius < 0)
    throw new RangeError('radius must be finite and nonnegative');
  const radians = radius / units(1, options.units);
  return generatedPaths(column, input.length, steps + 1, true, (i, j) => {
    const row = input[i],
      p = row.valid ? point(row.array, row.index) : null;
    return p ? destinationPoint(p, radians, (-360 * (j % steps)) / steps) : null;
  });
}

/** Generates a rectangular polygon from each row's bounds. */
export function bboxPolygon(column: GeoArrowColumn): GeoArrowColumn {
  rows(column, native);
  const bounds = getGeoArrowRowBounds(column);
  return generatedPaths(column, bounds.length, 5, true, (i, j) => {
    const b = bounds[i];
    if (!b) return null;
    return [b[j === 1 || j === 2 ? 2 : 0], b[j === 2 || j === 3 ? 3 : 1]];
  });
}

/** Generates a clockwise spherical arc per center point. Equal bearings generate a full circle. */
export function lineArc(
  column: GeoArrowColumn,
  radius: number,
  bearing1: number,
  bearing2: number,
  options: TurfDistanceOptions & {steps?: number} = {}
): GeoArrowColumn {
  const input = rows(column, points),
    steps = checkedSteps(options.steps);
  if (![radius, bearing1, bearing2].every(Number.isFinite) || radius < 0)
    throw new RangeError('Radius and bearings must be finite; radius must be nonnegative');
  const start = ((bearing1 % 360) + 360) % 360,
    end = ((bearing2 % 360) + 360) % 360;
  const sweep = (end - start + 360) % 360 || 360;
  const segments = Math.ceil((sweep * steps) / 360),
    radians = radius / units(1, options.units);
  return generatedPaths(column, input.length, segments + 1, false, (i, j) => {
    const row = input[i],
      p = row.valid ? point(row.array, row.index) : null;
    return p ? destinationPoint(p, radians, start + Math.min((j * 360) / steps, sweep)) : null;
  });
}

/** Samples each LineString at a surface distance from its start, clamped at its end. */
export function along(
  column: GeoArrowColumn,
  distanceValue: number,
  options: TurfDistanceOptions = {}
): GeoArrowColumn {
  const input = rows(column, ['geoarrow.linestring']);
  if (!Number.isFinite(distanceValue) || distanceValue < 0)
    throw new RangeError('distance must be finite and nonnegative');
  const target = distanceValue / units(1, options.units);
  return pointOutput(column, input.length, i => {
    const row = input[i];
    if (!row.valid || row.array.kind !== 'list') return null;
    const [a, b] = range(row.array, row.index);
    let previous: Point | null = null,
      travelled = 0;
    for (let j = a; j < b; j++) {
      const p = point(row.array.child, j);
      if (!p) {
        previous = null;
        continue;
      }
      if (previous) {
        const segment = angular(previous, p);
        if (travelled + segment >= target) {
          const delta = (p[0] - previous[0]) * RAD;
          const heading = Math.atan2(
            Math.sin(delta) * Math.cos(p[1] * RAD),
            Math.cos(previous[1] * RAD) * Math.sin(p[1] * RAD) -
              Math.sin(previous[1] * RAD) * Math.cos(p[1] * RAD) * Math.cos(delta)
          );
          return destinationPoint(previous, target - travelled, heading / RAD);
        }
        travelled += segment;
      } else if (target === 0) return p;
      previous = p;
    }
    return previous;
  });
}

/** Tests points against LineStrings, pairing rows or broadcasting one row. */
export function booleanPointOnLine(
  pointColumn: GeoArrowColumn,
  lineColumn: GeoArrowColumn,
  options: {ignoreEndVertices?: boolean; epsilon?: number} = {}
): TurfBatchResult<Uint8Array> {
  const epsilon = options.epsilon ?? 0;
  if (!Number.isFinite(epsilon) || epsilon < 0)
    throw new RangeError('epsilon must be finite and nonnegative');
  const a = rows(pointColumn, points),
    b = rows(lineColumn, ['geoarrow.linestring']),
    n = paired(a, b),
    out = result(n, true) as TurfBatchResult<Uint8Array>;
  for (let i = 0; i < n; i++) {
    const left = a[a.length === 1 ? 0 : i],
      right = b[b.length === 1 ? 0 : i];
    if (!left.valid || !right.valid) continue;
    const p = point(left.array, left.index);
    if (!p || right.array.kind !== 'list') continue;
    const [start, end] = range(right.array, right.index);
    for (let j = start + 1; j < end; j++) {
      const u = point(right.array.child, j - 1),
        v = point(right.array.child, j);
      if (!u || !v) continue;
      const cross = (p[0] - u[0]) * (v[1] - u[1]) - (p[1] - u[1]) * (v[0] - u[0]);
      const axis = Math.abs(v[0] - u[0]) >= Math.abs(v[1] - u[1]) ? 0 : 1;
      if (u[0] === v[0] && u[1] === v[1]) {
        if (p[0] !== u[0] || p[1] !== u[1]) continue;
      } else if (
        Math.abs(cross) > epsilon ||
        p[axis] < Math.min(u[axis], v[axis]) ||
        p[axis] > Math.max(u[axis], v[axis])
      )
        continue;
      if (
        options.ignoreEndVertices &&
        ((j === start + 1 && p[0] === u[0] && p[1] === u[1]) ||
          (j === end - 1 && p[0] === v[0] && p[1] === v[1]))
      )
        continue;
      out.values[i] = 1;
      break;
    }
    valid(out.validity, i);
  }
  return out;
}

/** Tests clockwise orientation of each closed LineString in XY coordinates. */
export function booleanClockwise(column: GeoArrowColumn): TurfBatchResult<Uint8Array> {
  const input = rows(column, ['geoarrow.linestring']),
    out = result(input.length, true) as TurfBatchResult<Uint8Array>;
  input.forEach((row, i) => {
    if (!row.valid || row.array.kind !== 'list') return;
    const [a, b] = range(row.array, row.index);
    let sum = 0;
    for (let j = a + 1; j < b; j++) {
      const p = point(row.array.child, j - 1),
        q = point(row.array.child, j);
      if (p && q) sum += (q[0] - p[0]) * (q[1] + p[1]);
    }
    out.values[i] = Number(sum > 0);
    valid(out.validity, i);
  });
  return out;
}

/** Reorients polygon outer rings counterclockwise and holes clockwise, or reverses that convention. */
export function rewind(column: GeoArrowColumn, options: {reverse?: boolean} = {}): GeoArrowColumn {
  rows(column, polygons);
  return rewindGeoArrow(column, {outer: options.reverse ? 'clockwise' : 'counter-clockwise'});
}

/** Scales rhumb distances from an explicit origin; preserves additional ordinates. */
export function transformScale(
  column: GeoArrowColumn,
  factor: number,
  options: {origin: readonly [number, number]}
): GeoArrowColumn {
  rows(column, native);
  if (!Number.isFinite(factor) || factor <= 0 || !options.origin.every(Number.isFinite))
    throw new RangeError('factor must be positive and origin must be finite');
  const origin: Point = [options.origin[0], options.origin[1]];
  return mapGeoArrowCoordinates(column, p => {
    const delta = (p[1] - origin[1]) * RAD;
    const psi = Math.log(
      Math.tan((p[1] * RAD) / 2 + Math.PI / 4) / Math.tan((origin[1] * RAD) / 2 + Math.PI / 4)
    );
    const q = Math.abs(psi) > 1e-11 ? delta / psi : Math.cos(origin[1] * RAD);
    let longitude = Math.abs(p[0] - origin[0]) * RAD;
    if (longitude > Math.PI) longitude = 2 * Math.PI - longitude;
    return [
      ...rhumbDestinationPoint(
        origin,
        Math.hypot(delta, q * longitude) * factor,
        rhumbAngle(origin, [p[0], p[1]]) / RAD
      ),
      ...p.slice(2)
    ];
  });
}

/** Views Polygon rings as a MultiLineString column without copying buffers. */
export function polygonToLine(column: GeoArrowColumn): GeoArrowColumn {
  rows(column, ['geoarrow.polygon']);
  return {...column, encoding: 'geoarrow.multilinestring'};
}

/** Views closed LineStrings as single-ring polygons. Open and degenerate rings are rejected. */
export function lineToPolygon(column: GeoArrowColumn): GeoArrowColumn {
  const input = rows(column, ['geoarrow.linestring']);
  for (const row of input) {
    if (!row.valid || row.array.kind !== 'list') continue;
    const [a, b] = range(row.array, row.index);
    if (a === b) continue;
    const first = point(row.array.child, a),
      last = point(row.array.child, b - 1);
    if (b - a < 4 || !first || !last || first[0] !== last[0] || first[1] !== last[1])
      throw new RangeError('lineToPolygon requires closed rings with at least four coordinates');
  }
  return {
    ...column,
    encoding: 'geoarrow.polygon',
    chunks: column.chunks.map(chunk => ({
      kind: 'list' as const,
      length: chunk.length,
      validity: chunk.validity,
      offsets: Int32Array.from({length: chunk.length + 1}, (_, i) => i),
      child: chunk
    }))
  };
}

/** Emits all nonempty XY vertices as point rows in traversal order. Null geometries emit no rows. */
export function explode(column: GeoArrowColumn): GeoArrowColumn {
  const input = rows(column, native);
  let count = 0;
  for (const row of input)
    if (row.valid) walk(row.array, row.index, depths[column.encoding], () => count++);
  const values = new Float64Array(count * 2);
  let index = 0;
  for (const row of input)
    if (row.valid)
      walk(row.array, row.index, depths[column.encoding], p => {
        values.set(p, index * 2);
        index++;
      });
  return {
    encoding: 'geoarrow.point',
    dimension: 'xy',
    coordinateLayout: 'interleaved',
    spatialReference: column.spatialReference,
    metadata: column.metadata,
    edges: column.edges,
    chunks: [
      {
        kind: 'fixed-size-list',
        size: 2,
        length: count,
        child: {kind: 'primitive', length: values.length, values}
      }
    ]
  };
}

/** Emits each adjacent pair from line and polygon rings as a two-vertex LineString. */
export function lineSegment(column: GeoArrowColumn): GeoArrowColumn {
  const input = rows(column, ['geoarrow.linestring', 'geoarrow.multilinestring', ...polygons]);
  const visit = (emit: (p: Point, q: Point) => void) => {
    for (const row of input)
      if (row.valid)
        lines(row.array, row.index, depths[column.encoding], (array, a, b) => {
          for (let j = a + 1; j < b; j++) {
            const p = point(array, j - 1),
              q = point(array, j);
            if (p && q) emit(p, q);
          }
        });
  };
  let count = 0;
  visit(() => count++);
  const values = new Float64Array(count * 4),
    offsets = Int32Array.from({length: count + 1}, (_, i) => i * 2);
  let index = 0;
  visit((p, q) => {
    values.set(p, index * 4);
    values.set(q, index * 4 + 2);
    index++;
  });
  return {
    encoding: 'geoarrow.linestring',
    dimension: 'xy',
    coordinateLayout: 'interleaved',
    spatialReference: column.spatialReference,
    metadata: column.metadata,
    edges: column.edges,
    chunks: [
      {
        kind: 'list',
        length: count,
        offsets,
        child: {
          kind: 'fixed-size-list',
          size: 2,
          length: count * 2,
          child: {kind: 'primitive', length: values.length, values}
        }
      }
    ]
  };
}

/** Tests whether a Polygon's exterior ring contains turns of both orientations. Holes are ignored. */
export function booleanConcave(column: GeoArrowColumn): TurfBatchResult<Uint8Array> {
  const input = rows(column, ['geoarrow.polygon']),
    out = result(input.length, true) as TurfBatchResult<Uint8Array>;
  input.forEach((row, i) => {
    if (!row.valid || row.array.kind !== 'list') return;
    valid(out.validity, i);
    const [firstRing, lastRing] = range(row.array, row.index);
    const rings = row.array.child;
    if (
      firstRing === lastRing ||
      rings.kind !== 'list' ||
      !isGeoArrowValueValid(rings.validity, firstRing)
    )
      return;
    const [a, b] = range(rings, firstRing),
      n = b - a - 1;
    if (n < 3) return;
    let positive = false,
      negative = false;
    for (let j = 0; j < n; j++) {
      const p = point(rings.child, a + j),
        q = point(rings.child, a + ((j + 1) % n)),
        r = point(rings.child, a + ((j + 2) % n));
      if (!p || !q || !r) continue;
      const cross = (q[0] - p[0]) * (r[1] - q[1]) - (q[1] - p[1]) * (r[0] - q[0]);
      positive ||= cross > 0;
      negative ||= cross < 0;
    }
    out.values[i] = Number(positive && negative);
  });
  return out;
}

type TurfSegment = {array: GeoArrowArray; index: number; path: number; first: number; last: number};
const lineFamilies = ['geoarrow.linestring', 'geoarrow.multilinestring', ...polygons];
function segments(row: Row, encoding: string): TurfSegment[] {
  const output: TurfSegment[] = [];
  let path = 0;
  if (row.valid)
    lines(row.array, row.index, depths[encoding], (array, first, last) => {
      for (let index = first; index + 1 < last; index++)
        output.push({array, index, path, first, last});
      path++;
    });
  return output;
}
function segmentCrossing(a: TurfSegment, b: TurfSegment): Point | null {
  const p = point(a.array, a.index),
    q = point(a.array, a.index + 1);
  const r = point(b.array, b.index),
    s = point(b.array, b.index + 1);
  if (!p || !q || !r || !s) return null;
  const dx = q[0] - p[0],
    dy = q[1] - p[1],
    ex = s[0] - r[0],
    ey = s[1] - r[1];
  const denominator = dx * ey - dy * ex;
  const onSegment = (a: Point, b: Point, v: Point) =>
    (v[0] - a[0]) * (b[1] - a[1]) - (v[1] - a[1]) * (b[0] - a[0]) === 0 &&
    v[0] >= Math.min(a[0], b[0]) &&
    v[0] <= Math.max(a[0], b[0]) &&
    v[1] >= Math.min(a[1], b[1]) &&
    v[1] <= Math.max(a[1], b[1]);
  const endpoints = [p, q, r, s].filter(v => onSegment(p, q, v) && onSegment(r, s, v));
  if (denominator === 0) {
    const unique = endpoints.filter(
      (v, i) => !endpoints.slice(0, i).some(w => w[0] === v[0] && w[1] === v[1])
    );
    return unique.length === 1 ? unique[0] : null;
  }
  if (endpoints.length) return endpoints[0];
  const rx = r[0] - p[0],
    ry = r[1] - p[1];
  const t = (rx * ey - ry * ex) / denominator,
    u = (rx * dy - ry * dx) / denominator;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? [p[0] + t * dx, p[1] + t * dy] : null;
}
function intersectionOutput(
  source: GeoArrowColumn,
  count: number,
  visit: (row: number, emit: (p: Point) => void) => boolean
): GeoArrowColumn {
  const offsets = new Int32Array(count + 1),
    validity = new Uint8Array(Math.ceil(count / 8));
  for (let i = 0; i < count; i++) {
    let size = 0;
    if (visit(i, () => size++)) valid(validity, i);
    const next = offsets[i] + size;
    if (next > 0x7fffffff) throw new RangeError('Intersection output exceeds Int32 offsets');
    offsets[i + 1] = next;
  }
  const values = new Float64Array(offsets[count] * 2);
  for (let i = 0; i < count; i++) {
    let index = offsets[i];
    visit(i, p => {
      values.set(p, index * 2);
      index++;
    });
  }
  return {
    encoding: 'geoarrow.multipoint',
    dimension: 'xy',
    coordinateLayout: 'interleaved',
    spatialReference: source.spatialReference,
    metadata: source.metadata,
    edges: source.edges,
    chunks: [
      {
        kind: 'list',
        length: count,
        offsets,
        validity: {values: validity},
        child: {
          kind: 'fixed-size-list',
          size: 2,
          length: offsets[count],
          child: {kind: 'primitive', length: values.length, values}
        }
      }
    ]
  };
}
/** Isolated planar boundary intersections per paired row. Collinear overlaps are omitted.
 * Uses an exhaustive segment scan; intended for bounded per-row geometries.
 */
export function lineIntersect(
  a: GeoArrowColumn,
  b: GeoArrowColumn,
  options: {removeDuplicates?: boolean} = {}
): GeoArrowColumn {
  const left = rows(a, lineFamilies),
    right = rows(b, lineFamilies),
    count = paired(left, right);
  return intersectionOutput(a, count, (i, emit) => {
    const x = left[left.length === 1 ? 0 : i],
      y = right[right.length === 1 ? 0 : i];
    if (!x.valid || !y.valid) return false;
    const seen = new Set<string>();
    const xs = segments(x, a.encoding),
      ys = segments(y, b.encoding);
    for (const p of xs)
      for (const q of ys) {
        const crossing = segmentCrossing(p, q);
        if (!crossing) continue;
        const key = `${crossing[0]},${crossing[1]}`;
        if (options.removeDuplicates !== false && seen.has(key)) continue;
        seen.add(key);
        emit(crossing);
      }
    return true;
  });
}
/** Isolated self-intersections per row, excluding ordinary adjacent segment joins. */
export function kinks(column: GeoArrowColumn): GeoArrowColumn {
  const input = rows(column, lineFamilies);
  return intersectionOutput(column, input.length, (i, emit) => {
    const row = input[i];
    if (!row.valid) return false;
    const edges = segments(row, column.encoding),
      seen = new Set<string>();
    for (let j = 0; j < edges.length; j++)
      for (let k = j + 1; k < edges.length; k++) {
        const a = edges[j],
          b = edges[k];
        if (a.path === b.path && b.index === a.index + 1) continue;
        if (a.path === b.path && a.index === a.first && b.index === a.last - 2) {
          const first = point(a.array, a.first),
            last = point(a.array, a.last - 1);
          if (first && last && first[0] === last[0] && first[1] === last[1]) continue;
        }
        const crossing = segmentCrossing(a, b);
        if (!crossing) continue;
        const key = `${crossing[0]},${crossing[1]}`;
        if (!seen.has(key)) {
          seen.add(key);
          emit(crossing);
        }
      }
    return true;
  });
}
/** Arithmetic vertex mean per geometry, including polygon closing vertices (Turf centerMean semantics). */
export function centerMean(column: GeoArrowColumn): GeoArrowColumn {
  const input = rows(column, native);
  return pointOutput(column, input.length, i => {
    const row = input[i];
    if (!row.valid) return null;
    let x = 0,
      y = 0,
      count = 0;
    walk(row.array, row.index, depths[column.encoding], p => {
      x += p[0];
      y += p[1];
      count++;
    });
    return count ? [x / count, y / count] : null;
  });
}

/** Clockwise angle at the middle point, with single-row broadcasting on all three inputs. */
export function angle(
  start: GeoArrowColumn,
  middle: GeoArrowColumn,
  end: GeoArrowColumn,
  options: {mercator?: boolean; explementary?: boolean} = {}
): TurfBatchResult<Float64Array> {
  const inputs = [start, middle, end].map(c => rows(c, points));
  const sizes = inputs.map(r => r.length),
    count = sizes.find(n => n !== 1) ?? 1;
  if (sizes.some(n => n !== 1 && n !== count))
    throw new RangeError('Angle batch lengths must match or contain one row');
  const out = result(count) as TurfBatchResult<Float64Array>;
  for (let i = 0; i < count; i++) {
    const p = inputs.map(r => {
      const row = r[r.length === 1 ? 0 : i];
      return row.valid ? point(row.array, row.index) : null;
    });
    if (p.some(v => !v)) continue;
    const heading = (a: Point, b: Point) =>
      options.mercator
        ? rhumbAngle(a, b) / RAD
        : Math.atan2(
            Math.sin((b[0] - a[0]) * RAD) * Math.cos(b[1] * RAD),
            Math.cos(a[1] * RAD) * Math.sin(b[1] * RAD) -
              Math.sin(a[1] * RAD) * Math.cos(b[1] * RAD) * Math.cos((b[0] - a[0]) * RAD)
          ) / RAD;
    const value = (heading(p[1], p[2]) - heading(p[1], p[0]) + 360) % 360;
    out.values[i] = options.explementary ? 360 - value : value;
    valid(out.validity, i);
  }
  return out;
}

/** Tests corresponding LineString segments for parallel rhumb headings. */
export function booleanParallel(a: GeoArrowColumn, b: GeoArrowColumn): TurfBatchResult<Uint8Array> {
  const left = rows(a, ['geoarrow.linestring']),
    right = rows(b, ['geoarrow.linestring']),
    count = paired(left, right),
    out = result(count, true) as TurfBatchResult<Uint8Array>;
  for (let i = 0; i < count; i++) {
    const x = left[left.length === 1 ? 0 : i],
      y = right[right.length === 1 ? 0 : i];
    if (!x.valid || !y.valid) continue;
    const p = segments(x, a.encoding),
      q = segments(y, b.encoding);
    let parallel = true;
    for (let j = 0; j < Math.min(p.length, q.length); j++) {
      const u = point(p[j].array, p[j].index),
        v = point(p[j].array, p[j].index + 1),
        w = point(q[j].array, q[j].index),
        z = point(q[j].array, q[j].index + 1);
      if (!u || !v || !w || !z) {
        parallel = false;
        break;
      }
      const difference = (rhumbAngle(u, v) - rhumbAngle(w, z)) / RAD;
      const deviation = Math.abs(difference - Math.round(difference / 180) * 180);
      if (deviation > 1e-10) {
        parallel = false;
        break;
      }
    }
    out.values[i] = Number(parallel);
    valid(out.validity, i);
  }
  return out;
}
