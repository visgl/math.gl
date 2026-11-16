// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  splitTerrainMesh,
  type TerrainCutout,
  type TerrainCutoutInput,
  type TerrainCutoutOptions
} from './mesh-cutout';

/** A resident tile expressed in the same local Cartesian frame as its neighbors. */
export type TerrainCutoutTile = TerrainCutoutInput;

/** A resident-set cut and its input-face provenance. */
export type TerrainTileCutout = TerrainCutout & {
  /** Tile-array index for each input face referenced by either piece. */
  sourceTiles: Uint32Array;
  /** Original tile triangle index for each input face referenced by either piece. */
  sourceTileFaces: Uint32Array;
};

/** Split a conforming resident tile set, with paired walls only along the cut.
 *
 * Vertices with identical XYZ are welded before clipping. Mixed-level neighbors
 * must first be reconciled with stitchTerrainMeshEdges or stitchTerrainLodCut;
 * hanging vertices, overlapping tiles and conflicting elevations are rejected.
 * No snapping, height adjustment, missing-tile filling or tile caching occurs.
 * Recompute from the new resident set after arrival or eviction. Source triangle
 * and barycentric references retain the original tile face's corner order.
 * Limits apply to the total input (including duplicate vertices) and the splitter.
 */
export function splitTerrainMeshTiles(
  tiles: readonly TerrainCutoutTile[],
  polygon: readonly (readonly [number, number])[],
  options: TerrainCutoutOptions = {}
): TerrainTileCutout {
  const assembled = assembleTerrainCutoutTiles(tiles, options);
  return {
    ...splitTerrainMesh(assembled.mesh, polygon, {...options, maxWork: assembled.remainingWork}),
    sourceTiles: assembled.sourceTiles,
    sourceTileFaces: assembled.sourceTileFaces
  };
}

/** @internal Assemble a bounded, exact-welded mesh without clipping it. */
export function assembleTerrainCutoutTiles(
  tiles: readonly TerrainCutoutInput[],
  options: TerrainCutoutOptions = {}
) {
  const maxVertices = options.maxVertices ?? 500_000;
  const maxTriangles = options.maxTriangles ?? 500_000;
  const maxWork = options.maxWork ?? 4_000_000;
  if (
    ![maxVertices, maxTriangles, maxWork].every(n => Number.isSafeInteger(n) && n >= 0) ||
    maxVertices > 0xffffffff ||
    maxTriangles > 0xffffffff
  )
    throw new RangeError('Invalid terrain tile cutout limits');
  let vertexCount = 0;
  let faceCount = 0;
  let work = 0;
  for (const tile of tiles) {
    if (
      !(tile.positions instanceof Float32Array || tile.positions instanceof Float64Array) ||
      !(tile.indices instanceof Uint16Array || tile.indices instanceof Uint32Array) ||
      tile.positions.length % 3 ||
      tile.indices.length % 3
    )
      throw new RangeError('Invalid terrain tile cutout mesh');
    vertexCount += tile.positions.length / 3;
    faceCount += tile.indices.length / 3;
    work += 1 + tile.positions.length / 3 + tile.indices.length;
    if (vertexCount > maxVertices || faceCount > maxTriangles || work > maxWork)
      throw new RangeError('Terrain tile cutout input budget exceeded');
  }
  const positions = new Float64Array(vertexCount * 3);
  const indices = new Uint32Array(faceCount * 3);
  const sourceTiles = new Uint32Array(faceCount);
  const sourceTileFaces = new Uint32Array(faceCount);
  const vertices = new Map<string, number>();
  let vertexOffset = 0;
  let faceOffset = 0;
  for (let tileIndex = 0; tileIndex < tiles.length; tileIndex++) {
    const tile = tiles[tileIndex];
    const remap = new Uint32Array(tile.positions.length / 3);
    for (let i = 0; i < remap.length; i++) {
      const x = tile.positions[i * 3];
      const y = tile.positions[i * 3 + 1];
      const z = tile.positions[i * 3 + 2];
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z))
        throw new RangeError('Invalid terrain tile cutout coordinate');
      const key = `${x},${y},${z}`;
      let id = vertices.get(key);
      if (id === undefined) {
        id = vertexOffset++;
        vertices.set(key, id);
        positions[id * 3] = x;
        positions[id * 3 + 1] = y;
        positions[id * 3 + 2] = z;
      }
      remap[i] = id;
    }
    for (let i = 0; i < tile.indices.length; i++) {
      const id = tile.indices[i];
      if (id >= remap.length) throw new RangeError('Invalid terrain tile cutout index');
      indices[faceOffset * 3 + i] = remap[id];
    }
    for (let i = 0; i < tile.indices.length / 3; i++) {
      sourceTiles[faceOffset + i] = tileIndex;
      sourceTileFaces[faceOffset + i] = i;
    }
    faceOffset += tile.indices.length / 3;
  }
  return {
    mesh: {positions: positions.subarray(0, vertexOffset * 3), indices},
    sourceTiles,
    sourceTileFaces,
    remainingWork: maxWork - work
  };
}
