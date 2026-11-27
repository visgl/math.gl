// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {HeightField, updateTerrainValidDomainMeshRegions} from '@math.gl/geospatial/terrain';

test('adaptive nodata edits match full regional rebuild and share untouched regions', () => {
  const heights = Float64Array.from({length: 81}, (_, i) => Math.sin(i) * 8);
  const field = () => new HeightField({width: 9, height: 9, heights, origin: [100, 200]});
  const options = {cellsPerRegion: 4, maxError: 1};
  const previous = updateTerrainValidDomainMeshRegions(null, field(), [], options);
  heights[2 * 9 + 4] = NaN;
  const dirty = [{minColumn: 4, maxColumn: 4, minRow: 2, maxRow: 2}];
  const nextField = field();
  const next = updateTerrainValidDomainMeshRegions(previous, nextField, dirty, options);
  const full = updateTerrainValidDomainMeshRegions(null, nextField, [], options);
  expect([...next.rebuilt]).toEqual([0, 1]);
  expect(next.regions[2]).toBe(previous.regions[2]);
  expect(next.regions.map(r => r.data)).toEqual(full.regions.map(r => r.data));
  expect(next.regions[0].data.indices.length).toBeGreaterThan(0);
  expect(() =>
    updateTerrainValidDomainMeshRegions(previous, nextField, dirty, {...options, maxTests: 1})
  ).toThrow(/budget/);
  expect([
    ...updateTerrainValidDomainMeshRegions(next, nextField, [], {...options, maxError: 2}).rebuilt
  ]).toEqual([0, 1, 2, 3]);
});
