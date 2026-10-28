// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GeoArrowArray, GeoArrowColumn} from './geoarrow/types';
import {isGeoArrowValueValid} from './geoarrow/layout';
import {getGeoArrowRowBounds} from './geoarrow/kernels';

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
