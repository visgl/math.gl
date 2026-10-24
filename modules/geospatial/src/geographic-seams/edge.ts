// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original bounded curve/root and longitude-chart helpers. Solvers retain their own upstream notices.
import {EllipsoidGeodesic} from '../ellipsoid-geodesic';
import {GeodesicPath} from '../geodesic-path';
import {RhumbPath} from '../rhumb-path';
import {WGS84_RADIUS_X, WGS84_RADIUS_Z} from '../constants';
import {GeographicSeamError} from './types';
import type {GeographicSeamOptions, GeographicEdgeSource} from './types';

export const ANGULAR_TOLERANCE = 1e-10;
const MAX_LONGITUDE = 65536;
let wgs84: EllipsoidGeodesic | undefined;
function getDefaultGeodesic(): EllipsoidGeodesic {
  if (!wgs84)
    wgs84 = new EllipsoidGeodesic({semiMajorAxis: WGS84_RADIUS_X, semiMinorAxis: WGS84_RADIUS_Z});
  return wgs84;
}
export type Edge = {
  a: number[];
  b: number[];
  sample: (fraction: number) => number[];
  source: GeographicEdgeSource | null;
};
export class Context {
  readonly size: number;
  readonly right: number;
  readonly left: number;
  readonly iterations: number;
  private work = 0;
  private vertices = 0;
  readonly maxVertices: number;
  private readonly maxWork: number;
  constructor(readonly options: GeographicSeamOptions) {
    this.options = {...options};
    this.size = this.options.size ?? 2;
    this.right = this.options.seamLongitude ?? 180;
    this.left = this.right - 360;
    this.iterations = this.options.maxIterations ?? 64;
    this.maxVertices = this.options.maxVertices ?? 65536;
    this.maxWork = this.options.maxWork ?? 1000000;
    if (
      !['linear', 'geodesic', 'rhumb'].includes(this.options.edgeModel) ||
      (this.options.linearLongitude !== undefined &&
        !['supplied', 'shortest'].includes(this.options.linearLongitude)) ||
      !Number.isSafeInteger(this.size) ||
      this.size < 2 ||
      this.size > 64 ||
      !Number.isFinite(this.right) ||
      Math.abs(this.right) > MAX_LONGITUDE ||
      !Number.isSafeInteger(this.maxVertices) ||
      this.maxVertices < 1 ||
      this.maxVertices > 0xffffffff ||
      !Number.isSafeInteger(this.maxWork) ||
      this.maxWork < 1 ||
      this.maxWork > 1e8 ||
      !Number.isInteger(this.iterations) ||
      this.iterations < 1 ||
      this.iterations > 128
    )
      throw new GeographicSeamError('input', 'Invalid seam model, dimensions or limits');
  }
  tick(n = 1): void {
    this.work += n;
    if (this.work > this.maxWork) throw new GeographicSeamError('limit', 'Exceeded maxWork');
  }
  addVertices(n: number): void {
    this.vertices += n;
    if (this.vertices > this.maxVertices)
      throw new GeographicSeamError('limit', 'Exceeded maxVertices');
  }
  read(input: ArrayLike<number>): number[][] {
    if (!Number.isSafeInteger(input.length) || input.length < 0 || input.length % this.size)
      throw new GeographicSeamError('input', 'Invalid packed geographic positions or vertex limit');
    this.addVertices(input.length / this.size);
    const result: number[][] = [];
    for (let i = 0; i < input.length; i += this.size) {
      this.tick();
      const p = Array.from({length: this.size}, (_, k) => input[i + k]);
      if (!p.every(Number.isFinite) || Math.abs(p[0]) > MAX_LONGITUDE || Math.abs(p[1]) > 90)
        throw new GeographicSeamError(
          'input',
          'Expected finite positions, latitude in [-90,90], |longitude| <= 65536'
        );
      result.push(p);
    }
    return result;
  }
}
export function same(a: readonly number[], b: readonly number[]): boolean {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}
function shortDifference(delta: number): number {
  const value = delta % 360;
  return value > 180 ? value - 360 : value < -180 ? value + 360 : value;
}
/** Exact binary64 opposite-meridian predicate; an angular epsilon would turn
 * unique near-pole routes into pole passages. Retain subtraction's low part.
 */
function oppositeMeridians(a: number, b: number): boolean {
  const x = shortDifference(b),
    y = -shortDifference(a),
    sum = x + y,
    virtual = sum - x;
  return Math.abs(sum) === 180 && x - (sum - virtual) + (y - virtual) === 0;
}
export function worldAt(x: number, context: Context): number {
  let world = Math.floor((x - context.right) / 360) + 1;
  // Correct quotient rounding without adding a large offset to a tiny angle.
  while (x < context.right + 360 * (world - 1)) world--;
  while (x >= context.right + 360 * world) world++;
  return world;
}
export function chartPoint(point: number[], world: number, context: Context): number[] {
  const p = point.slice();
  p[0] -= 360 * world;
  const onLeft = point[0] === context.right + 360 * (world - 1);
  const onRight = point[0] === context.right + 360 * world;
  if (onLeft) p[0] = context.left;
  if (onRight) p[0] = context.right;
  if ((!onLeft && p[0] === context.left) || (!onRight && p[0] === context.right))
    throw new GeographicSeamError(
      'precision',
      'Longitude displacement cannot be represented in this chart'
    );
  return p;
}
export function straight(a: number[], b: number[]): Edge {
  return {a, b, source: null, sample: t => a.map((x, i) => x * (1 - t) + b[i] * t)};
}
export function slice(edge: Edge, lo: number, hi: number): Edge {
  const a = lo === 0 ? edge.a : lo === 1 ? edge.b : edge.sample(lo);
  const b = hi === 0 ? edge.a : hi === 1 ? edge.b : edge.sample(hi);
  const source = edge.source && {
    ...edge.source,
    startFraction:
      edge.source.startFraction + (edge.source.endFraction - edge.source.startFraction) * lo,
    endFraction:
      edge.source.startFraction + (edge.source.endFraction - edge.source.startFraction) * hi
  };
  return {
    a,
    b,
    source,
    sample: t => (t === 0 ? a.slice() : t === 1 ? b.slice() : edge.sample(lo + (hi - lo) * t))
  };
}
export function shift(edge: Edge, delta: number): Edge {
  const move = (p: number[]): number[] => [p[0] + delta, ...p.slice(1)];
  return {
    a: move(edge.a),
    b: move(edge.b),
    source: edge.source && {...edge.source, longitudeShift: edge.source.longitudeShift + delta},
    sample: t => move(edge.sample(t))
  };
}

/** Edges are split at latitude extrema and exact meridian pole passages. Both
 * coordinates are monotone in each returned curve piece, enabling bounded roots.
 */
export function createEdges(
  start: number[],
  end: number[],
  originalStart: number[],
  edgeIndex: number,
  ringIndex: number,
  turns: number,
  context: Context,
  splitLatitude = true
): Edge[] {
  context.tick();
  const {edgeModel, linearLongitude = 'supplied'} = context.options;
  if (
    !Number.isSafeInteger(turns) ||
    Math.abs(turns) > 128 ||
    (turns !== 0 && edgeModel !== 'rhumb')
  )
    throw new GeographicSeamError('input', 'Turns require rhumb edges and |turns| <= 128');
  const offset = start[0] - originalStart[0];
  const source: GeographicEdgeSource = {
    ringIndex,
    edgeIndex,
    startFraction: 0,
    endFraction: 1,
    longitudeShift: offset
  };
  const first = start.slice(),
    last = end.slice();
  let horizontal: (t: number) => number[];
  let critical: number | undefined;
  let pole: {fraction: number; latitude: number} | undefined;
  if (edgeModel === 'linear') {
    last[0] =
      first[0] +
      (linearLongitude === 'shortest'
        ? shortDifference(end[0] - originalStart[0])
        : end[0] - originalStart[0]);
    horizontal = t => [first[0] * (1 - t) + last[0] * t, first[1] * (1 - t) + last[1] * t];
  } else if (edgeModel === 'rhumb') {
    context.tick(2); // Inverse and reusable-line setup.
    const path = new RhumbPath(first.slice(0, 2), last.slice(0, 2), {
      rhumb: context.options.rhumb,
      longitudeTurns: turns
    });
    last[0] = path.end[0];
    horizontal = t => path.sample(t);
  } else {
    context.tick(3); // Path inverse/line setup and the bearing query below.
    const solver = context.options.geodesic || getDefaultGeodesic();
    const path = new GeodesicPath(first.slice(0, 2), last.slice(0, 2), {geodesic: solver});
    last[0] = path.end[0];
    horizontal = t => path.sample(t);
    if (Math.abs(first[1]) === 90) first[0] = last[0];
    if (Math.abs(last[1]) === 90) last[0] = first[0];
    const inverse = solver.inverse(start[1], start[0], end[1], end[0]);
    const c1 = Math.cos((inverse.azi1 * Math.PI) / 180),
      c2 = Math.cos((inverse.azi2 * Math.PI) / 180);
    if (
      path.length > 0 &&
      oppositeMeridians(originalStart[0], end[0]) &&
      (inverse.azi1 === 0 || Math.abs(inverse.azi1) === 180) &&
      Math.abs(first[1]) !== 90 &&
      Math.abs(last[1]) !== 90
    ) {
      const latitude = c1 > 0 ? 90 : -90;
      context.tick(2); // Pole distance and its position check.
      const fraction = solver.inverse(start[1], start[0], latitude, start[0]).s12 / path.length;
      if (
        fraction > 0 &&
        fraction < 1 &&
        Math.abs(path.sample(fraction)[1] - latitude) < ANGULAR_TOLERANCE
      )
        pole = {fraction, latitude};
    } else if (splitLatitude && c1 * c2 < 0 && path.length > 0) {
      context.tick();
      const line = solver.line(start[1], start[0], inverse.azi1, {unrollLongitude: true});
      let lo = 0,
        hi = 1;
      for (let i = 0; i < 64; i++) {
        context.tick();
        const mid = (lo + hi) / 2;
        const c = Math.cos((line.position(path.length * mid).azi2 * Math.PI) / 180);
        if (c > 0 === c1 > 0) lo = mid;
        else hi = mid;
      }
      critical = (lo + hi) / 2;
    }
  }
  if (Math.abs(last[0]) > MAX_LONGITUDE)
    throw new GeographicSeamError('input', 'Unrolled longitude exceeds the declared seam profile');
  const sample = (t: number): number[] => {
    context.tick();
    const p = t === 0 ? first.slice(0, 2) : t === 1 ? last.slice(0, 2) : horizontal(t);
    for (let i = 2; i < first.length; i++) p[i] = first[i] * (1 - t) + last[i] * t;
    if (!p.every(Number.isFinite))
      throw new GeographicSeamError('precision', 'Nonfinite edge sample');
    return p;
  };
  const edge: Edge = {a: first, b: last, source, sample};
  if (pole) {
    const incoming = slice(edge, 0, pole.fraction),
      outgoing = slice(edge, pole.fraction, 1);
    incoming.b = [first[0], pole.latitude, ...sample(pole.fraction).slice(2)];
    outgoing.a = [last[0], pole.latitude, ...incoming.b.slice(2)];
    const incomingSample = incoming.sample,
      outgoingSample = outgoing.sample;
    incoming.sample = t => (t === 1 ? incoming.b.slice() : incomingSample(t));
    outgoing.sample = t => (t === 0 ? outgoing.a.slice() : outgoingSample(t));
    return [incoming, straight(incoming.b, outgoing.a), outgoing];
  }
  return critical !== undefined && critical > 0 && critical < 1
    ? [slice(edge, 0, critical), slice(edge, critical, 1)]
    : [edge];
}

/** The root must meet latitude and physical longitude budgets; exhausted roots
 * reject rather than silently promote an approximate chord intersection.
 */
export function root(edge: Edge, axis: 0 | 1, value: number, context: Context): number {
  if (edge.a[axis] === value) return 0;
  if (edge.b[axis] === value) return 1;
  if (
    !(value > Math.min(edge.a[axis], edge.b[axis]) && value < Math.max(edge.a[axis], edge.b[axis]))
  )
    throw new GeographicSeamError('precision', 'Unbracketed seam root');
  let lo = 0,
    hi = 1,
    a = edge.a,
    b = edge.b;
  for (let i = 0; i < context.iterations; i++) {
    context.tick();
    const t = (lo + hi) / 2,
      p = edge.sample(t);
    if (p[axis] === value) return t;
    if (
      hi - lo <= 4 * Number.EPSILON &&
      Math.abs(a[0] - b[0]) *
        Math.max(
          Math.abs(Math.cos((a[1] * Math.PI) / 180)),
          Math.abs(Math.cos((b[1] * Math.PI) / 180))
        ) <=
        ANGULAR_TOLERANCE &&
      Math.abs(a[1] - b[1]) <= ANGULAR_TOLERANCE
    )
      return t;
    if (t === lo || t === hi) break;
    if (p[axis] < value === edge.a[axis] < edge.b[axis]) {
      lo = t;
      a = p;
    } else {
      hi = t;
      b = p;
    }
  }
  throw new GeographicSeamError('precision', 'Seam root exhausted its precision/iteration budget');
}
export function cut(edge: Edge, context: Context): {edge: Edge; world: number}[] {
  const low = Math.min(edge.a[0], edge.b[0]),
    high = Math.max(edge.a[0], edge.b[0]);
  const fractions = [0, 1];
  for (let k = worldAt(low, context); context.right + 360 * k < high; k++) {
    context.tick();
    fractions.push(root(edge, 0, context.right + 360 * k, context));
    if (fractions.length > context.maxVertices)
      throw new GeographicSeamError('limit', 'Too many seam crossings');
  }
  fractions.sort((a, b) => a - b);
  const result: {edge: Edge; world: number}[] = [];
  for (let i = 1; i < fractions.length; i++) {
    context.tick();
    context.addVertices(2);
    const piece = slice(edge, fractions[i - 1], fractions[i]);
    // Force only computed roots, never nearby original vertices, to the seam.
    for (const p of [piece.a, piece.b]) {
      const k = Math.round((p[0] - context.right) / 360),
        boundary = context.right + 360 * k;
      if ((fractions[i - 1] !== 0 && p === piece.a) || (fractions[i] !== 1 && p === piece.b))
        p[0] = boundary;
    }
    const onBoundary = (x: number): boolean =>
      x === context.right + 360 * Math.round((x - context.right) / 360);
    const reference = !onBoundary(piece.a[0])
      ? piece.a[0]
      : !onBoundary(piece.b[0])
        ? piece.b[0]
        : (piece.a[0] + piece.b[0]) / 2;
    const world = worldAt(reference, context);
    const shifted = shift(piece, -360 * world);
    shifted.a = chartPoint(piece.a, world, context);
    shifted.b = chartPoint(piece.b, world, context);
    const previousSample = shifted.sample;
    shifted.sample = t =>
      t === 0 ? shifted.a.slice() : t === 1 ? shifted.b.slice() : previousSample(t);
    result.push({edge: shifted, world});
  }
  return result;
}
