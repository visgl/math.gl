// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original curve-aware chart-boundary graph reconstruction. No upstream clipping implementation copied.
import {
  ANGULAR_TOLERANCE,
  Context,
  createEdges,
  cut,
  root,
  same,
  shift,
  slice,
  straight
} from './edge';
import type {Edge} from './edge';
import {GeographicSeamError} from './types';
import type {
  GeographicPolygonRing,
  GeographicSeamOptions,
  GeographicSeamPolygon,
  GeographicSeamRing
} from './types';

type Ring = {
  edges: Edge[];
  membership: Edge[];
  min: number;
  max: number;
  pole?: 'north' | 'south';
  poleAttributes: number[];
};
function winding(
  edges: readonly Edge[],
  point: readonly number[],
  context: Context,
  side?: 'left' | 'right',
  generatedBoundary = true
): {value: number; boundary: boolean} {
  let value = 0,
    boundary = false;
  for (const edge of edges) {
    context.tick();
    const a = edge.a,
      b = edge.b;
    if (a[1] === b[1]) {
      if (
        (generatedBoundary || edge.source) &&
        point[1] === a[1] &&
        point[0] >= Math.min(a[0], b[0]) &&
        point[0] <= Math.max(a[0], b[0])
      )
        boundary = true;
      continue;
    }
    if (point[1] >= Math.min(a[1], b[1]) && point[1] <= Math.max(a[1], b[1])) {
      const t = root(edge, 1, point[1], context),
        x = edge.sample(t)[0];
      if ((generatedBoundary || edge.source) && Math.abs(x - point[0]) <= ANGULAR_TOLERANCE)
        boundary = true;
      if (a[1] > point[1] !== b[1] > point[1] && (side === 'left' ? x >= point[0] : x > point[0]))
        value += b[1] > a[1] ? 1 : -1;
    }
  }
  return {value, boundary};
}
function contains(
  ring: Ring,
  p: readonly number[],
  context: Context,
  side?: 'left' | 'right'
): boolean {
  context.tick();
  for (let k = Math.ceil((ring.min - p[0]) / 360); k <= Math.floor((ring.max - p[0]) / 360); k++) {
    context.tick();
    if (winding(ring.membership, [p[0] + 360 * k, p[1]], context, side, false).value !== 0)
      return true;
  }
  return false;
}
function filled(
  rings: Ring[],
  p: readonly number[],
  context: Context,
  side?: 'left' | 'right'
): boolean {
  return (
    contains(rings[0], p, context, side) && !rings.slice(1).some(r => contains(r, p, context, side))
  );
}
function prepare(input: GeographicPolygonRing, index: number, context: Context): Ring {
  const positions = context.read(input.positions);
  if (
    positions.length > 1 &&
    positions[0][0] === positions[positions.length - 1][0] &&
    positions[0][1] === positions[positions.length - 1][1]
  ) {
    if (!same(positions[0], positions[positions.length - 1]))
      throw new GeographicSeamError('input', 'Closing polygon attributes must match');
    positions.pop();
  }
  if (new Set(positions.map(p => `${p[0]},${p[1]}`)).size < 3)
    throw new GeographicSeamError('topology', 'Polygon ring needs three distinct positions');
  const turns = input.longitudeTurns
    ? Array.from(input.longitudeTurns)
    : new Array(positions.length).fill(0);
  if (turns.length !== positions.length)
    throw new GeographicSeamError('input', 'Expected a turn count per ring edge');
  const edges: Edge[] = [];
  let cursor = positions[0];
  for (let i = 0; i < positions.length; i++) {
    const end = positions[(i + 1) % positions.length];
    const pieces = createEdges(cursor, end, positions[i], i, index, turns[i], context);
    if (edges.length && !same(cursor, pieces[0].a)) {
      if (Math.abs(cursor[1]) !== 90 || cursor[1] !== pieces[0].a[1])
        throw new GeographicSeamError('precision', 'Discontinuous ring edge');
      edges.push(straight(cursor, pieces[0].a));
    }
    for (const edge of pieces) {
      if (edge.a[0] === edge.b[0] && edge.a[1] === edge.b[1]) {
        if (!same(edge.a, edge.b))
          throw new GeographicSeamError('topology', 'Zero-length polygon edge changes attributes');
      } else edges.push(edge);
    }
    cursor = pieces[pieces.length - 1].b;
  }
  if (!edges.length) throw new GeographicSeamError('topology', 'Empty polygon boundary');
  const first = edges[0].a;
  if (Math.abs(first[1]) === 90) {
    const closing = first.slice();
    closing[0] += 360 * Math.round((cursor[0] - first[0]) / 360);
    if (!same(cursor, closing)) edges.push(straight(cursor, closing));
    cursor = closing;
  }
  const turnsAround = Math.round((cursor[0] - first[0]) / 360);
  if (
    Math.abs(cursor[0] - first[0] - 360 * turnsAround) > ANGULAR_TOLERANCE ||
    cursor[1] !== first[1] ||
    Math.abs(turnsAround) > 1
  )
    throw new GeographicSeamError('topology', 'Unsupported ring winding');
  let min = Infinity,
    max = -Infinity;
  for (const e of edges) {
    min = Math.min(min, e.a[0], e.b[0]);
    max = Math.max(max, e.a[0], e.b[0]);
  }
  if (max - min > 360 + ANGULAR_TOLERANCE)
    throw new GeographicSeamError('topology', 'Ring exceeds a single longitude chart');
  const membership = edges.slice();
  const poleAttributes = input.poleAttributes ? Array.from(input.poleAttributes) : [];
  if (turnsAround !== 0) {
    if (
      !['north', 'south'].includes(input.pole) ||
      edges.some(e => Math.abs(e.a[1]) === 90 || (e.b[0] - e.a[0]) * turnsAround < 0)
    )
      throw new GeographicSeamError(
        'topology',
        'Polar rings require an explicit pole and monotone longitude winding'
      );
    if (poleAttributes.length !== context.size - 2 || !poleAttributes.every(Number.isFinite))
      throw new GeographicSeamError(
        'input',
        'Explicit poleAttributes are required for polar attributes'
      );
    const latitude = input.pole === 'north' ? 90 : -90;
    const a = [cursor[0], latitude, ...poleAttributes],
      b = [first[0], latitude, ...poleAttributes];
    membership.push(straight(cursor, a), straight(a, b), straight(b, first));
  } else if (input.pole !== undefined || poleAttributes.length) {
    throw new GeographicSeamError(
      'input',
      'Pole selection applies only to once-winding polar rings'
    );
  }
  return {edges, membership, min, max, pole: input.pole, poleAttributes};
}
function reverse(edge: Edge): Edge {
  return {
    a: edge.b,
    b: edge.a,
    sample: t => edge.sample(1 - t),
    source: edge.source && {
      ...edge.source,
      startFraction: edge.source.endFraction,
      endFraction: edge.source.startFraction
    }
  };
}
function interior(edges: Edge[], context: Context): {point: number[]; sign: number} {
  const ys = Array.from(new Set(edges.flatMap(e => [e.a[1], e.b[1]]))).sort((a, b) => a - b);
  let index = 1;
  for (let i = 2; i < ys.length; i++) if (ys[i] - ys[i - 1] > ys[index] - ys[index - 1]) index = i;
  if (ys.length < 2 || ys[index] - ys[index - 1] < 8 * ANGULAR_TOLERANCE)
    throw new GeographicSeamError('precision', 'Polygon height below the topology budget');
  const y = (ys[index] + ys[index - 1]) / 2,
    xs: number[] = [];
  for (const edge of edges) {
    context.tick();
    if (edge.a[1] > y !== edge.b[1] > y) xs.push(edge.sample(root(edge, 1, y, context))[0]);
  }
  xs.sort((a, b) => a - b);
  for (let i = 1; i < xs.length; i++) {
    context.tick();
    if (xs[i] - xs[i - 1] < 8 * ANGULAR_TOLERANCE) continue;
    const point = [(xs[i] + xs[i - 1]) / 2, y],
      w = winding(edges, point, context);
    if (w.value && !w.boundary) {
      if (Math.abs(w.value) !== 1)
        throw new GeographicSeamError('topology', 'Non-simple polygon winding');
      return {point, sign: Math.sign(w.value)};
    }
  }
  throw new GeographicSeamError('topology', 'No resolvable polygon interior');
}
function output(edges: Edge[], sign: number, context: Context): GeographicSeamRing {
  if (interior(edges, context).sign !== sign) edges = edges.slice().reverse().map(reverse);
  context.addVertices(edges.length + 1);
  return {
    positions: new Float64Array([...edges.flatMap(e => e.a), ...edges[0].a]),
    edges: edges.map(e => e.source && {...e.source})
  };
}

/** Split simple geographic polygons into one longitude chart. Input is one outer
 * ring followed by disjoint contained holes; this is not a polygon repair API.
 * Exact curve roots and a boundary graph preserve components, holes and source
 * fractions. Polar interiors require an explicit once-winding pole selection.
 */
export function splitGeographicPolygon(
  inputs: readonly GeographicPolygonRing[],
  options: GeographicSeamOptions
): GeographicSeamPolygon[] {
  const context = new Context(options);
  if (!inputs.length) return [];
  context.tick(inputs.length);
  const rings = inputs.map((ring, i) => prepare(ring, i, context));
  const graph: Edge[] = [],
    nodes = new Map<string, {p: number[]; edges: number[]}>();
  const key = (p: readonly number[]) => `${p[0]},${p[1]}`;
  const add = (edge: Edge): void => {
    context.tick();
    if (edge.a[0] === edge.b[0] && edge.a[1] === edge.b[1]) return;
    const id = graph.length;
    graph.push(edge);
    for (const p of [edge.a, edge.b]) {
      const k = key(p),
        node = nodes.get(k);
      if (node) {
        if (!same(node.p, p))
          throw new GeographicSeamError(
            'topology',
            'Touching boundaries have inconsistent attributes'
          );
        node.edges.push(id);
      } else nodes.set(k, {p, edges: [id]});
    }
  };
  const pieces: Edge[] = [];
  const meridians = new Map<number, Set<number>>();
  for (const ring of rings)
    for (const original of ring.edges)
      for (const {edge} of cut(original, context)) {
        pieces.push(edge);
        if (edge.a[0] === edge.b[0]) {
          const events = meridians.get(edge.a[0]) || new Set<number>();
          events.add(edge.a[1]);
          events.add(edge.b[1]);
          meridians.set(edge.a[0], events);
        }
      }
  for (const edge of pieces) {
    if (edge.a[0] !== edge.b[0]) {
      add(edge);
      continue;
    }
    // Periodic full-width aliases can coincide at an interior meridian, not
    // just at the chart seam. Split partial overlaps before testing both sides.
    const fractions = [0, 1];
    const latitudes = new Map<number, number>();
    for (const y of meridians.get(edge.a[0])) {
      context.tick();
      if (y > Math.min(edge.a[1], edge.b[1]) && y < Math.max(edge.a[1], edge.b[1])) {
        const fraction = root(edge, 1, y, context);
        if (latitudes.has(fraction) && latitudes.get(fraction) !== y)
          throw new GeographicSeamError('precision', 'Unresolvable meridian event separation');
        fractions.push(fraction);
        latitudes.set(fraction, y);
      }
    }
    fractions.sort((a, b) => a - b);
    for (let i = 1; i < fractions.length; i++) {
      context.tick();
      const piece = slice(edge, fractions[i - 1], fractions[i]);
      if (latitudes.has(fractions[i - 1])) piece.a[1] = latitudes.get(fractions[i - 1]);
      if (latitudes.has(fractions[i])) piece.b[1] = latitudes.get(fractions[i]);
      if (fractions.length > 2) context.addVertices(2);
      const x = piece.a[0],
        latitude = (piece.a[1] + piece.b[1]) / 2;
      const seam = x === context.left;
      const left = filled(rings, [x, latitude], context, seam ? 'right' : 'left');
      const right = filled(
        rings,
        [seam ? context.right : x, latitude],
        context,
        seam ? 'left' : 'right'
      );
      if (left && right) continue;
      if (!left && !right)
        throw new GeographicSeamError('topology', 'Unresolvable meridian-coincident boundary');
      add(seam && !left ? shift(piece, 360) : piece);
    }
  }
  const pole = rings[0].pole;
  if (pole && !rings.slice(1).some(r => r.pole === pole)) {
    const latitude = pole === 'north' ? 90 : -90;
    add(
      straight(
        [context.left, latitude, ...rings[0].poleAttributes],
        [context.right, latitude, ...rings[0].poleAttributes]
      )
    );
  }
  for (const boundary of [context.left, context.right]) {
    const boundaryNodes = Array.from(nodes.values())
      .filter(n => n.p[0] === boundary)
      .sort((a, b) => a.p[1] - b.p[1]);
    // Snapshot before connectors are added. Source-aligned boundary edges are
    // already present and must not acquire duplicate generated edges.
    const aligned = graph.filter(e => e.a[0] === boundary && e.b[0] === boundary);
    for (let i = 1; i < boundaryNodes.length; i++) {
      context.tick();
      const a = boundaryNodes[i - 1].p,
        b = boundaryNodes[i].p,
        latitude = (a[1] + b[1]) / 2;
      if (latitude === a[1] || latitude === b[1])
        throw new GeographicSeamError('precision', 'Unresolvable seam event separation');
      if (
        filled(
          rings,
          [boundary, latitude],
          context,
          boundary === context.left ? 'right' : 'left'
        ) &&
        !aligned.some(e => {
          context.tick();
          return latitude > Math.min(e.a[1], e.b[1]) && latitude < Math.max(e.a[1], e.b[1]);
        })
      )
        add(straight(a, b));
    }
  }
  for (const node of nodes.values())
    if (node.edges.length !== 2)
      throw new GeographicSeamError(
        'topology',
        'Touching, coincident or unresolved polygon boundaries'
      );
  const used = new Set<number>(),
    cycles: Edge[][] = [];
  for (let seed = 0; seed < graph.length; seed++) {
    if (used.has(seed)) continue;
    const cycle: Edge[] = [],
      start = key(graph[seed].a);
    let id = seed,
      current = start;
    do {
      context.tick();
      if (used.has(id)) throw new GeographicSeamError('topology', 'Non-simple boundary graph');
      used.add(id);
      const edge = key(graph[id].a) === current ? graph[id] : reverse(graph[id]);
      cycle.push(edge);
      current = key(edge.b);
      const adjacent = nodes.get(current).edges;
      id = adjacent[0] === id ? adjacent[1] : adjacent[0];
    } while (current !== start);
    if (cycle.length < 3) throw new GeographicSeamError('topology', 'Degenerate polygon component');
    cycles.push(cycle);
  }
  const parents = cycles.map((cycle, i) => {
    const containers: number[] = [];
    for (let j = 0; j < cycles.length; j++)
      if (j !== i) {
        const w = winding(cycles[j], cycle[0].a, context);
        if (w.boundary) throw new GeographicSeamError('topology', 'Polygon components touch');
        if (w.value) containers.push(j);
      }
    if (containers.length > 1)
      throw new GeographicSeamError('topology', 'Nested holes or overlapping polygon components');
    return containers[0];
  });
  const sign = interior(rings[0].membership, context).sign;
  const result: GeographicSeamPolygon[] = [],
    groups = new Map<number, GeographicSeamPolygon>();
  for (let i = 0; i < cycles.length; i++)
    if (parents[i] === undefined) {
      // A closed hole outside the outer boundary must not become an island.
      if (cycles[i].every(e => e.source && e.source.ringIndex !== 0))
        throw new GeographicSeamError('topology', 'Hole is outside the outer ring');
      const polygon = {rings: [output(cycles[i], sign, context)]};
      result.push(polygon);
      groups.set(i, polygon);
    }
  for (let i = 0; i < cycles.length; i++)
    if (parents[i] !== undefined) {
      const group = groups.get(parents[i]);
      if (!group) throw new GeographicSeamError('topology', 'Nested polygon rings');
      group.rings.push(output(cycles[i], -sign, context));
    }
  return result;
}
