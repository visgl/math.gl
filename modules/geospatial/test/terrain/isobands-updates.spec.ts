// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {
  HeightField,
  createTerrainIsobands,
  createTerrainMesh,
  HeightFieldMinMax,
  updateTerrainMeshes,
  updateTerrainBounds,
  updateTerrainGradientPyramids,
  createTerrainGradientPyramid,
  updateTerrainMixedVertexTileHalos,
  updateTerrainMixedGradientGrids
} from '@math.gl/geospatial';
function field(
  width = 3,
  height = 3,
  origin: readonly [number, number] = [0, 0],
  heights = Float64Array.from({length: width * height}, (_, i) => (i % width) + origin[0])
) {
  return new HeightField({width, height, origin, heights});
}
function area(b: ReturnType<typeof createTerrainIsobands>) {
  let sum = 0;
  for (let r = 0; r < b.parents.length; r++)
    for (let i = b.offsets[r]; i + 1 < b.offsets[r + 1]; i++) {
      const a = b.indices[i],
        c = b.indices[i + 1];
      sum +=
        b.positions[2 * a] * b.positions[2 * c + 1] - b.positions[2 * c] * b.positions[2 * a + 1];
    }
  return sum / 2;
}
test('isoband ramp areas, conforming tile cancellation and reversed frames', () => {
  const b = createTerrainIsobands([field()], [0, 1, 2]);
  expect(Array.from(b.bandIndices)).toEqual([0, 1]);
  expect(area(b)).toBeCloseTo(4);
  const tiles = createTerrainIsobands([field(2, 3), field(2, 3, [1, 0])], [0, 2]);
  expect(tiles.parents.length).toBe(1);
  expect(area(tiles)).toBeCloseTo(4);
  const reverse = new HeightField({
    width: 3,
    height: 3,
    heights: new Float64Array(9).fill(1),
    rowStep: [0, -1]
  });
  expect(area(createTerrainIsobands([reverse], [0, 2]))).toBeCloseTo(4);
});
test('nodata holes, plateaus and both diagonals retain domain boundaries', () => {
  const heights = new Float64Array(25).fill(1);
  heights[12] = NaN;
  for (const diagonal of ['00-11', '10-01'] as const) {
    const b = createTerrainIsobands(
      [new HeightField({width: 5, height: 5, heights, diagonal})],
      [0, 1, 2]
    );
    expect(new Set(b.bandIndices)).toEqual(new Set([1]));
    expect(Array.from(b.parents).filter(p => p >= 0)).toHaveLength(1);
    expect(area(b)).toBeGreaterThan(0);
    expect(area(b)).toBeLessThan(16);
  }
  expect(
    createTerrainIsobands([field(3, 3, [0, 0], new Float64Array(9).fill(10))], [0, 1]).indices
      .length
  ).toBe(0);
});
test('isoband admission, overlap and disagreement checks', () => {
  expect(() => createTerrainIsobands([field()], [1, 0])).toThrow();
  for (const options of [{maxTriangles: 1}, {maxEdges: 1}, {maxVertices: 1}, {maxTests: 0}])
    expect(() => createTerrainIsobands([field()], [0, 3], options)).toThrow(/capacity|budget/);
  expect(() => createTerrainIsobands([field(), field()], [0, 3])).toThrow(/Overlapping/);
});
test('edited patches rebuild mesh and extrema; unedited patches retain buffers', () => {
  const a = {id: 'a', field: field()},
    b = {id: 'b', field: field(3, 3, [10, 0])};
  const meshes = updateTerrainMeshes(null, [a, b]),
    bounds = updateTerrainBounds(null, [a, b]);
  const edit = {
    id: 'a',
    field: field(3, 3, [0, 0], new Float64Array([0, 1, 2, 0, 100, 2, 0, 1, 2]))
  };
  const next = updateTerrainMeshes(meshes, [edit, b]),
    nextBounds = updateTerrainBounds(bounds, [edit, b]);
  expect(next[0].data).toEqual(createTerrainMesh(edit.field));
  expect(next[1].data).toBe(meshes[1].data);
  expect(nextBounds[0].data.query()).toEqual(new HeightFieldMinMax(edit.field).query());
  expect(nextBounds[0].data.query().heightRange).toEqual([0, 100]);
  expect(nextBounds[1].data).toBe(bounds[1].data);
  expect(() => updateTerrainMeshes(meshes, [a, b], {maxSamples: 1})).toThrow(/capacity/);
  expect(() => updateTerrainBounds(null, [a, a])).toThrow(/duplicate/);
  const halos = updateTerrainMixedVertexTileHalos(null, [
    {column: 0, row: 0, spacing: 1, field: {width: 3, height: 3, heights: new Float64Array(9)}}
  ]);
  const gradients = updateTerrainMixedGradientGrids(null, halos),
    p = updateTerrainGradientPyramids(null, gradients);
  expect(p[0].data).toEqual(createTerrainGradientPyramid(gradients.tiles[0].grid));
  expect(updateTerrainGradientPyramids(p, gradients)[0].data).toBe(p[0].data);
  expect(() => updateTerrainGradientPyramids(p, gradients, {maxSamples: 1})).toThrow(/capacity/);
});

test('nonconforming isoband tiles and excess levels are rejected', () => {
  expect(() => createTerrainIsobands([field(), field(3, 3, [0.5, 0])], [0, 3])).toThrow(/lattice/);
  expect(() =>
    createTerrainIsobands(
      [
        field(),
        new HeightField({width: 3, height: 3, heights: new Float64Array(9), columnStep: [2, 0]})
      ],
      [0, 3]
    )
  ).toThrow(/conforming/);
  expect(() => createTerrainIsobands([field()], [0, 1, 2], {maxLevels: 2})).toThrow(/capacity/);
});

test('all 3x3 nodata masks conserve the area of the surviving triangle surface', () => {
  for (let mask = 0; mask < 512; mask++) {
    const heights = Float64Array.from({length: 9}, (_, i) => (mask & (1 << i) ? NaN : 1));
    for (const diagonal of ['00-11', '10-01'] as const) {
      const f = new HeightField({width: 3, height: 3, heights, diagonal});
      const mesh = createTerrainMesh(f),
        bands = createTerrainIsobands([f], [0, 2]);
      expect(area(bands)).toBeCloseTo(mesh.indices.length / 6, 12);
    }
  }
});

test('conforming decimal-resolution tiles tolerate inverse-transform roundoff', () => {
  const make = (x: number) =>
    new HeightField({
      width: 6,
      height: 2,
      origin: [x, 0],
      columnStep: [0.1, 0],
      rowStep: [0, 0.1],
      heights: new Float64Array(12).fill(1)
    });
  const bands = createTerrainIsobands([make(0), make(0.5)], [0, 2]);
  expect(bands.parents.length).toBe(1);
  expect(area(bands)).toBeCloseTo(0.1, 12);
  expect(() => createTerrainIsobands([make(0), make(0.500001)], [0, 2])).toThrow(/lattice/);
});

test('large translated decimal frames recover a forward-verified lattice address', () => {
  const make = (x: number) =>
    new HeightField({
      width: 2,
      height: 2,
      origin: [x, 500000],
      columnStep: [0.1, 0],
      rowStep: [0, 0.1],
      heights: new Float64Array(4).fill(1)
    });
  expect(createTerrainIsobands([make(500000), make(500000.1)], [0, 2]).parents.length).toBe(1);
});

test('default edge and work budgets scale with an admitted triangle cap', () => {
  const n = 65,
    f = new HeightField({
      width: n,
      height: n,
      heights: Float64Array.from({length: n * n}, (_, i) => i % n)
    });
  const bands = createTerrainIsobands([f], [0, 16, 32, 48, 64], {
    maxTriangles: 2 * (n - 1) * (n - 1)
  });
  expect(new Set(bands.bandIndices).size).toBe(4);
  expect(area(bands)).toBeCloseTo(4096);
  expect(() => createTerrainIsobands([f], [0, 64], {maxEdges: 1})).toThrow(/edge capacity/);
  expect(() => createTerrainIsobands([f], [0, 64], {maxTests: 1})).toThrow(/budget/);
});
