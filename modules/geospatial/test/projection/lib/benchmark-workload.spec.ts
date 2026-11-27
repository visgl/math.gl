// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test, vi} from 'vitest';
import {geographicPoints, measureWorkload, summarize, validateOptions} from '../benchmark-workload';
import {SCENARIOS} from '../live-bench-types';
import {runLiveBenchmark} from '../live-bench';
import type {BenchmarkOptions, BenchmarkRow} from '../live-bench-types';
const options: BenchmarkOptions = {
  points: 131,
  precision: 'Float64',
  dimension: 2,
  direction: 'project'
};

test('seeded distributions are reproducible and independent of dimension', () => {
  const xy = geographicPoints(SCENARIOS[0], options);
  const xyzm = geographicPoints(SCENARIOS[0], {...options, dimension: 4});
  expect(xy).toEqual(geographicPoints(SCENARIOS[0], options));
  expect(xy).not.toEqual(geographicPoints(SCENARIOS[0], {...options, distribution: 'clustered'}));
  for (let i = 0; i < options.points; i++) {
    expect(xyzm[i * 4]).toBe(xy[i * 2]);
    expect(xyzm[i * 4 + 1]).toBe(xy[i * 2 + 1]);
    expect(xy[i * 2]).toBeGreaterThanOrEqual(-175);
    expect(xy[i * 2]).toBeLessThanOrEqual(175);
  }
});
test('statistics normalize raw aggregate samples without mutating them', () => {
  const samples = [60, 20, 40, 80, 100];
  const result = summarize(samples, 10);
  expect(result.milliseconds).toBe(6);
  expect(result.p10).toBe(2.8);
  expect(result.p90).toBe(9.2);
  expect(result.aggregateMilliseconds).toBe(60);
  expect(samples).toEqual([60, 20, 40, 80, 100]);
});
test('adaptive sampling resets independent buffers outside timing and reaches its duration', () => {
  let clock = 0;
  const now = vi.spyOn(performance, 'now').mockImplementation(() => clock);
  try {
    const source = new Float64Array([1, 2]);
    const runners = [1, 2, 3].map(duration => (buffer: Float32Array | Float64Array) => {
      expect([...buffer]).toEqual([1, 2]);
      buffer[0] = 5;
      clock += duration;
    });
    const result = measureWorkload(
      {source, runners, factories: []},
      {...options, points: 10},
      {samples: 3, minSampleMs: 12}
    );
    expect(result.iterations).toBeGreaterThanOrEqual(12);
    expect(result.timingLimited).toBe(false);
    expect(result.unstable).toBe(false);
    expect(result.measurements.map(m => m.milliseconds)).toEqual([1, 2, 3]);
    expect(source).toEqual(new Float64Array([1, 2]));
  } finally {
    now.mockRestore();
  }
});
test('coarse timers are bounded and cannot manufacture throughput', () => {
  const now = vi.spyOn(performance, 'now').mockReturnValue(0);
  try {
    const result = measureWorkload(
      {source: new Float64Array([1, 2]), runners: [() => {}], factories: []},
      options,
      {samples: 3}
    );
    expect(result.iterations).toBe(256);
    expect(result.timingLimited).toBe(true);
    expect(result.measurements[0].milliseconds).toBe(0);
  } finally {
    now.mockRestore();
  }
});
test('clustered Float32 XYZM inverse verifies every shared scenario', () => {
  const rows: BenchmarkRow[] = [];
  runLiveBenchmark(
    {
      ...options,
      dimension: 4,
      precision: 'Float32',
      direction: 'unproject',
      distribution: 'clustered'
    },
    row => rows.push(row),
    {minSampleMs: 0, samples: 3}
  );
  expect(rows).toHaveLength(SCENARIOS.length);
});
test('sampling and memory bounds reject invalid requests', () => {
  for (const sampling of [
    {samples: 2},
    {samples: 32},
    {minSampleMs: NaN},
    {minSampleMs: -1},
    {minSampleMs: 101}
  ])
    expect(() => validateOptions(options, sampling)).toThrow('Invalid benchmark options');
  expect(() => validateOptions({...options, points: 1000001})).toThrow();
});

test('variable samples and disabled calibration cannot declare a reliable winner', () => {
  let clock = 0;
  let calls = 0;
  const source = new Float64Array([1, 2]);
  const runners = [
    () => {
      clock += ++calls % 2 ? 20 : 40;
    }
  ];
  const workload = {source, runners, factories: []};
  const sampling = {samples: 7, minSampleMs: 12, now: () => clock};
  const result = measureWorkload(workload, options, sampling);
  expect(result.timingLimited).toBe(false);
  expect(result.unstable).toBe(true);
  expect(measureWorkload(workload, options, {...sampling, minSampleMs: 0}).timingLimited).toBe(
    true
  );
});
