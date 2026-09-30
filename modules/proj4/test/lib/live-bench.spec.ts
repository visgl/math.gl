// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test, vi} from 'vitest';
import {Projection} from '@math.gl/proj4';
import {runLiveBenchmark} from '../live-bench';
import type {BenchmarkOptions, BenchmarkRow} from '../live-bench-types';

for (const precision of ['Float32', 'Float64'] as const)
  for (const direction of ['project', 'unproject'] as const)
    for (const dimension of [2, 3, 4] as const)
      test(`live benchmark validates ${precision} ${dimension}D ${direction}`, () => {
        const rows: BenchmarkRow[] = [];
        const summary = runLiveBenchmark(
          {points: 131, precision, direction, dimension},
          row => rows.push(row),
          {minSampleMs: 0}
        );
        expect(rows.map(row => row.name)).toEqual([
          'Web Mercator',
          'Ellipsoidal Mercator',
          'UTM 31N',
          'UTM 56S',
          'Lambert conformal conic',
          'Albers equal area',
          'Equidistant conic',
          'Lambert azimuthal equal area',
          'Polar stereographic',
          'Equal Earth',
          'Mollweide',
          'Three-parameter datum shift',
          'Seven-parameter datum shift',
          'UTM to Web Mercator',
          'Mercator in US feet',
          'North/east axis order',
          'NTv2 horizontal grid'
        ]);
        expect(Number.isFinite(summary.checksum)).toBe(true);
        expect(summary.proj4Version).toBe('2.22.0');
        for (const row of rows) {
          expect(row.measurements).toHaveLength(3);
          for (const result of row.measurements) {
            expect(result.samples).toHaveLength(7);
            expect(result.samples.every(value => Number.isFinite(value) && value >= 0)).toBe(true);
          }
        }
      });

test('incorrect coordinates cannot produce a benchmark result', () => {
  const project = vi.spyOn(Projection.prototype, 'project').mockReturnValue([NaN, NaN]);
  const onRow = vi.fn();
  try {
    expect(() =>
      runLiveBenchmark(
        {points: 10, precision: 'Float64', direction: 'project', dimension: 2},
        onRow
      )
    ).toThrow('failed coordinate validation');
    expect(onRow).not.toHaveBeenCalled();
  } finally {
    project.mockRestore();
  }
});

test('benchmark work is bounded', () => {
  const options: BenchmarkOptions = {
    points: 1000001,
    precision: 'Float64',
    direction: 'project',
    dimension: 2
  };
  expect(() => runLiveBenchmark(options, () => {})).toThrow('Invalid benchmark options');
});
