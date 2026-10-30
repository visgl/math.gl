// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {angle, geographic, type Position} from './math';
import type {MapPolygonEdge} from './map-layout';
export type ConstraintOwner = readonly [ring: number, edge: number] | null;
/** Attribute boolean output to indexed input constraints before final map
 * projection/resampling. Restore vertices erased by collinear-edge merging.
 * Ambiguous ancestry rejects; target rendering coordinates never identify an
 * original source segment. The caller owns this computational clipping chart.
 */
export function tracePolygonConstraints(
  input: Position[][],
  output: Position[][],
  tolerance = 1e-10,
  priorities?: MapPolygonEdge[][],
  accept?: (point: Position) => boolean
) {
  const constraints = input.flatMap((ring, r) =>
    ring.slice(0, -1).map((a, i) => ({a, b: ring[i + 1], r, i}))
  );
  let work = 0;
  const tick = () => {
    if (++work > 20000000) throw new Error('Polygon constraint work limit exceeded');
  };
  const fraction = (p: Position, a: Position, b: Position) => {
    const dx = b[0] - a[0],
      dy = b[1] - a[1],
      l = dx * dx + dy * dy;
    return l ? ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l : NaN;
  };
  const on = (p: Position, a: Position, b: Position) => {
    tick();
    const t = fraction(p, a, b),
      length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return (
      length > 0 &&
      t >= -tolerance &&
      t <= 1 + tolerance &&
      Math.hypot(p[0] - a[0] - t * (b[0] - a[0]), p[1] - a[1] - t * (b[1] - a[1])) <=
        tolerance * Math.max(1, length)
    );
  };
  type Box = readonly [number, number, number, number];
  type Node = {box: Box; ids?: number[]; left?: Node; right?: Node};
  const boxes: Box[] = constraints.map(c => [
    Math.min(c.a[0], c.b[0]),
    Math.min(c.a[1], c.b[1]),
    Math.max(c.a[0], c.b[0]),
    Math.max(c.a[1], c.b[1])
  ]);
  const build = (ids: number[]): Node => {
    const box: [number, number, number, number] = [Infinity, Infinity, -Infinity, -Infinity];
    for (const id of ids) {
      tick();
      const b = boxes[id];
      box[0] = Math.min(box[0], b[0]);
      box[1] = Math.min(box[1], b[1]);
      box[2] = Math.max(box[2], b[2]);
      box[3] = Math.max(box[3], b[3]);
    }
    if (ids.length <= 16) return {box, ids};
    const axis = box[2] - box[0] >= box[3] - box[1] ? 0 : 1;
    ids.sort((a, b) => {
      tick();
      return boxes[a][axis] + boxes[a][axis + 2] - boxes[b][axis] - boxes[b][axis + 2];
    });
    const middle = Math.floor(ids.length / 2);
    return {box, left: build(ids.slice(0, middle)), right: build(ids.slice(middle))};
  };
  const root = build(constraints.map((_, i) => i));
  const padding = tolerance * Math.max(1, root.box[2] - root.box[0], root.box[3] - root.box[1]);
  const query = (a: Position, b: Position) => {
    const box: Box = [
        Math.min(a[0], b[0]) - padding,
        Math.min(a[1], b[1]) - padding,
        Math.max(a[0], b[0]) + padding,
        Math.max(a[1], b[1]) + padding
      ],
      ids: number[] = [];
    const overlaps = (b: Box) =>
      b[0] <= box[2] && b[2] >= box[0] && b[1] <= box[3] && b[3] >= box[1];
    const visit = (node: Node) => {
      tick();
      if (!overlaps(node.box)) return;
      if (node.ids) {
        for (const id of node.ids) {
          tick();
          if (overlaps(boxes[id])) ids.push(id);
        }
      } else {
        visit(node.left!);
        visit(node.right!);
      }
    };
    visit(root);
    return ids.map(id => constraints[id]);
  };
  const rings: Position[][] = [],
    owners: ConstraintOwner[][] = [];
  for (const ring of output) {
    const points: Position[] = [];
    for (let i = 1; i < ring.length; i++) {
      const a = ring[i - 1],
        b = ring[i];
      if (a.every((v, k) => v === b[k])) continue;
      const breaks: {t: number; p: Position}[] = [{t: 0, p: a}];
      for (const c of query(a, b))
        if (on(c.a, a, b) && (!accept || accept(c.a))) {
          const t = fraction(c.a, a, b);
          if (t > 1e-12 && t < 1 - 1e-12) breaks.push({t, p: c.a});
        }
      breaks.sort((a, b) => a.t - b.t);
      for (const item of breaks)
        if (
          !points.length ||
          Math.hypot(...points[points.length - 1].map((v, k) => v - item.p[k])) > 1e-14
        )
          points.push([...item.p]);
    }
    if (points.length < 3) continue;
    points.push([...points[0]]);
    const tags: ConstraintOwner[] = [];
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1],
        b = points[i];
      let candidates = query(a, b).filter(c => on(a, c.a, c.b) && on(b, c.a, c.b));
      const same = (p: Position, q: Position) =>
        Math.hypot(...p.map((v, k) => v - q[k])) <=
        64 * Number.EPSILON * Math.max(1, ...p.map(Math.abs), ...q.map(Math.abs));
      const exact = candidates.filter(
        c => (same(a, c.a) && same(b, c.b)) || (same(a, c.b) && same(b, c.a))
      );
      if (exact.length) candidates = exact;
      if (candidates.some(c => priorities?.[c.r]?.[c.i]?.kind === 'source-boundary'))
        candidates = candidates.filter(c => priorities?.[c.r]?.[c.i]?.kind === 'source-boundary');
      if (candidates.length > 1) {
        const score = (c: (typeof candidates)[number]) =>
          Math.max(
            ...[a, b].map(p => {
              const t = Math.min(1, Math.max(0, fraction(p, c.a, c.b)));
              return Math.hypot(
                p[0] - c.a[0] - t * (c.b[0] - c.a[0]),
                p[1] - c.a[1] - t * (c.b[1] - c.a[1])
              );
            })
          );
        candidates.sort((a, b) => score(a) - score(b));
        const epsilon = 64 * Number.EPSILON * Math.max(1, ...a.map(Math.abs), ...b.map(Math.abs));
        if (score(candidates[1]) - score(candidates[0]) > epsilon) candidates = [candidates[0]];
        else if (Math.hypot(a[0] - b[0], a[1] - b[1]) <= 2 * epsilon) candidates = [];
        else throw new Error('Ambiguous polygon clipping constraint ancestry');
      }
      tags.push(candidates.length ? [candidates[0].r, candidates[0].i] : null);
    }
    rings.push(points);
    owners.push(tags);
  }
  return {rings, owners};
}
/** Compose directed fractions through a known parent edge; never search raw
 * input geometry for an original segment after resampling or projection. */
export function composePolygonEdge(
  parent: MapPolygonEdge,
  a: Position,
  b: Position,
  start: Position,
  end: Position
): MapPolygonEdge {
  if (parent.kind !== 'source-boundary') return {...parent};
  const v = geographic(a),
    length = angle(v, geographic(b));
  const parameter = (p: Position) => (length ? Math.min(1, angle(v, geographic(p)) / length) : 0);
  return {
    ...parent,
    t0: parent.t0 + parameter(start) * (parent.t1 - parent.t0),
    t1: parent.t0 + parameter(end) * (parent.t1 - parent.t0)
  };
}
