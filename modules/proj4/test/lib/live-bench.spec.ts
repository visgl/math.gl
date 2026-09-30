// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test, vi} from 'vitest';
import {Proj4Projection} from '@math.gl/proj4';
import {runLiveBenchmark} from '../live-bench';
import type {BenchmarkOptions, BenchmarkRow} from '../live-bench-types';

for (const precision of ['Float32', 'Float64'] as const)
  for (const direction of ['project', 'unproject'] as const)
    for (const dimension of [2, 3, 4] as const)
      test(`live benchmark validates ${precision} ${dimension}D ${direction}`, () => {
        const rows: BenchmarkRow[] = [];
        const summary = runLiveBenchmark({points: 37, precision, direction, dimension}, row =>
          rows.push(row)
        );
        expect(rows.map(row => row.name)).toEqual([
          'Web Mercator',
          'UTM 31N',
          'Lambert conformal conic'
        ]);
        expect(Number.isFinite(summary.checksum)).toBe(true);
        expect(summary.proj4Version).toBe('2.22.0');
        for (const row of rows) {
          expect(row.measurements).toHaveLength(4);
          for (const result of row.measurements) {
            expect(result.samples).toHaveLength(7);
            expect(result.samples.every(value => Number.isFinite(value) && value >= 0)).toBe(true);
          }
        }
      });

test('incorrect coordinates cannot produce a benchmark result', () => {
  const project = vi.spyOn(Proj4Projection.prototype, 'project').mockReturnValue([NaN, NaN]);
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
    points: 50001,
    precision: 'Float64',
    direction: 'project',
    dimension: 2
  };
  expect(() => runLiveBenchmark(options, () => {})).toThrow('Invalid benchmark options');
});
