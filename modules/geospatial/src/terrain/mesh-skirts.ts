// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export type TerrainSkirtOptions = {
  /** Positive downward distance in the same units as positions. */
  height: number;
  /** Optional unordered pairs of boundary vertex IDs. Omit to skirt every boundary, including holes. */
  edges?: Uint16Array | Uint32Array;
  maxVertices?: number;
  maxTriangles?: number;
};

export type TerrainSkirtMesh = {
  positions: Float32Array | Float64Array;
  indices: Uint16Array | Uint32Array;
  /** Each appended vertex maps to its source vertex; original vertices are unchanged. */
  sourceVertexIndices: Uint32Array;
  skirtVertexOffset: number;
  skirtTriangleOffset: number;
  /** One for original triangles, zero for visual skirt triangles. */
  triangleValidity: Uint8Array;
  /** Local XYZ bounds including the skirt. */
  bounds: readonly [readonly [number, number, number], readonly [number, number, number]];
};

/** Build detached visual skirts from the directed boundary of an upward-facing terrain mesh.
 * Supplied edge pairs select boundaries but do not determine winding. Shared edges must have
 * opposite directions; nonmanifold, degenerate, and downward-facing source triangles are rejected.
 */
export function createTerrainSkirt(
  mesh: {positions: Float32Array | Float64Array; indices: Uint16Array | Uint32Array},
  options: TerrainSkirtOptions
): TerrainSkirtMesh {
  const {positions, indices} = mesh,
    {height, edges} = options;
  const maxVertices = options.maxVertices ?? 2_000_000,
    maxTriangles = options.maxTriangles ?? 4_000_000;
  if (
    !Number.isFinite(height) ||
    height <= 0 ||
    !Number.isSafeInteger(maxVertices) ||
    maxVertices < 0 ||
    maxVertices > 0xffffffff ||
    !Number.isSafeInteger(maxTriangles) ||
    maxTriangles < 0 ||
    maxTriangles > 0xffffffff
  )
    throw new Error('Invalid terrain skirt height or capacity');
  if (
    !(positions instanceof Float32Array || positions instanceof Float64Array) ||
    positions.length < 3 ||
    positions.length % 3 ||
    !positions.every(Number.isFinite) ||
    !(indices instanceof Uint16Array || indices instanceof Uint32Array) ||
    indices.length % 3 ||
    positions.length / 3 > maxVertices ||
    indices.length / 3 > maxTriangles
  )
    throw new Error('Invalid terrain skirt mesh or capacity');
  if (
    edges !== undefined &&
    (!(edges instanceof Uint16Array || edges instanceof Uint32Array) || edges.length % 2)
  )
    throw new Error('Invalid terrain skirt edge pairs');
  const vertexCount = positions.length / 3,
    triangleCount = indices.length / 3;
  const boundary = new Map<string, {a: number; b: number; count: number}>();
  for (let i = 0; i < indices.length; i += 3) {
    const ids = [indices[i], indices[i + 1], indices[i + 2]];
    if (ids.some(id => id >= vertexCount)) throw new Error('Terrain skirt index out of range');
    const [a, b, c] = ids.map(id => id * 3);
    const area =
      (positions[b] - positions[a]) * (positions[c + 1] - positions[a + 1]) -
      (positions[b + 1] - positions[a + 1]) * (positions[c] - positions[a]);
    if (!Number.isFinite(area) || area <= 0)
      throw new Error('Terrain skirt requires upward nondegenerate XY triangles');
    for (let j = 0; j < 3; j++) {
      const u = ids[j],
        v = ids[(j + 1) % 3],
        key = edgeKey(u, v),
        prior = boundary.get(key);
      if (!prior) boundary.set(key, {a: u, b: v, count: 1});
      else {
        if (prior.count !== 1 || prior.a !== v || prior.b !== u)
          throw new Error('Terrain skirt mesh has nonmanifold or inconsistent edges');
        prior.count++;
      }
    }
  }
  let selected: {a: number; b: number}[];
  if (edges) {
    selected = [];
    const used = new Set<string>();
    for (let i = 0; i < edges.length; i += 2) {
      const key = edgeKey(edges[i], edges[i + 1]),
        edge = boundary.get(key);
      if (!edge || edge.count !== 1 || used.has(key))
        throw new Error('Terrain skirt selection must contain unique boundary edges');
      used.add(key);
      selected.push(edge);
    }
  } else selected = [...boundary.values()].filter(edge => edge.count === 1);
  const outputVertices = vertexCount + selected.length * 2,
    outputTriangles = triangleCount + selected.length * 2;
  if (
    !Number.isSafeInteger(outputVertices) ||
    outputVertices > maxVertices ||
    outputVertices > 0xffffffff ||
    !Number.isSafeInteger(outputTriangles) ||
    outputTriangles > maxTriangles
  )
    throw new Error('Terrain skirt output capacity exceeded');
  const resultPositions =
    positions instanceof Float32Array
      ? new Float32Array(outputVertices * 3)
      : new Float64Array(outputVertices * 3);
  resultPositions.set(positions);
  const resultIndices =
    indices instanceof Uint16Array && outputVertices <= 65536
      ? new Uint16Array(outputTriangles * 3)
      : new Uint32Array(outputTriangles * 3);
  resultIndices.set(indices);
  const sourceVertexIndices = new Uint32Array(selected.length * 2),
    triangleValidity = new Uint8Array(outputTriangles);
  triangleValidity.fill(1, 0, triangleCount);
  for (let i = 0; i < selected.length; i++) {
    const {a, b} = selected[i],
      lowerA = vertexCount + 2 * i,
      lowerB = lowerA + 1;
    for (const [source, target] of [
      [a, lowerA],
      [b, lowerB]
    ]) {
      resultPositions.set(positions.subarray(3 * source, 3 * source + 3), 3 * target);
      resultPositions[3 * target + 2] = positions[3 * source + 2] - height;
      if (
        !Number.isFinite(resultPositions[3 * target + 2]) ||
        resultPositions[3 * target + 2] >= positions[3 * source + 2]
      )
        throw new Error('Terrain skirt height cannot be represented in position precision');
      sourceVertexIndices[target - vertexCount] = source;
    }
    resultIndices.set([a, lowerB, b, lowerB, a, lowerA], indices.length + i * 6);
  }
  const min: [number, number, number] = [Infinity, Infinity, Infinity],
    max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < resultPositions.length; i++) {
    const axis = i % 3;
    min[axis] = Math.min(min[axis], resultPositions[i]);
    max[axis] = Math.max(max[axis], resultPositions[i]);
  }
  return {
    positions: resultPositions,
    indices: resultIndices,
    sourceVertexIndices,
    skirtVertexOffset: vertexCount,
    skirtTriangleOffset: triangleCount,
    triangleValidity,
    bounds: [min, max]
  };
}

function edgeKey(a: number, b: number): string {
  return a < b ? `${a},${b}` : `${b},${a}`;
}
