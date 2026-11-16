// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  HeightField,
  createTerrainMesh,
  splitTerrainMeshTiles,
  stitchTerrainMeshEdges,
  updateTerrainTileCutouts,
  type TerrainCutoutResident,
  type TerrainCutoutPiece,
  type TerrainTileCutoutUpdate,
  type TerrainTileCutoutCache
} from '@math.gl/geospatial';

/** Fractional oblique cuts exercise opposite-direction seam intersections. */
const ring = [
  [0.23, 0.19],
  [1.71, 0.27],
  [1.59, 0.83],
  [0.31, 0.77]
] as const;
/** Independently indexed adjacent affine terrain tiles. */
function resident(id: string, x: number, size = 3): TerrainCutoutResident {
  return {
    id,
    revision: 0,
    mesh: createTerrainMesh(
      new HeightField({
        width: size,
        height: size,
        origin: [x, 0],
        columnStep: [1 / (size - 1), 0],
        rowStep: [0, 1 / (size - 1)],
        heights: Float64Array.from(
          {length: size * size},
          (_, i) => 2 * (x + (i % size) / (size - 1)) + (3 * Math.floor(i / size)) / (size - 1)
        )
      }),
      {origin: [0, 0, 0]}
    )
  };
}
/** Signed XY area, independent of cut topology and triangulation. */
function area(piece: TerrainCutoutPiece) {
  let sum = 0;
  const p = piece.positions;
  for (let i = 0; i < piece.indices.length; i += 3) {
    const [a, b, c] = Array.from(piece.indices.subarray(i, i + 3), id => id * 3);
    sum += ((p[b] - p[a]) * (p[c + 1] - p[a + 1]) - (p[c] - p[a]) * (p[b + 1] - p[a + 1])) / 2;
  }
  return sum;
}
/** Canonical directed cut edges for exact full-rebuild comparison. */
function edges(piece: TerrainCutoutPiece) {
  const result: string[] = [];
  for (let i = 0; i < piece.cutEdges.length; i += 2) {
    const a = piece.cutEdges[i] * 3,
      b = piece.cutEdges[i + 1] * 3;
    result.push(`${piece.positions.slice(a, a + 3)}/${piece.positions.slice(b, b + 3)}`);
  }
  return result;
}
/** Qualify both coverage and paired heights against the monolithic splitter. */
function parity(
  residents: TerrainCutoutResident[],
  result: TerrainTileCutoutUpdate,
  polygon = ring
) {
  const full = splitTerrainMeshTiles(
    residents.map(t => t.mesh),
    polygon
  );
  for (const side of ['patch', 'remainder'] as const) {
    const pieces = [...result.tiles.values()].map(c => c[side]);
    expect(pieces.reduce((sum, p) => sum + area(p), 0)).toBeCloseTo(area(full[side]), 12);
    expect(pieces.flatMap(edges).sort()).toEqual(edges(full[side]).sort());
    const triangles = (piece: TerrainCutoutPiece) =>
      Array.from({length: piece.indices.length / 3}, (_, i) =>
        Array.from(piece.indices.subarray(i * 3, i * 3 + 3), id =>
          String(piece.positions.slice(id * 3, id * 3 + 3))
        )
          .sort()
          .join('/')
      );
    expect(pieces.flatMap(triangles).sort()).toEqual(triangles(full[side]).sort());
    for (const t of residents) {
      const piece = result.tiles.get(t.id)![side];
      for (let i = 0; i < piece.sourceTriangles.length; i++)
        for (let axis = 0; axis < 3; axis++) {
          let value = 0;
          for (let k = 0; k < 3; k++)
            value +=
              t.mesh.positions[t.mesh.indices[piece.sourceTriangles[i] * 3 + k] * 3 + axis] *
              piece.sourceWeights[i * 3 + k];
          expect(value).toBeCloseTo(piece.positions[i * 3 + axis], 11);
        }
    }
  }
}

test('independent clipping exactly matches full-rebuild boundaries and preserves unchanged buffers', () => {
  const tiles = [resident('left', 0), resident('right', 1)];
  const first = updateTerrainTileCutouts(tiles, ring);
  parity(tiles, first);
  const next = updateTerrainTileCutouts(tiles, ring, first.cache);
  expect(next.rebuilt).toEqual([]);
  expect(next.changed).toEqual([]);
  expect(next.tiles.get('left')).toBe(first.tiles.get('left'));
  const edit = tiles[0];
  edit.mesh.positions[4 * 3 + 2] += 0.7;
  edit.revision++;
  const edited = updateTerrainTileCutouts(tiles, ring, next.cache);
  expect(edited.rebuilt).toEqual(['left']);
  expect(edited.changed).toEqual(['left']);
  expect(edited.tiles.get('right')).toBe(next.tiles.get('right'));
  parity(tiles, edited);
});

test('arrival and eviction change neighbor walls without reclipping its surface', () => {
  const polygon = [
    [0, 0],
    [1, 0],
    [1, 1],
    [0, 1]
  ] as const;
  const left = resident('left', 0),
    right = resident('right', 1);
  const first = updateTerrainTileCutouts([left], polygon);
  expect(first.tiles.get('left')!.patch.cutEdges).toHaveLength(0);
  const arrived = updateTerrainTileCutouts([left, right], polygon, first.cache);
  expect(arrived.rebuilt).toEqual(['right']);
  expect(arrived.changed.sort()).toEqual(['left', 'right']);
  expect(arrived.tiles.get('left')!.patch.positions).toBe(first.tiles.get('left')!.patch.positions);
  expect(arrived.tiles.get('left')!.patch.cutEdges.length).toBeGreaterThan(0);
  const evicted = updateTerrainTileCutouts([left], polygon, arrived.cache);
  expect(evicted.rebuilt).toEqual([]);
  expect(evicted.removed).toEqual(['right']);
  expect(evicted.changed).toEqual(['left']);
  expect(evicted.tiles.get('left')!.patch.cutEdges).toHaveLength(0);
  const restored = updateTerrainTileCutouts([left, right], polygon, evicted.cache);
  expect(restored.tiles.get('left')).toEqual(arrived.tiles.get('left'));
});

test('mixed-level independently clipped meshes match monolithic reconstruction', () => {
  for (const [a, b] of [
    [2, 5],
    [3, 9],
    [4, 6],
    [9, 3]
  ]) {
    const left = resident('left', 0, a),
      right = resident('right', 1, b);
    const seam = stitchTerrainMeshEdges(
      left.mesh as ReturnType<typeof createTerrainMesh>,
      'maxColumn',
      right.mesh as ReturnType<typeof createTerrainMesh>,
      'minColumn',
      {maxHeightAdjustment: 1e-12}
    );
    const tiles = [
      {...left, mesh: seam.a},
      {...right, mesh: seam.b}
    ];
    parity(tiles, updateTerrainTileCutouts(tiles, ring));
  }
});

test('ring, mesh identity and option changes invalidate the corresponding clips', () => {
  const tile = resident('left', 0),
    first = updateTerrainTileCutouts([tile], ring);
  expect(
    updateTerrainTileCutouts([{...tile, mesh: {...tile.mesh}}], ring, first.cache).rebuilt
  ).toEqual(['left']);
  expect(updateTerrainTileCutouts([tile], [...ring].reverse(), first.cache).rebuilt).toEqual([
    'left'
  ]);
  expect(updateTerrainTileCutouts([tile], ring, first.cache, {maxWork: 5000000}).rebuilt).toEqual([
    'left'
  ]);
  expect(updateTerrainTileCutouts([], ring, first.cache).removed).toEqual(['left']);
  expect(() => updateTerrainTileCutouts([], [], first.cache)).toThrow();
});

test('rejects nonconforming neighbors and budget exhaustion without corrupting the old cache', () => {
  const left = resident('left', 0),
    right = resident('right', 1);
  const previous = updateTerrainTileCutouts([left], ring);
  for (const options of [
    {maxTiles: 0},
    {maxBoundaryEdges: 0},
    {maxPairChecks: 0},
    {maxWork: 0},
    {maxVertices: -1}
  ])
    expect(() => updateTerrainTileCutouts([left, right], ring, previous.cache, options)).toThrow();
  for (const bad of [
    resident('left', 1),
    resident('overlap', 0),
    resident('hanging', 1, 4),
    {...right, revision: -1}
  ])
    expect(() => updateTerrainTileCutouts([left, bad], ring, previous.cache)).toThrow();
  const raised = resident('raised', 1);
  for (let i = 2; i < raised.mesh.positions.length; i += 3) raised.mesh.positions[i] += 1;
  expect(() => updateTerrainTileCutouts([left, raised], ring, previous.cache)).toThrow();
  expect(updateTerrainTileCutouts([left], ring, previous.cache).changed).toEqual([]);
});

test('bounded multi-tile edit/eviction replay agrees with every full rebuild', () => {
  const tiles = [resident('left', 0), resident('right', 1), resident('island', 3)];
  let cache: TerrainTileCutoutCache | undefined;
  for (let step = 0; step < 12; step++) {
    const active = step % 3 === 0 ? [tiles[0], tiles[2]] : tiles;
    const edited = active[step % active.length];
    edited.revision++;
    edited.mesh.positions[4 * 3 + 2] += (step % 2 ? 1 : -1) * 0.03;
    const update = updateTerrainTileCutouts(active, ring, cache);
    parity(active, update);
    cache = update.cache;
  }
});
