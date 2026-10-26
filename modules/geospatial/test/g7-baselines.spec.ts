// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {prepareJobs, nativeOutputErrors, nativeOperations} from './g7-benchmark-entry';
import reference from './g7-reference.json';
for (const job of prepareJobs().filter(j => j.nativeOp))
  test(`G7 native output profile: ${job.id}`, () => {
    expect(job.errors.length).toBe(9);
    for (const error of job.errors) expect(Number.isFinite(error) && error <= 1).toBe(true);
    job.run(100);
    expect(Number.isFinite(job.checksum())).toBe(true);
  });

for (const op of nativeOperations)
  test(`G7 actual native executable answers must meet budgets: ${op}`, () => {
    const controls = reference.operations[op];
    expect(nativeOutputErrors(op, controls).every(error => error === 0)).toBe(true);
    const bad = controls.map(row => row.slice());
    bad[0][0] += 1e20;
    expect(nativeOutputErrors(op, bad)[0]).toBeGreaterThan(1);
    bad[0][0] = NaN;
    expect(nativeOutputErrors(op, bad)[0]).toBe(Infinity);
    expect(() => nativeOutputErrors(op, controls.slice(1))).toThrow('shape mismatch');
    expect(() =>
      nativeOutputErrors(
        op,
        controls.map(row => row.slice(1))
      )
    ).toThrow('shape mismatch');
  });
