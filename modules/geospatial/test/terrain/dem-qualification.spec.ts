// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {test, expect} from 'vitest';
import {HeightField} from '@math.gl/geospatial/terrain';
import {createTerrainGradientGrid} from '@math.gl/geospatial/terrain';
import {createTerrainSlopeAspectGrid} from '@math.gl/geospatial/terrain';
import {createMartiniTerrainMesh} from '@math.gl/geospatial/terrain';
import {createDelatinTerrainMesh} from '@math.gl/geospatial/terrain';
import {createTerrainMesh} from '@math.gl/geospatial/terrain';
import {reconcileTerrainVertexTiles} from '@math.gl/geospatial/terrain';
import {stitchTerrainMeshEdges} from '@math.gl/geospatial/terrain';
import {
  createTerrainContours,
  weldTerrainContourTiles,
  stitchTerrainContours
} from '@math.gl/geospatial/terrain';
import reference from './fixtures/n43-reference.json';

const heights = Float64Array.from(reference.heights, h => h ?? NaN);

test('real DEM tiled contours agree with an untiled triangle-surface reference', () => {
  // Treat the pinned raster samples as vertices so the four 17x17 tiles overlap.
  const levels = [200, 300, 400, 500];
  const full = new HeightField({
    width: 33,
    height: 33,
    heights,
    columnStep: reference.columnStep as [number, number],
    rowStep: reference.rowStep as [number, number]
  });
  const untiled = createTerrainContours(full, levels);
  const tiles = [0, 1].flatMap(column =>
    [0, 1].map(row => {
      const field = new HeightField({
        width: 17,
        height: 17,
        heights: Float64Array.from(
          {length: 17 * 17},
          (_, i) => heights[(row * 16 + Math.floor(i / 17)) * 33 + column * 16 + (i % 17)]
        ),
        origin: [column * 16 * reference.columnStep[0], row * 16 * reference.rowStep[1]],
        columnStep: reference.columnStep as [number, number],
        rowStep: reference.rowStep as [number, number]
      });
      return {column, row, contours: createTerrainContours(field, levels)};
    })
  );
  const welded = weldTerrainContourTiles(tiles, {
    width: 17,
    height: 17,
    maxPositionDifference: 1e-8
  });
  expect(welded.segments.length).toBe(untiled.segments.length);
  // Match every undirected segment by level and source-grid endpoints, allowing
  // only rounding differences in the separately prepared tile coordinates.
  const matched = new Set<number>();
  const samePoint = (a: number, b: number) =>
    Math.abs(welded.gridCoordinates[2 * a] - untiled.gridCoordinates[2 * b]) <= 1e-9 &&
    Math.abs(welded.gridCoordinates[2 * a + 1] - untiled.gridCoordinates[2 * b + 1]) <= 1e-9;
  for (let i = 0; i < welded.levelIndices.length; i++) {
    const a = welded.segments[2 * i],
      b = welded.segments[2 * i + 1];
    let match = -1;
    for (let j = 0; j < untiled.levelIndices.length; j++) {
      if (matched.has(j) || welded.levelIndices[i] !== untiled.levelIndices[j]) continue;
      const c = untiled.segments[2 * j],
        d = untiled.segments[2 * j + 1];
      if ((samePoint(a, c) && samePoint(b, d)) || (samePoint(a, d) && samePoint(b, c))) {
        match = j;
        break;
      }
    }
    expect(match, `unmatched welded segment ${i}`).toBeGreaterThanOrEqual(0);
    matched.add(match);
  }
  expect(matched.size).toBe(untiled.levelIndices.length);
  expect(stitchTerrainContours(welded).levelIndices.length).toBe(
    stitchTerrainContours(untiled).levelIndices.length
  );
  const lengths = (contours: typeof untiled) => {
    const result = new Float64Array(levels.length);
    for (let i = 0; i < contours.levelIndices.length; i++) {
      const a = contours.segments[2 * i],
        b = contours.segments[2 * i + 1];
      result[contours.levelIndices[i]] += Math.hypot(
        contours.positions[3 * a] - contours.positions[3 * b],
        contours.positions[3 * a + 1] - contours.positions[3 * b + 1]
      );
    }
    return result;
  };
  const a = lengths(untiled),
    b = lengths(welded);
  for (let i = 0; i < levels.length; i++) expect(b[i]).toBeCloseTo(a[i], 5);
});
function field() {
  return new HeightField({
    width: reference.width,
    height: reference.height,
    heights,
    origin: reference.origin as [number, number],
    columnStep: reference.columnStep as [number, number],
    rowStep: reference.rowStep as [number, number],
    registration: 'cell'
  });
}

test('real DTED DEM slopes and aspects agree with independent GDAL 3.9.3 output', () => {
  for (const [method, name] of [
    ['horn', 'Horn'],
    ['zevenbergen-thorne', 'ZevenbergenThorne']
  ] as const) {
    const result = createTerrainSlopeAspectGrid(createTerrainGradientGrid(field(), {method})),
      expected = reference.references[name];
    let compared = 0,
      missing = 0;
    for (let i = 0; i < heights.length; i++) {
      if (expected.slope[i] === null) {
        expect(result.statuses[i]).not.toBe(0);
        missing++;
        continue;
      }
      expect(result.statuses[i]).toBe(0);
      expect(Math.abs((result.slopes[i] * 180) / Math.PI - expected.slope[i]!)).toBeLessThan(2e-6);
      if (expected.aspect[i] === null) expect(result.aspectStatuses[i]).not.toBe(0);
      else {
        expect(result.aspectStatuses[i]).toBe(0);
        const delta = Math.abs((result.aspects[i] * 180) / Math.PI - expected.aspect[i]!);
        expect(Math.min(delta, 360 - delta)).toBeLessThan(4e-5);
      }
      compared++;
    }
    expect(compared).toBeGreaterThan(800);
    expect(missing).toBeGreaterThan(100);
  }
});

test('regular and adaptive meshes of a real DEM crop satisfy an independent exhaustive nodal oracle', () => {
  const crop = Float64Array.from(
    {length: 81},
    (_, i) => heights[(5 + Math.floor(i / 9)) * 33 + 5 + (i % 9)]
  );
  const source = new HeightField({width: 9, height: 9, heights: crop});
  for (const create of [
    (source: HeightField, _options: {maxError: number}) => createTerrainMesh(source),
    createMartiniTerrainMesh,
    createDelatinTerrainMesh
  ])
    for (const maxError of [0, 1, 5]) {
      const mesh = create(source, {maxError});
      for (let y = 0; y < 9; y++)
        for (let x = 0; x < 9; x++) {
          let found = false;
          for (let i = 0; i < mesh.indices.length; i += 3) {
            const [a, b, c] = [...mesh.indices.slice(i, i + 3)].map(id => 2 * id);
            const ax = mesh.gridCoordinates[a],
              ay = mesh.gridCoordinates[a + 1],
              bx = mesh.gridCoordinates[b],
              by = mesh.gridCoordinates[b + 1],
              cx = mesh.gridCoordinates[c],
              cy = mesh.gridCoordinates[c + 1];
            const determinant = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
            const u = ((by - cy) * (x - cx) + (cx - bx) * (y - cy)) / determinant,
              v = ((cy - ay) * (x - cx) + (ax - cx) * (y - cy)) / determinant,
              w = 1 - u - v;
            if (Math.min(u, v, w) < -1e-12) continue;
            const z =
              u * mesh.positions[(a / 2) * 3 + 2] +
              v * mesh.positions[(b / 2) * 3 + 2] +
              w * mesh.positions[(c / 2) * 3 + 2] +
              mesh.origin[2];
            expect(Math.abs(z - crop[y * 9 + x])).toBeLessThanOrEqual(maxError + 1e-9);
            found = true;
          }
          expect(found).toBe(true);
        }
    }
});

test('real DEM vertex-tile seams match the untiled sample reference', () => {
  const tiles = [0, 1].map(column => ({
    column,
    row: 0,
    heights: Float64Array.from(
      {length: 17 * 9},
      (_, i) => heights[(4 + Math.floor(i / 17)) * 33 + column * 16 + (i % 17)]
    )
  }));
  const result = reconcileTerrainVertexTiles(tiles, {
    width: 17,
    height: 9,
    columnStep: reference.columnStep as [number, number],
    rowStep: reference.rowStep as [number, number]
  });
  const [a, b] = result.tiles.map(t => new HeightField(t.field));
  for (let row = 0; row < 9; row++) expect(a.getHeight(16, row)).toBe(b.getHeight(0, row));
  const stitched = stitchTerrainMeshEdges(
    createTerrainMesh(a),
    'maxColumn',
    createTerrainMesh(b),
    'minColumn'
  );
  expect(stitched.maxHeightAdjustment).toBe(0);
  expect(stitched.seamA).toHaveLength(9);
});

for (const [name, x0, y0] of [
  ['western relief', 1, 2],
  ['eastern shelf', 22, 4]
] as const) {
  test(`DTED ${name}: mesh nodes agree with an independent exhaustive triangle oracle`, () => {
    const crop = Float64Array.from(
      {length: 81},
      (_, i) => reference.heights[(y0 + Math.floor(i / 9)) * 33 + x0 + (i % 9)] ?? NaN
    );
    expect(crop.every(Number.isFinite)).toBe(true);
    const source = new HeightField({
      width: 9,
      height: 9,
      heights: crop,
      columnStep: [2, 1],
      rowStep: [-1, 3]
    });
    for (const build of [
      (f: HeightField, _o: {maxError: number}) => createTerrainMesh(f),
      createMartiniTerrainMesh,
      createDelatinTerrainMesh
    ]) {
      for (const maxError of [0, 2, 10]) {
        const mesh = build(source, {maxError});
        let maximum = 0;
        for (let y = 0; y < 9; y++)
          for (let x = 0; x < 9; x++) {
            const interpolated: number[] = [];
            for (let t = 0; t < mesh.indices.length; t += 3) {
              const ids = [...mesh.indices.slice(t, t + 3)];
              const [a, b, c] = ids.map(i => [
                mesh.gridCoordinates[2 * i],
                mesh.gridCoordinates[2 * i + 1]
              ]);
              const det = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
              const u = ((b[1] - c[1]) * (x - c[0]) + (c[0] - b[0]) * (y - c[1])) / det;
              const v = ((c[1] - a[1]) * (x - c[0]) + (a[0] - c[0]) * (y - c[1])) / det;
              if (Math.min(u, v, 1 - u - v) >= -1e-12)
                interpolated.push(
                  u * mesh.positions[3 * ids[0] + 2] +
                    v * mesh.positions[3 * ids[1] + 2] +
                    (1 - u - v) * mesh.positions[3 * ids[2] + 2] +
                    mesh.origin[2]
                );
            }
            expect(interpolated.length).toBeGreaterThan(0);
            for (const z of interpolated)
              maximum = Math.max(maximum, Math.abs(z - crop[y * 9 + x]));
          }
        expect(maximum).toBeLessThanOrEqual(maxError + 1e-9);
      }
    }
  });
}

test('full pinned nodata DEM regular mesh contains exactly the valid source triangles', () => {
  const source = field(),
    mesh = createTerrainMesh(source);
  const expected = new Set<string>();
  for (let y = 0; y < 32; y++)
    for (let x = 0; x < 32; x++) {
      const a = y * 33 + x,
        b = a + 1,
        c = a + 33,
        d = c + 1;
      for (const triangle of [
        [a, b, d],
        [a, d, c]
      ])
        if (triangle.every(i => Number.isFinite(heights[i])))
          expected.add(triangle.sort((u, v) => u - v).join('/'));
    }
  const actual = new Set<string>();
  for (let i = 0; i < mesh.indices.length; i += 3)
    actual.add([...mesh.indices.slice(i, i + 3)].sort((a, b) => a - b).join('/'));
  expect(actual).toEqual(expected);
  expect(() => createMartiniTerrainMesh(source, {maxError: 1})).toThrow(/complete/);
  expect(() => createDelatinTerrainMesh(source, {maxError: 1})).toThrow(/complete/);
});
