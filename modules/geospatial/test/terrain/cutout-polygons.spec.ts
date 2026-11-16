// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  prepareTerrainCutoutPolygons,
  TerrainSurface,
  TerrainSampleStatus,
  splitTerrainMesh,
  splitTerrainMeshTiles,
  updateTerrainTileCutouts,
  createTerrainCutoutSkirts,
  createTerrainMesh,
  HeightField,
  stitchTerrainMeshEdges,
  type TerrainCutoutPiece,
  type TerrainCutoutPolygon,
  type TerrainCutoutRegion
} from '@math.gl/geospatial';

/** Analytical plane on a four-by-four square. */
const plane = {
  positions: Float64Array.of(0, 0, 0, 4, 0, 4, 4, 4, 12, 0, 4, 8),
  indices: Uint16Array.of(0, 1, 2, 0, 2, 3)
};
/** Concave L with area five and perimeter twelve. */
const concave = [
  [0.5, 0.5],
  [3.5, 0.5],
  [3.5, 1.5],
  [1.5, 1.5],
  [1.5, 3.5],
  [0.5, 3.5]
] as const;
/** Convex rings for holes and nested islands. */
const outer = [
  [0.5, 0.5],
  [3.5, 0.5],
  [3.5, 3.5],
  [0.5, 3.5]
] as const;
const hole = [
  [1, 1],
  [3, 1],
  [3, 3],
  [1, 3]
] as const;
const island = [
  [1.5, 1.5],
  [2.5, 1.5],
  [2.5, 2.5],
  [1.5, 2.5]
] as const;
/** Independent projected-area measurement. */
function area(piece: TerrainCutoutPiece) {
  let sum = 0;
  const p = piece.positions;
  for (let i = 0; i < piece.indices.length; i += 3) {
    const [a, b, c] = Array.from(piece.indices.subarray(i, i + 3), id => id * 3);
    sum += ((p[b] - p[a]) * (p[c + 1] - p[a + 1]) - (p[c] - p[a]) * (p[b + 1] - p[a + 1])) / 2;
  }
  return sum;
}
/** Independent boundary length. */
function perimeter(piece: TerrainCutoutPiece) {
  let sum = 0;
  for (let i = 0; i < piece.cutEdges.length; i += 2) {
    const a = piece.cutEdges[i] * 3,
      b = piece.cutEdges[i + 1] * 3;
    sum += Math.hypot(
      piece.positions[a] - piece.positions[b],
      piece.positions[a + 1] - piece.positions[b + 1]
    );
  }
  return sum;
}
/** Exact geometry comparison without dependence on vertex/face numbering. */
function triangles(piece: TerrainCutoutPiece) {
  return Array.from({length: piece.indices.length / 3}, (_, i) =>
    Array.from(piece.indices.subarray(i * 3, i * 3 + 3), id =>
      String(piece.positions.slice(id * 3, id * 3 + 3))
    )
      .sort()
      .join('/')
  ).sort();
}
/** Require each exposed cut edge to follow a real finite input boundary. */
function onBoundary(piece: TerrainCutoutPiece, polygons: readonly TerrainCutoutPolygon[]) {
  for (let i = 0; i < piece.cutEdges.length; i += 2) {
    const a = piece.cutEdges[i] * 3,
      b = piece.cutEdges[i + 1] * 3;
    const x = (piece.positions[a] + piece.positions[b]) / 2,
      y = (piece.positions[a + 1] + piece.positions[b + 1]) / 2;
    const polygon = polygons[piece.cutPolygonIndices[i / 2]];
    expect(
      [polygon.outer, ...(polygon.holes ?? [])].some(ring =>
        ring.some((u, j) => {
          const v = ring[(j + 1) % ring.length];
          return (
            Math.abs((v[0] - u[0]) * (y - u[1]) - (v[1] - u[1]) * (x - u[0])) < 1e-12 &&
            x >= Math.min(u[0], v[0]) - 1e-12 &&
            x <= Math.max(u[0], v[0]) + 1e-12 &&
            y >= Math.min(u[1], v[1]) - 1e-12 &&
            y <= Math.max(u[1], v[1]) + 1e-12
          );
        })
      )
    ).toBe(true);
  }
}

test('concave cut conserves coverage and never skirts supporting-line subdivisions', () => {
  const polygons = [{outer: concave}],
    cut = splitTerrainMesh(plane, prepareTerrainCutoutPolygons(polygons));
  expect(area(cut.patch)).toBeCloseTo(5, 12);
  expect(area(cut.remainder)).toBeCloseTo(11, 12);
  expect(perimeter(cut.patch)).toBeCloseTo(12, 12);
  onBoundary(cut.patch, polygons);
  const skirts = createTerrainCutoutSkirts(cut, {
    lift: 5,
    patch: {baseZ: -1},
    remainder: {baseZ: -1}
  });
  expect(skirts.patch.skirt!.sourceVertexIndices.length).toBe(cut.patch.cutEdges.length);
  for (const piece of [cut.patch, cut.remainder]) {
    // Feed the output through the original topology validator: no hidden T-junctions.
    expect(() =>
      splitTerrainMesh(piece, [
        [-1, -1],
        [5, -1],
        [5, 5],
        [-1, 5]
      ])
    ).not.toThrow();
    for (let i = 0; i < piece.positions.length; i += 3)
      expect(piece.positions[i + 2]).toBeCloseTo(
        piece.positions[i] + 2 * piece.positions[i + 1],
        12
      );
  }
});

test('holes and an island inside a hole carry paired polygon IDs with either winding', () => {
  for (const reverse of [false, true]) {
    const ring = (r: readonly (readonly [number, number])[]) => (reverse ? [...r].reverse() : r);
    const polygons = [{outer: ring(outer), holes: [ring(hole)]}, {outer: ring(island)}];
    const cut = splitTerrainMesh(plane, prepareTerrainCutoutPolygons(polygons));
    expect(area(cut.patch)).toBeCloseTo(6, 12);
    expect(area(cut.remainder)).toBeCloseTo(10, 12);
    expect(perimeter(cut.patch)).toBeCloseTo(24, 12);
    expect(new Set(cut.patch.polygonIndices)).toEqual(new Set([0, 1]));
    for (const [polygonIndex, expectedArea] of [
      [0, 5],
      [1, 1]
    ]) {
      const indices = Array.from(cut.patch.indices).filter(
        (_, i) => cut.patch.polygonIndices[Math.floor(i / 3)] === polygonIndex
      );
      expect(area({...cut.patch, indices: Uint32Array.from(indices)})).toBeCloseTo(
        expectedArea,
        12
      );
    }
    expect(new Set(cut.remainder.polygonIndices)).toEqual(new Set([0xffffffff]));
    expect(cut.patch.cutPolygonIndices).toEqual(cut.remainder.cutPolygonIndices);
    onBoundary(cut.patch, polygons);
    onBoundary(cut.remainder, polygons);
    for (let i = 0; i < cut.patch.cutEdges.length; i += 2)
      for (let endpoint = 0; endpoint < 2; endpoint++) {
        const a = cut.patch.cutEdges[i + endpoint] * 3,
          b = cut.remainder.cutEdges[i + 1 - endpoint] * 3;
        expect(cut.patch.positions.slice(a, a + 3)).toEqual(
          cut.remainder.positions.slice(b, b + 3)
        );
      }
  }
});

test('preparation snapshots coordinates and accepts redundant forward-collinear vertices', () => {
  const mutable = outer.map(p => [...p] as [number, number]);
  mutable.splice(1, 0, [2, 0.5]);
  const prepared = prepareTerrainCutoutPolygons([{outer: mutable}]);
  const before = splitTerrainMesh(plane, prepared);
  mutable[0][0] = 100;
  mutable.pop();
  expect(splitTerrainMesh(plane, prepared)).toEqual(before);
  expect(area(before.patch)).toBeCloseTo(9, 12);
});

/** Adjacent plane tiles; use the sparse stitcher for unequal sampling. */
function tile(x: number, size: number) {
  return createTerrainMesh(
    new HeightField({
      width: size,
      height: size,
      origin: [x, 0],
      columnStep: [2 / (size - 1), 0],
      rowStep: [0, 4 / (size - 1)],
      heights: Float64Array.from(
        {length: size * size},
        (_, i) => x + ((i % size) * 2) / (size - 1) + (Math.floor(i / size) * 8) / (size - 1)
      )
    }),
    {origin: [0, 0, 0]}
  );
}

test('prepared holes and region IDs compose with mixed-level tile caching and eviction', () => {
  const stitched = stitchTerrainMeshEdges(tile(0, 3), 'maxColumn', tile(2, 5), 'minColumn', {
    maxHeightAdjustment: 1e-12
  });
  const residents = [
    {id: 'left', revision: 0, mesh: stitched.a},
    {id: 'right', revision: 0, mesh: stitched.b}
  ];
  const polygons = [{outer, holes: [hole]}, {outer: island}];
  const shape = prepareTerrainCutoutPolygons(polygons);
  const first = updateTerrainTileCutouts(residents, shape);
  const full = splitTerrainMeshTiles(
    residents.map(t => t.mesh),
    shape
  );
  for (const side of ['patch', 'remainder'] as const) {
    const pieces = [...first.tiles.values()].map(t => t[side]);
    expect(pieces.flatMap(triangles).sort()).toEqual(triangles(full[side]));
    expect(pieces.reduce((sum, p) => sum + perimeter(p), 0)).toBeCloseTo(perimeter(full[side]), 12);
    pieces.forEach(p => onBoundary(p, polygons));
  }
  const reorder = updateTerrainTileCutouts([...residents].reverse(), shape, first.cache);
  expect(reorder.changed).toEqual([]);
  expect(reorder.rebuilt).toEqual([]);
  const evicted = updateTerrainTileCutouts([residents[0]], shape, reorder.cache);
  expect(evicted.rebuilt).toEqual([]);
  const single = splitTerrainMeshTiles([residents[0].mesh], shape);
  expect(perimeter(evicted.tiles.get('left')!.patch)).toBeCloseTo(perimeter(single.patch), 12);
  expect(
    updateTerrainTileCutouts(residents, prepareTerrainCutoutPolygons(polygons), first.cache).rebuilt
  ).toEqual(['left', 'right']);
  // Switching back to a convex ring also invalidates the prepared input cache.
  expect(updateTerrainTileCutouts(residents, outer, first.cache).rebuilt).toEqual([
    'left',
    'right'
  ]);
});

test('rejects invalid topology and exhausts explicit preparation/split budgets', () => {
  const bad: TerrainCutoutPolygon[][] = [
    [
      {
        outer: [
          [0, 0],
          [2, 2],
          [0, 2],
          [2, 0]
        ]
      }
    ],
    [
      {
        outer: [
          [0, 0],
          [2, 0],
          [1, 0],
          [1, 1]
        ]
      }
    ],
    [
      {
        outer: [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 0]
        ]
      }
    ],
    [
      {
        outer,
        holes: [
          [
            [3, 3],
            [5, 3],
            [5, 5],
            [3, 5]
          ]
        ]
      }
    ],
    [
      {
        outer,
        holes: [
          [
            [5, 5],
            [6, 5],
            [6, 6],
            [5, 6]
          ]
        ]
      }
    ],
    [{outer, holes: [hole, island]}],
    [{outer}, {outer: island}],
    [
      {outer},
      {
        outer: [
          [3.5, 0.5],
          [4, 0.5],
          [4, 1],
          [3.5, 1]
        ]
      }
    ],
    [
      {
        outer: [
          [0, 0],
          [1, 0],
          [NaN, 1]
        ]
      }
    ]
  ];
  for (const polygons of bad) expect(() => prepareTerrainCutoutPolygons(polygons)).toThrow();
  for (const options of [{maxEdges: 2}, {maxWork: 0}, {maxEdges: -1}])
    expect(() => prepareTerrainCutoutPolygons([{outer}], options)).toThrow();
  expect(() => prepareTerrainCutoutPolygons([])).toThrow();
  expect(() => splitTerrainMesh(plane, {} as TerrainCutoutRegion)).toThrow();
  const shape = prepareTerrainCutoutPolygons([{outer: concave}]);
  expect(() => splitTerrainMesh(plane, shape, {maxWork: 10})).toThrow();
  expect(() => splitTerrainMesh(plane, shape, {maxTriangles: 3})).toThrow();
});

test('oblique concave cuts conserve analytical area and boundary length', () => {
  const transformed = concave.map(
    ([x, y]) => [2 + 0.8 * (x - 2) - 0.3 * (y - 2), 2 + 0.3 * (x - 2) + 0.8 * (y - 2)] as const
  );
  const polygons = [{outer: transformed}];
  const cut = splitTerrainMesh(plane, prepareTerrainCutoutPolygons(polygons));
  expect(area(cut.patch)).toBeCloseTo(5 * (0.8 ** 2 + 0.3 ** 2), 12);
  expect(area(cut.patch) + area(cut.remainder)).toBeCloseTo(16, 12);
  expect(perimeter(cut.patch)).toBeCloseTo(12 * Math.hypot(0.8, 0.3), 12);
  onBoundary(cut.patch, polygons);
});

test('holes crossing missing terrain retain only known paired boundaries', () => {
  const shape = prepareTerrainCutoutPolygons([
    {
      outer,
      holes: [
        [
          [1, 1],
          [2, 1],
          [2, 2],
          [1, 2]
        ]
      ]
    }
  ]);
  const cut = splitTerrainMesh({...plane, indices: Uint16Array.of(0, 1, 2)}, shape);
  expect(area(cut.patch)).toBeCloseTo(4, 12);
  expect(area(cut.remainder)).toBeCloseTo(4, 12);
  expect(perimeter(cut.patch)).toBeCloseTo(8, 12);
  for (let i = 0; i < cut.patch.cutEdges.length; i += 2) {
    const a = cut.patch.cutEdges[i] * 3,
      b = cut.patch.cutEdges[i + 1] * 3;
    expect(
      cut.patch.positions[a] === cut.patch.positions[a + 1] &&
        cut.patch.positions[b] === cut.patch.positions[b + 1]
    ).toBe(false);
  }
});

test('sampled coverage agrees with independent analytical concave and lake/island domains', () => {
  const cases = [
    {
      polygons: [{outer: concave}],
      inside: (x: number, y: number) =>
        x > 0.5 && y > 0.5 && ((x < 3.5 && y < 1.5) || (x < 1.5 && y < 3.5))
    },
    {
      polygons: [{outer, holes: [hole]}, {outer: island}],
      inside: (x: number, y: number) =>
        x > 0.5 &&
        x < 3.5 &&
        y > 0.5 &&
        y < 3.5 &&
        (!(x > 1 && x < 3 && y > 1 && y < 3) || (x > 1.5 && x < 2.5 && y > 1.5 && y < 2.5))
    }
  ];
  for (const {polygons, inside} of cases) {
    const cut = splitTerrainMesh(plane, prepareTerrainCutoutPolygons(polygons));
    const patch = new TerrainSurface(cut.patch),
      remainder = new TerrainSurface(cut.remainder);
    for (let row = 0; row < 16; row++)
      for (let column = 0; column < 16; column++) {
        const x = 0.03125 + column / 4,
          y = 0.09375 + row / 4;
        expect(patch.sample(x, y).status === TerrainSampleStatus.VALID).toBe(inside(x, y));
        expect(remainder.sample(x, y).status === TerrainSampleStatus.VALID).toBe(!inside(x, y));
      }
  }
});

test('preparation bounds all outer and hole vertices before copying them', () => {
  expect(() => prepareTerrainCutoutPolygons([{outer: concave}], {maxEdges: 5})).toThrow(
    /edge budget/
  );
  expect(() => prepareTerrainCutoutPolygons([{outer, holes: [hole]}], {maxEdges: 5})).toThrow(
    /edge budget/
  );
  expect(() =>
    prepareTerrainCutoutPolygons([{outer, holes: [hole]}, {outer: island}], {maxEdges: 11})
  ).toThrow(/edge budget/);
});
