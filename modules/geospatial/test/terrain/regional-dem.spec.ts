// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {
  HeightField,
  createTerrainGradientGrid,
  createTerrainSlopeAspectGrid,
  createTerrainIsobands
} from '@math.gl/geospatial';
import sierra from './fixtures/sierra-reference.json';
import pacific from './fixtures/pacific-reference.json';
import nodata from './fixtures/sierra-nodata-reference.json';
for (const [name, reference] of [
  ['mountain', sierra],
  ['coastal', pacific],
  ['nodata-heavy', nodata]
] as const) {
  test(`independent GDAL qualification: ${name}`, () => {
    const field = new HeightField({
      ...reference,
      origin: reference.origin as [number, number],
      columnStep: reference.columnStep as [number, number],
      rowStep: reference.rowStep as [number, number],
      registration: 'cell',
      heights: Float64Array.from(reference.heights, h => h ?? NaN)
    });
    for (const [method, algorithm] of [
      ['horn', 'Horn'],
      ['zevenbergen-thorne', 'ZevenbergenThorne']
    ] as const) {
      const result = createTerrainSlopeAspectGrid(createTerrainGradientGrid(field, {method}));
      const oracle = reference.references[algorithm];
      let compared = 0;
      for (let i = 0; i < reference.heights.length; i++) {
        expect(result.statuses[i] === 0).toBe(oracle.slope[i] !== null);
        if (oracle.slope[i] === null) continue;
        compared++;
        expect(Math.abs((result.slopes[i] * 180) / Math.PI - oracle.slope[i]!)).toBeLessThan(2e-6);
        expect(result.aspectStatuses[i] === 0).toBe(oracle.aspect[i] !== null);
        if (oracle.aspect[i] !== null) {
          const delta = Math.abs((result.aspects[i] * 180) / Math.PI - oracle.aspect[i]!);
          expect(Math.min(delta, 360 - delta)).toBeLessThan(4e-5);
        }
      }
      expect(compared).toBeGreaterThan(100);
    }
    const h = reference.heights.filter((v): v is number => v !== null);
    const min = Math.min(...h),
      max = Math.max(...h);
    const bands = createTerrainIsobands([field], [min - 1, (min + max) / 2, max + 1]);
    expect(bands.indices.length).toBeGreaterThan(0);
  });
}
