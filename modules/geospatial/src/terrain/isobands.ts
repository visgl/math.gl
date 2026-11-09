// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {HeightField} from './height-field';

export type TerrainIsobands = {
  /** World XY polygon footprint vertices. */
  positions: Float64Array;
  indices: Uint32Array;
  offsets: Uint32Array;
  bandIndices: Uint32Array;
  /** -1 for outer rings; otherwise the containing outer ring index. */
  parents: Int32Array;
  levels: Float64Array;
  heightReference: string;
};
type Vertex = {x: number; y: number; z: number; key: string; support: string[]};

/** Polygonize intervals of the regular triangle surface. Adjacent conforming tiles
 * share exact XY samples; mixed-resolution seams require prior reconciliation.
 * Incomplete triangles are omitted. Rings include domain and nodata boundaries.
 */
export function createTerrainIsobands(
  fields: readonly HeightField[],
  levels: readonly number[],
  options: {
    maxTriangles?: number;
    maxVertices?: number;
    maxEdges?: number;
    maxTests?: number;
    maxLevels?: number;
  } = {}
): TerrainIsobands {
  const maxLevels = options.maxLevels ?? 256;
  if (!Number.isSafeInteger(maxLevels) || maxLevels < 2 || levels.length > maxLevels)
    throw new Error('Isoband level capacity exceeded');
  if (
    levels.length < 2 ||
    levels.some((v, i) => !Number.isFinite(v) || (i > 0 && v <= levels[i - 1]))
  )
    throw new Error('Invalid isoband levels');
  const maxTriangles = options.maxTriangles ?? 2_000_000,
    maxVertices = options.maxVertices ?? 2_000_000,
    maxEdges = options.maxEdges ?? 6 * maxTriangles,
    maxTests = options.maxTests ?? 32 * maxTriangles;
  if (
    ![maxTriangles, maxVertices, maxEdges, maxTests].every(n => Number.isSafeInteger(n) && n >= 0)
  )
    throw new Error('Invalid isoband capacity');
  const count = fields.reduce((n, f) => n + 2 * (f.width - 1) * (f.height - 1), 0);
  if (!Number.isSafeInteger(count) || count > maxTriangles)
    throw new Error('Isoband triangle capacity exceeded');
  const originals = new Map<string, Vertex>(),
    vertices = new Map<string, Vertex>();
  const frame = fields[0];
  for (const f of fields)
    if (f.heightReference !== frame.heightReference)
      throw new Error('Isoband height references differ');
  let tests = 0,
    edgeCount = 0;
  const charge = () => {
    if (++tests > maxTests) throw new Error('Isoband work budget exceeded');
  };
  // Only conforming same-resolution sample rectangles may be assembled directly.
  const rectangles = fields.map(f => {
    if (
      f.registration !== frame.registration ||
      f.columnStep.some((v, i) => v !== frame.columnStep[i]) ||
      f.rowStep.some((v, i) => v !== frame.rowStep[i])
    )
      throw new Error('Isoband tiles require a conforming common frame');
    const dx = f.origin[0] - frame.origin[0],
      dy = f.origin[1] - frame.origin[1];
    const determinant =
      frame.columnStep[0] * frame.rowStep[1] - frame.columnStep[1] * frame.rowStep[0];
    const x = Math.round((dx * frame.rowStep[1] - dy * frame.rowStep[0]) / determinant),
      y = Math.round((dy * frame.columnStep[0] - dx * frame.columnStep[1]) / determinant);
    if (!Number.isSafeInteger(x) || !Number.isSafeInteger(y))
      throw new Error('Isoband tiles require integral lattice origins');
    for (let axis = 0; axis < 2; axis++) {
      const a = x * frame.columnStep[axis],
        b = y * frame.rowStep[axis];
      const expected = frame.origin[axis] + a + b;
      const tolerance = Math.min(
        16 *
          Number.EPSILON *
          Math.max(
            1,
            Math.abs(f.origin[axis]),
            Math.abs(frame.origin[axis]),
            Math.abs(a),
            Math.abs(b)
          ),
        1e-9 * Math.max(Math.abs(frame.columnStep[axis]), Math.abs(frame.rowStep[axis]))
      );
      if (!Number.isFinite(expected) || Math.abs(f.origin[axis] - expected) > tolerance)
        throw new Error('Isoband tiles require integral lattice origins');
    }
    return {x, y, right: x + f.width - 1, top: y + f.height - 1};
  });
  for (let i = 0; i < rectangles.length; i++)
    for (let j = i + 1; j < rectangles.length; j++) {
      charge();
      const a = rectangles[i],
        b = rectangles[j];
      if (a.x < b.right && b.x < a.right && a.y < b.top && b.y < a.top)
        throw new Error('Overlapping isoband tiles');
    }
  const rings: Vertex[][] = [],
    bands: number[] = [];
  const register = (v: Vertex) => {
    if (!vertices.has(v.key)) {
      if (vertices.size >= maxVertices) throw new Error('Isoband vertex capacity exceeded');
      vertices.set(v.key, v);
    }
    return vertices.get(v.key)!;
  };
  const clip = (poly: Vertex[], level: number, above: boolean): Vertex[] => {
    const out: Vertex[] = [];
    for (let i = 0; i < poly.length; i++) {
      charge();
      const a = poly[i],
        b = poly[(i + 1) % poly.length],
        ia = above ? a.z >= level : a.z <= level,
        ib = above ? b.z >= level : b.z <= level;
      if (ia) out.push(a);
      if (ia !== ib) {
        if (a.z === level) {
          out.push(a);
          continue;
        }
        if (b.z === level) {
          out.push(b);
          continue;
        }
        const support = [...new Set([...a.support, ...b.support])].sort();
        if (support.length !== 2) throw new Error('Invalid isoband intersection support');
        const u = originals.get(support[0])!,
          v = originals.get(support[1])!;
        const scale = Math.max(Math.abs(u.z), Math.abs(v.z), Math.abs(level), 1);
        const t = (level / scale - u.z / scale) / (v.z / scale - u.z / scale);
        const point = {
          x: u.x * (1 - t) + v.x * t,
          y: u.y * (1 - t) + v.y * t,
          z: level,
          key: `e:${support.join('|')}:${level}`,
          support
        };
        if (![point.x, point.y, t].every(Number.isFinite))
          throw new Error('Isoband arithmetic overflow');
        out.push(register(point));
      }
    }
    return out.filter((v, i) => v.key !== out[(i + 1) % out.length].key);
  };
  for (let band = 0; band + 1 < levels.length; band++) {
    const edges = new Map<string, {a: Vertex; b: Vertex}>();
    for (const f of fields)
      for (let y = 0; y < f.height - 1; y++)
        for (let x = 0; x < f.width - 1; x++) {
          const nodes = [
            [x, y],
            [x + 1, y],
            [x, y + 1],
            [x + 1, y + 1]
          ].map(([c, r]) => {
            const z = f.getHeight(c, r);
            if (z === undefined) return undefined;
            const shift = f.registration === 'cell' ? 0.5 : 0;
            const px =
                frame.origin[0] +
                (rectangles[fields.indexOf(f)].x + c + shift) * frame.columnStep[0] +
                (rectangles[fields.indexOf(f)].y + r + shift) * frame.rowStep[0],
              py =
                frame.origin[1] +
                (rectangles[fields.indexOf(f)].x + c + shift) * frame.columnStep[1] +
                (rectangles[fields.indexOf(f)].y + r + shift) * frame.rowStep[1];
            if (![px, py].every(Number.isFinite)) throw new Error('Isoband coordinate overflow');
            const key = `v:${px},${py}`,
              v = {x: px, y: py, z, key, support: [key]};
            const old = originals.get(key);
            if (old && old.z !== z) throw new Error('Isoband shared heights differ');
            originals.set(key, v);
            return v;
          });
          for (const ids of f.diagonal === '00-11'
            ? [
                [0, 1, 3],
                [0, 3, 2]
              ]
            : [
                [0, 1, 2],
                [1, 3, 2]
              ]) {
            charge();
            if (ids.some(i => !nodes[i])) continue;
            let poly = ids.map(i => nodes[i]!);
            // Constant-height triangles belong to exactly one interval (last upper endpoint inclusive).
            if (poly.every(v => v.z === levels[band + 1]) && band + 2 < levels.length) continue;
            if (
              (poly[1].x - poly[0].x) * (poly[2].y - poly[0].y) -
                (poly[1].y - poly[0].y) * (poly[2].x - poly[0].x) <
              0
            )
              poly.reverse();
            poly = clip(clip(poly, levels[band], true), levels[band + 1], false);
            if (poly.length < 3) continue;
            const area = poly.reduce((n, a, i) => {
              const b = poly[(i + 1) % poly.length],
                o = poly[0];
              return n + (a.x - o.x) * (b.y - o.y) - (b.x - o.x) * (a.y - o.y);
            }, 0);
            if (!Number.isFinite(area)) throw new Error('Isoband area arithmetic overflow');
            if (area === 0) continue;
            for (let i = 0; i < poly.length; i++) {
              const a = register(poly[i]),
                b = register(poly[(i + 1) % poly.length]);
              if (++edgeCount > maxEdges) throw new Error('Isoband edge capacity exceeded');
              const key = `${a.key}>${b.key}`,
                reverse = `${b.key}>${a.key}`;
              if (edges.has(reverse)) edges.delete(reverse);
              else {
                if (edges.has(key)) throw new Error('Overlapping isoband tiles');
                edges.set(key, {a, b});
              }
            }
          }
        }
    const outgoing = new Map<string, Set<string>>();
    for (const [key, e] of edges) {
      if (!outgoing.has(e.a.key)) outgoing.set(e.a.key, new Set());
      outgoing.get(e.a.key)!.add(key);
    }
    while (edges.size) {
      const first = edges.values().next().value!,
        ring: Vertex[] = [];
      let edge = first;
      for (;;) {
        charge();
        ring.push(edge.a);
        edges.delete(`${edge.a.key}>${edge.b.key}`);
        outgoing.get(edge.a.key)!.delete(`${edge.a.key}>${edge.b.key}`);
        if (edge.b.key === first.a.key) break;
        const choices = [...(outgoing.get(edge.b.key) ?? [])].map(k => edges.get(k)!);
        if (!choices.length) throw new Error('Open isoband boundary');
        const angle = (e: typeof edge) =>
          Math.atan2(
            (edge.b.x - edge.a.x) * (e.b.y - e.a.y) - (edge.b.y - edge.a.y) * (e.b.x - e.a.x),
            (edge.b.x - edge.a.x) * (e.b.x - e.a.x) + (edge.b.y - edge.a.y) * (e.b.y - e.a.y)
          );
        choices.sort((a, b) => angle(b) - angle(a) || a.b.key.localeCompare(b.b.key));
        edge = choices[0];
      }
      rings.push(ring);
      bands.push(band);
    }
  }
  const area = (ring: Vertex[]) =>
    ring.reduce((n, a, i) => {
      const b = ring[(i + 1) % ring.length],
        o = ring[0];
      return n + (a.x - o.x) * (b.y - o.y) - (b.x - o.x) * (a.y - o.y);
    }, 0);
  const areas = rings.map(area),
    parents = new Int32Array(rings.length).fill(-1);
  for (let i = 0; i < rings.length; i++)
    if (areas[i] < 0) {
      let best = Infinity;
      const q = rings[i][0];
      for (let j = 0; j < rings.length; j++)
        if (bands[j] === bands[i] && areas[j] > 0) {
          let inside = false;
          const ring = rings[j];
          for (let k = 0, l = ring.length - 1; k < ring.length; l = k++) {
            charge();
            const a = ring[k],
              b = ring[l];
            if (a.y > q.y !== b.y > q.y && q.x < ((b.x - a.x) * (q.y - a.y)) / (b.y - a.y) + a.x)
              inside = !inside;
          }
          if (inside && areas[j] < best) {
            parents[i] = j;
            best = areas[j];
          }
        }
      if (parents[i] < 0) throw new Error('Uncontained isoband hole');
    }
  const used = new Map<string, number>(),
    positions: number[] = [],
    indices: number[] = [],
    offsets = [0];
  for (const ring of rings) {
    for (const v of [...ring, ring[0]]) {
      if (!used.has(v.key)) {
        used.set(v.key, used.size);
        positions.push(v.x, v.y);
      }
      indices.push(used.get(v.key)!);
    }
    offsets.push(indices.length);
  }
  return {
    positions: Float64Array.from(positions),
    indices: Uint32Array.from(indices),
    offsets: Uint32Array.from(offsets),
    bandIndices: Uint32Array.from(bands),
    parents,
    levels: Float64Array.from(levels),
    heightReference: frame?.heightReference ?? 'unknown'
  };
}
