// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';
import {HeightField} from '@math.gl/geospatial/terrain';
import {createTerrainMesh} from '@math.gl/geospatial/terrain/mesh';
import {
  stitchTerrainMeshEdges,
  type TerrainSeamMesh
} from '@math.gl/geospatial/terrain/mesh-stitch';

function mesh(size: number, x: number, curved = false) {
  return createTerrainMesh(
    new HeightField({
      width: size,
      height: size,
      origin: [x, 0],
      columnStep: [1 / (size - 1), 0],
      rowStep: [0, 1 / (size - 1)],
      heights: Float64Array.from({length: size * size}, (_, i) =>
        curved
          ? (Math.floor(i / size) / (size - 1)) ** 2
          : 2 * (x + (i % size) / (size - 1)) + (3 * Math.floor(i / size)) / (size - 1)
      )
    })
  );
}
function area(m: TerrainSeamMesh) {
  let result = 0;
  for (let i = 0; i < m.indices.length; i += 3) {
    const [a, b, c] = [...m.indices.slice(i, i + 3)].map(v => 3 * v);
    const triangle =
      ((m.positions[b] - m.positions[a]) * (m.positions[c + 1] - m.positions[a + 1]) -
        (m.positions[b + 1] - m.positions[a + 1]) * (m.positions[c] - m.positions[a])) /
      2;
    expect(triangle).toBeGreaterThan(0);
    result += triangle;
  }
  return result;
}
function seamEdges(m: TerrainSeamMesh, ids: Uint32Array) {
  const boundary = new Set(ids);
  const edges: string[] = [];
  for (let i = 0; i < m.indices.length; i += 3)
    for (let j = 0; j < 3; j++) {
      const a = m.indices[i + j],
        b = m.indices[i + ((j + 1) % 3)];
      if (boundary.has(a) && boundary.has(b)) edges.push([a, b].sort((x, y) => x - y).join(','));
    }
  expect(edges).toHaveLength(ids.length - 1);
  for (let i = 1; i < ids.length; i++)
    expect(edges).toContain([ids[i - 1], ids[i]].sort((x, y) => x - y).join(','));
}

test('mixed-resolution stitching inserts a conforming union without holes or overlapping triangles', () => {
  for (const [na, nb] of [
    [2, 5],
    [3, 9],
    [4, 6],
    [9, 3]
  ]) {
    const a = mesh(na, 0),
      b = mesh(nb, 1),
      original = a.positions.slice();
    const result = stitchTerrainMeshEdges(a, 'maxColumn', b, 'minColumn', {
      maxHeightAdjustment: 1e-12
    });
    expect(area(result.a)).toBeCloseTo(1, 14);
    expect(area(result.b)).toBeCloseTo(1, 14);
    seamEdges(result.a, result.seamA);
    seamEdges(result.b, result.seamB);
    for (let i = 0; i < result.seamA.length; i++) {
      const pa = result.a.positions.slice(3 * result.seamA[i], 3 * result.seamA[i] + 3),
        pb = result.b.positions.slice(3 * result.seamB[i], 3 * result.seamB[i] + 3);
      expect(pa).toEqual(pb);
      expect(pa[2]).toBeCloseTo(2 + 3 * pa[1], 14);
    }
    expect(a.positions).toEqual(original);
    expect(result.a.positions).not.toBe(a.positions);
  }
});

test('coarse authoritative profile changes fine heights only with an explicit budget', () => {
  const a = mesh(2, 0, true),
    b = mesh(5, 1, true);
  expect(() => stitchTerrainMeshEdges(a, 'maxColumn', b, 'minColumn')).toThrow(/adjustment/);
  const result = stitchTerrainMeshEdges(a, 'maxColumn', b, 'minColumn', {
    maxHeightAdjustment: 0.25
  });
  expect(result.maxHeightAdjustment).toBe(0.25);
  for (const id of result.seamB)
    expect(result.b.positions[3 * id + 2]).toBe(result.b.positions[3 * id + 1]);
});

test('reversed side ordering and distinct origins preserve exact shared XYZ', () => {
  const a = mesh(3, 0);
  const b = createTerrainMesh(
    new HeightField({
      width: 5,
      height: 5,
      origin: [2, 1],
      columnStep: [-0.25, 0],
      rowStep: [0, -0.25],
      heights: Float64Array.from(
        {length: 25},
        (_, i) => 2 * (2 - (i % 5) / 4) + 3 * (1 - Math.floor(i / 5) / 4)
      )
    }),
    {origin: [1000, -1000, 50]}
  );
  const result = stitchTerrainMeshEdges(a, 'maxColumn', b, 'maxColumn');
  expect(area(result.b)).toBe(1);
  for (let i = 0; i < result.seamA.length; i++)
    expect(result.a.positions.slice(3 * result.seamA[i], 3 * result.seamA[i] + 3)).toEqual(
      result.b.positions.slice(3 * result.seamB[i], 3 * result.seamB[i] + 3)
    );
});

test('stitching rejects holes, overlap, invalid inputs and exhausted budgets', () => {
  const a = mesh(2, 0),
    b = mesh(5, 1);
  for (const options of [
    {maxVertices: 4},
    {maxTriangles: 2},
    {maxBoundaryVertices: 2},
    {maxHeightAdjustment: -1},
    {coordinateTolerance: NaN}
  ])
    expect(() => stitchTerrainMeshEdges(a, 'maxColumn', b, 'minColumn', options)).toThrow();
  expect(() => stitchTerrainMeshEdges(a, 'maxColumn', a, 'maxColumn')).toThrow(/opposite/);
  expect(() => stitchTerrainMeshEdges(a, 'maxColumn', mesh(5, 2), 'minColumn')).toThrow(/coincide/);
  expect(() =>
    stitchTerrainMeshEdges(a, 'maxColumn', {...b, heightReference: 'other'}, 'minColumn')
  ).toThrow(/reference/);
  expect(() =>
    stitchTerrainMeshEdges(a, 'maxColumn', {...b, indices: b.indices.slice(6)}, 'minColumn')
  ).toThrow();
  expect(() =>
    stitchTerrainMeshEdges({...a, positions: new Float64Array(1)}, 'maxColumn', b, 'minColumn')
  ).toThrow();
  expect(() =>
    stitchTerrainMeshEdges(
      {...a, indices: Uint32Array.from([0, 1, 99])},
      'maxColumn',
      b,
      'minColumn'
    )
  ).toThrow();
  expect(() =>
    stitchTerrainMeshEdges(
      {...a, indices: Uint32Array.from([0, 0, 0])},
      'maxColumn',
      b,
      'minColumn'
    )
  ).toThrow();
});

test('one coarse edge stitches to two child tiles in either order, inserting missing endpoints', () => {
  const coarse = mesh(2, 0);
  const child = (row: number) =>
    createTerrainMesh(
      new HeightField({
        width: 3,
        height: 3,
        origin: [1, row / 2],
        columnStep: [0.25, 0],
        rowStep: [0, 0.25],
        heights: Float64Array.from(
          {length: 9},
          (_, i) => 2 * (1 + (i % 3) / 4) + 3 * (row / 2 + Math.floor(i / 3) / 4)
        )
      })
    );
  for (const order of [
    [0, 1],
    [1, 0]
  ]) {
    let current: TerrainSeamMesh = coarse;
    const neighbors: TerrainSeamMesh[] = [];
    for (const row of order) {
      const result = stitchTerrainMeshEdges(current, 'maxColumn', child(row), 'minColumn', {
        rangeA: [row / 2, (row + 1) / 2]
      });
      expect(result.seamA).toHaveLength(3);
      for (let i = 0; i < 3; i++)
        expect(result.a.positions.slice(3 * result.seamA[i], 3 * result.seamA[i] + 3)).toEqual(
          result.b.positions.slice(3 * result.seamB[i], 3 * result.seamB[i] + 3)
        );
      current = result.a;
      neighbors.push(result.b);
    }
    expect(area(current)).toBeCloseTo(1, 14);
    for (const neighbor of neighbors) expect(area(neighbor)).toBeCloseTo(0.25, 14);
    const ids = [...new Set(current.indices)]
      .filter(id => current.gridCoordinates[2 * id] === 1)
      .sort((a, b) => current.positions[3 * a + 1] - current.positions[3 * b + 1]);
    expect(ids.map(id => current.positions[3 * id + 1])).toEqual([0, 0.25, 0.5, 0.75, 1]);
    seamEdges(current, Uint32Array.from(ids));
  }
});

test('height budget includes inserted knots and range endpoints, not just existing B vertices', () => {
  const a = mesh(3, 0, true),
    b = mesh(2, 1, true);
  expect(() =>
    stitchTerrainMeshEdges(a, 'maxColumn', b, 'minColumn', {maxHeightAdjustment: 0.24})
  ).toThrow(/adjustment/);
  expect(
    stitchTerrainMeshEdges(a, 'maxColumn', b, 'minColumn', {maxHeightAdjustment: 0.25})
      .maxHeightAdjustment
  ).toBe(0.25);
  for (const rangeA of [
    [-1, 1],
    [1, 0],
    [0, 2],
    [0, 0],
    [NaN, 1]
  ] as const)
    expect(() => stitchTerrainMeshEdges(a, 'maxColumn', b, 'minColumn', {rangeA})).toThrow(/range/);
});

test('row seams and repeated stitching preserve a sloping surface', () => {
  const make = (size: number, y: number) =>
    createTerrainMesh(
      new HeightField({
        width: size,
        height: size,
        origin: [0, y],
        columnStep: [1 / (size - 1), 0],
        rowStep: [0, 1 / (size - 1)],
        heights: Float64Array.from(
          {length: size * size},
          (_, i) => (i % size) / (size - 1) + y + Math.floor(i / size) / (size - 1)
        )
      })
    );
  const result = stitchTerrainMeshEdges(make(3, 0), 'maxRow', make(5, 1), 'minRow');
  const again = stitchTerrainMeshEdges(result.a, 'maxRow', result.b, 'minRow');
  expect(again.a).toEqual(result.a);
  expect(again.b).toEqual(result.b);
  expect(area(result.a)).toBe(1);
  expect(area(result.b)).toBe(1);
  seamEdges(result.a, result.seamA);
  seamEdges(result.b, result.seamB);
});

test('stitching rejects boundary topology defects and checks output rather than only input capacities', () => {
  const a = mesh(4, 0),
    b = mesh(6, 1);
  // Each input fits, but the union of thirds and fifths has eight boundary vertices.
  expect(() =>
    stitchTerrainMeshEdges(a, 'maxColumn', b, 'minColumn', {
      maxBoundaryVertices: 6,
      maxHeightAdjustment: 1e-12
    })
  ).toThrow(/capacity/);
  expect(() =>
    stitchTerrainMeshEdges(mesh(2, 0), 'maxColumn', mesh(5, 1), 'minColumn', {
      maxVertices: 25,
      maxTriangles: 32
    })
  ).not.toThrow();
  expect(() =>
    stitchTerrainMeshEdges(mesh(5, 0), 'maxColumn', mesh(4, 1), 'minColumn', {
      maxVertices: 25,
      maxHeightAdjustment: 1e-12
    })
  ).toThrow(/output capacity/);
  const duplicate = {...b, indices: Uint32Array.from([...b.indices, ...b.indices.slice(3, 6)])};
  expect(() =>
    stitchTerrainMeshEdges(a, 'maxColumn', duplicate, 'minColumn', {maxHeightAdjustment: 1})
  ).toThrow(/nonmanifold/);
  const grid = Float64Array.from(b.gridCoordinates);
  grid[0] = -1;
  expect(() =>
    stitchTerrainMeshEdges(a, 'maxColumn', {...b, gridCoordinates: grid}, 'minColumn')
  ).toThrow(/grid/);
  const bent = {...b, positions: b.positions.slice()};
  bent.positions[3 * 6] += 0.01;
  expect(() => stitchTerrainMeshEdges(a, 'maxColumn', bent, 'minColumn')).toThrow(/straight/);
});
