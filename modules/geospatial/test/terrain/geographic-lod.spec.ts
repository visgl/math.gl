// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {
  createTerrainMesh,
  GeographicHeightField,
  HeightField,
  measureGeographicTerrainSeam,
  selectTerrainLod,
  stitchTerrainLodCut,
  TerrainSampleStatus,
  wrapTerrainLongitude,
  type TerrainLodCandidate
} from '@math.gl/geospatial/terrain';

test('wrapped seam compares mixed stencils and preserves polar and residency status', () => {
  const a = new GeographicHeightField({
    bounds: [179, 88, 180, 89],
    width: 2,
    height: 2,
    heights: Float64Array.of(0, 100, 0, 100)
  });
  const b = new GeographicHeightField({
    bounds: [-180, 88, -179, 89],
    width: 3,
    height: 2,
    heights: Float64Array.of(100, 200, 300, 100, 200, 300)
  });
  const [seam, pole] = measureGeographicTerrainSeam(a, b, [
    [540, 88.5],
    [180, 90]
  ]);
  expect(seam.heightJump).toBe(0);
  expect(seam.normalAngle).toBeGreaterThan(0);
  expect(pole.statusA).toBe(TerrainSampleStatus.OUTSIDE_DOMAIN);
  expect(pole.normalAngle).toBeNull();
  const [evicted] = measureGeographicTerrainSeam(a, null, [[180, 88.5]]);
  expect(evicted.statusB).toBe(TerrainSampleStatus.NOT_RESIDENT);
  expect(evicted.heightJump).toBeNull();
  expect(wrapTerrainLongitude(180, -180, 180)).toBe(-180);
  expect(wrapTerrainLongitude(0, 179, 181)).toBeUndefined();
});

test('LOD projection, hysteresis and missing children retain a complete resident cut', () => {
  const leaf: TerrainLodCandidate = {
    id: 'leaf',
    min: [0, 0, 0],
    max: [1, 1, 0],
    geometricError: 0,
    resident: true
  };
  const root = {...leaf, id: 'root', geometricError: 1, children: [leaf]};
  const view = {
    position: [0, 0, 55] as const,
    verticalFov: Math.PI / 2,
    viewportHeight: 1000,
    targetPixels: 10
  };
  expect(selectTerrainLod([root], view).selected[0].tile.id).toBe('root');
  const refined = selectTerrainLod([root], {...view, previouslyRefined: new Set(['root'])});
  expect(refined.selected[0].tile.id).toBe('leaf');
  expect(
    selectTerrainLod([{...root, children: [{...leaf, resident: false}]}], {
      ...view,
      position: [0, 0, 1]
    }).selected[0].tile.id
  ).toBe('root');
  expect(() => selectTerrainLod([root], {...view, position: [0, 0, 1], maxVisited: 1})).toThrow(
    /limit/
  );
});

test('sparse cut inserts only the two half-side chains and preserves total area', () => {
  const make = (width: number, height: number, x: number, y: number, step: number) =>
    createTerrainMesh(
      new HeightField({
        width,
        height,
        heights: new Float64Array(width * height),
        origin: [x, y],
        columnStep: [step, 0],
        rowStep: [0, step]
      })
    );
  const coarse = make(3, 3, 0, 0, 1);
  const south = make(3, 3, 2, 0, 0.5),
    north = make(3, 3, 2, 1, 0.5);
  const output = stitchTerrainLodCut(
    [coarse, south, north],
    [
      {a: 0, edgeA: 'maxColumn', b: 1, edgeB: 'minColumn', options: {rangeA: [0, 0.5]}},
      {a: 0, edgeA: 'maxColumn', b: 2, edgeB: 'minColumn', options: {rangeA: [0.5, 1]}}
    ]
  );
  expect(output[0].indices.length / 3).toBe(10);
  expect(output[1].indices.length / 3).toBe(8);
  expect(output[2].indices.length / 3).toBe(8);
  expect(coarse.indices.length / 3).toBe(8);
  const p = output[0].positions,
    ids = output[0].indices;
  let area = 0;
  for (let i = 0; i < ids.length; i += 3) {
    const a = 3 * ids[i],
      b = 3 * ids[i + 1],
      c = 3 * ids[i + 2];
    area += ((p[b] - p[a]) * (p[c + 1] - p[a + 1]) - (p[c] - p[a]) * (p[b + 1] - p[a + 1])) / 2;
  }
  expect(area).toBe(4);
});
