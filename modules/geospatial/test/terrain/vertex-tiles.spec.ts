// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';
import {HeightField} from '@math.gl/geospatial/terrain';
import {reconcileTerrainVertexTiles} from '@math.gl/geospatial/terrain';
import {createTerrainMesh} from '@math.gl/geospatial/terrain';
import {stitchTerrainMeshEdges} from '@math.gl/geospatial/terrain';

const tile = (column: number, row: number, offset = 0) => ({
  column,
  row,
  heights: Float64Array.from(
    {length: 9},
    (_, i) => column * 2 + (i % 3) + 2 * (row * 2 + Math.floor(i / 3)) + offset
  )
});

test('vertex tiles reconcile edges and four-way corners independently of arrival order', () => {
  const tiles = [tile(0, 0), tile(1, 0, 0.25), tile(0, 1, 0.5), tile(1, 1, 0.75)];
  const options = {
    width: 3,
    height: 3,
    maxHeightDifference: 1,
    origin: [1e6, -2e6] as const,
    columnStep: [2, 1] as const,
    rowStep: [-1, 2] as const
  };
  const result = reconcileTerrainVertexTiles(tiles, options);
  expect(reconcileTerrainVertexTiles([...tiles].reverse(), options)).toEqual(result);
  expect(result.sharedVertices).toBe(9);
  expect(result.maxHeightDifference).toBe(0.75);
  const fields = result.tiles.map(t => new HeightField(t.field));
  for (const f of fields) expect(f.getHeight(f.origin[0] === 1e6 ? 2 : 0, 0)).not.toBeUndefined();
  expect(result.tiles[3].field.heights[0]).toBe(6);
  expect(tiles[3].heights[0]).toBe(6.75);
  expect(result.tiles[0].field.heights).not.toBe(tiles[0].heights);
});

test('missing shared vertices stay missing in every tile, without filling holes', () => {
  const left = tile(-1, 0),
    right = {...tile(0, 0), validity: new Uint8Array(9).fill(1)};
  right.validity[3] = 0;
  left.heights[8] = NaN;
  const result = reconcileTerrainVertexTiles([right, left], {width: 3, height: 3});
  const [a, b] = result.tiles.map(t => new HeightField(t.field));
  expect(a.getHeight(2, 1)).toBeUndefined();
  expect(b.getHeight(0, 1)).toBeUndefined();
  expect(a.getHeight(2, 2)).toBeUndefined();
  expect(b.getHeight(0, 2)).toBeUndefined();
  expect(a.getHeight(1, 1)).toBe(1);
});

test('same-level reconciled regular meshes share identical edges in a rotated affine frame', () => {
  const result = reconcileTerrainVertexTiles([tile(1, 0, 0.125), tile(0, 0)], {
    width: 3,
    height: 3,
    maxHeightDifference: 0.125,
    columnStep: [2, 1],
    rowStep: [-1, 2]
  });
  const [a, b] = result.tiles.map(t => createTerrainMesh(new HeightField(t.field)));
  const stitched = stitchTerrainMeshEdges(a, 'maxColumn', b, 'minColumn');
  expect(stitched.a.indices).toEqual(a.indices);
  expect(stitched.b.indices).toEqual(b.indices);
  expect(stitched.maxHeightAdjustment).toBe(0);
  for (let i = 0; i < stitched.seamA.length; i++)
    expect(stitched.a.positions.slice(3 * stitched.seamA[i], 3 * stitched.seamA[i] + 3)).toEqual(
      stitched.b.positions.slice(3 * stitched.seamB[i], 3 * stitched.seamB[i] + 3)
    );
});

test('vertex reconciliation rejects conflicting metadata and respects admission limits', () => {
  const options = {width: 3, height: 3};
  expect(() => reconcileTerrainVertexTiles([tile(0, 0), tile(1, 0, 1)], options)).toThrow(
    /disagreement/
  );
  expect(() => reconcileTerrainVertexTiles([tile(0, 0), tile(0, 0)], options)).toThrow(/duplicate/);
  for (const patch of [
    {width: 1},
    {height: NaN},
    {maxSamples: 8},
    {maxTiles: 0},
    {maxHeightDifference: -1},
    {columnStep: [0, 0] as const},
    {origin: [Infinity, 0] as const}
  ])
    expect(() => reconcileTerrainVertexTiles([tile(0, 0)], {...options, ...patch})).toThrow();
  for (const bad of [
    {...tile(0, 0), column: 0.5},
    {...tile(0, 0), row: Number.MAX_SAFE_INTEGER},
    {...tile(0, 0), heights: new Float64Array(8)},
    {...tile(0, 0), validity: new Uint8Array(8)}
  ])
    expect(() => reconcileTerrainVertexTiles([bad], options)).toThrow();
  expect(reconcileTerrainVertexTiles([], options).tiles).toEqual([]);
  expect(
    reconcileTerrainVertexTiles([tile(0, 0)], {...options, maxSamples: 9, maxTiles: 1}).tiles
  ).toHaveLength(1);
});

test('same-level planar sampling and metric gradients agree with an untiled affine reference', () => {
  const result = reconcileTerrainVertexTiles([tile(1, 0), tile(0, 0)], {
    width: 3,
    height: 3,
    columnStep: [2, 1],
    rowStep: [-1, 2]
  });
  const [a, b] = result.tiles.map(t => new HeightField(t.field));
  const reference = new HeightField({
    width: 5,
    height: 3,
    columnStep: [2, 1],
    rowStep: [-1, 2],
    heights: Float64Array.from({length: 15}, (_, i) => (i % 5) + 2 * Math.floor(i / 5))
  });
  for (const row of [0, 0.25, 1, 1.75, 2]) {
    const x = 4 - row,
      y = 2 + 2 * row;
    const expected = reference.sample(x, y);
    for (const surface of [a, b]) {
      const value = surface.sample(x, y);
      expect(value.status).toBe(0);
      expect(value.height).toBeCloseTo(expected.height, 14);
      expect(value.gradientX).toBeCloseTo(expected.gradientX, 14);
      expect(value.gradientY).toBeCloseTo(expected.gradientY, 14);
    }
  }
});
