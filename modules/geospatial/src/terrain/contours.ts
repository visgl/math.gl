// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {HeightField} from './height-field';

export type TerrainContours = {
  /** Packed local XYZ vertices, with world coordinates obtained by adding origin. */
  positions: Float64Array;
  /** Packed fractional column/row for each vertex. */
  gridCoordinates: Float64Array;
  /** Undirected vertex pairs; shared intersections are indexed once per level. */
  segments: Uint32Array;
  /** One index into levels per segment. */
  levelIndices: Uint32Array;
  levels: Float64Array;
  origin: readonly [number, number, number];
  heightReference: string;
};
export type TerrainContourOptions = {
  origin?: readonly [number, number, number];
  maxSamples?: number;
  maxLevels?: number;
  maxVertices?: number;
  maxSegments?: number;
  /** Admission bound on levels * cells * 2, including triangles with missing data. */
  maxTriangleTests?: number;
};

/** Contour the field's fixed-diagonal piecewise-linear surface, not its bilinear interpolant.
 * Below vs at-or-above is the tie rule. Flat triangles and point-only touches emit no segment.
 * Output is an indexed segment graph; no path stitching, simplification or polygon filling.
 */
export function createTerrainContours(
  field: HeightField,
  levels: ArrayLike<number>,
  options: TerrainContourOptions = {}
): TerrainContours {
  const maxSamples = options.maxSamples ?? 1_100_000,
    maxLevels = options.maxLevels ?? 256;
  const maxVertices = options.maxVertices ?? 2_000_000,
    maxSegments = options.maxSegments ?? 1_000_000;
  const maxTriangleTests = options.maxTriangleTests ?? 10_000_000;
  for (const limit of [maxSamples, maxLevels, maxVertices, maxSegments, maxTriangleTests])
    if (!Number.isSafeInteger(limit) || limit < 0)
      throw new Error('Invalid terrain contour capacity');
  const count = field.width * field.height;
  if (
    count > maxSamples ||
    count > 0xffffffff ||
    maxVertices > 0xffffffff ||
    maxSegments > 0xffffffff
  )
    throw new Error('Terrain contour sample or index capacity exceeded');
  if (!Number.isSafeInteger(levels.length) || levels.length < 0 || levels.length > maxLevels)
    throw new Error('Terrain contour level capacity exceeded');
  for (let i = 0; i < levels.length; i++)
    if (!Number.isFinite(levels[i]) || (i > 0 && levels[i] <= levels[i - 1]))
      throw new Error('Terrain contour levels must be finite and strictly increasing');
  if (levels.length * 2 * (field.width - 1) * (field.height - 1) > maxTriangleTests)
    throw new Error('Terrain contour triangle-test budget exceeded');
  const origin = options.origin ?? [field.origin[0], field.origin[1], 0];
  if (
    origin.length !== 3 ||
    !Number.isFinite(origin[0]) ||
    !Number.isFinite(origin[1]) ||
    !Number.isFinite(origin[2])
  )
    throw new Error('Terrain contour origin must be finite XYZ');
  const outputLevels = Float64Array.from(levels),
    positions: number[] = [],
    coordinates: number[] = [],
    segments: number[] = [],
    levelIndices: number[] = [];
  const shift = field.registration === 'cell' ? 0.5 : 0;
  for (let levelIndex = 0; levelIndex < outputLevels.length; levelIndex++) {
    const level = outputLevels[levelIndex],
      vertices = new Map<string, number>(),
      edges = new Set<string>();
    const height = (i: number): number | undefined =>
      field.getHeight(i % field.width, Math.floor(i / field.width));
    const intersection = (a: number, b: number): {a: number; b: number; key: string} => {
      if (a > b) [a, b] = [b, a];
      const exact = height(a) === level ? a : height(b) === level ? b : undefined;
      return exact === undefined
        ? {a, b, key: `e${a}/${b}`}
        : {a: exact, b: exact, key: `v${exact}`};
    };
    const vertex = ({a, b, key}: {a: number; b: number; key: string}): number => {
      const existing = vertices.get(key);
      if (existing !== undefined) return existing;
      if (positions.length / 3 >= maxVertices)
        throw new Error('Terrain contour vertex capacity exceeded');
      let fraction = 0;
      if (a !== b) {
        const ha = height(a)!,
          hb = height(b)!,
          delta = hb - ha,
          offset = level - ha;
        if (Number.isFinite(delta) && Number.isFinite(offset)) fraction = offset / delta;
        else {
          const scale = Math.max(Math.abs(ha), Math.abs(hb), Math.abs(level));
          fraction = (level / scale - ha / scale) / (hb / scale - ha / scale);
        }
        if (!Number.isFinite(fraction) || fraction <= 0 || fraction >= 1)
          throw new Error('Terrain contour intersection loses precision');
      }
      const ax = a % field.width,
        ay = Math.floor(a / field.width);
      const x = ax + ((b % field.width) - ax) * fraction,
        y = ay + (Math.floor(b / field.width) - ay) * fraction;
      const px =
        field.origin[0] -
        origin[0] +
        (x + shift) * field.columnStep[0] +
        (y + shift) * field.rowStep[0];
      const py =
        field.origin[1] -
        origin[1] +
        (x + shift) * field.columnStep[1] +
        (y + shift) * field.rowStep[1];
      const pz = level - origin[2];
      if (!Number.isFinite(px) || !Number.isFinite(py) || !Number.isFinite(pz))
        throw new Error('Terrain contour coordinate overflow');
      const index = positions.length / 3;
      positions.push(px, py, pz);
      coordinates.push(x, y);
      vertices.set(key, index);
      return index;
    };
    const triangle = (a: number, b: number, c: number): void => {
      const ha = height(a),
        hb = height(b),
        hc = height(c);
      if (ha === undefined || hb === undefined || hc === undefined) return;
      const hits: ReturnType<typeof intersection>[] = [];
      if (ha < level !== hb < level) hits.push(intersection(a, b));
      if (hb < level !== hc < level) hits.push(intersection(b, c));
      if (hc < level !== ha < level) hits.push(intersection(c, a));
      if (hits.length !== 2 || hits[0].key === hits[1].key) return;
      const va = vertex(hits[0]),
        vb = vertex(hits[1]);
      const key = va < vb ? `${va}/${vb}` : `${vb}/${va}`;
      if (edges.has(key)) return;
      if (segments.length / 2 >= maxSegments)
        throw new Error('Terrain contour segment capacity exceeded');
      if (
        positions[3 * va] === positions[3 * vb] &&
        positions[3 * va + 1] === positions[3 * vb + 1]
      )
        throw new Error('Terrain contour segment collapses; use a local origin');
      edges.add(key);
      segments.push(va, vb);
      levelIndices.push(levelIndex);
    };
    for (let row = 0; row < field.height - 1; row++)
      for (let column = 0; column < field.width - 1; column++) {
        const a = row * field.width + column,
          b = a + 1,
          c = a + field.width,
          d = c + 1;
        if (field.diagonal === '00-11') {
          triangle(a, b, d);
          triangle(a, d, c);
        } else {
          triangle(a, b, c);
          triangle(b, d, c);
        }
      }
  }
  return {
    positions: Float64Array.from(positions),
    gridCoordinates: Float64Array.from(coordinates),
    segments: Uint32Array.from(segments),
    levelIndices: Uint32Array.from(levelIndices),
    levels: outputLevels,
    origin: Object.freeze([...origin] as [number, number, number]),
    heightReference: field.heightReference
  };
}
