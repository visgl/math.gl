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
import reference from './fixtures/n43-reference.json';

const heights = Float64Array.from(reference.heights, h => h ?? NaN);
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

test('adaptive meshes of a real DEM crop satisfy an independent exhaustive nodal oracle', () => {
  const crop = Float64Array.from(
    {length: 81},
    (_, i) => heights[(5 + Math.floor(i / 9)) * 33 + 5 + (i % 9)]
  );
  const source = new HeightField({width: 9, height: 9, heights: crop});
  for (const create of [createMartiniTerrainMesh, createDelatinTerrainMesh])
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
