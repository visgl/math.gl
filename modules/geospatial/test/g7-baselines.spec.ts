// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {prepareJobs} from './g7-benchmark-entry';
for (const job of prepareJobs().filter(j => j.nativeOp))
  test(`G7 native output profile: ${job.id}`, () => {
    expect(job.errors.length).toBe(9);
    for (const error of job.errors) expect(Number.isFinite(error) && error <= 1).toBe(true);
    job.run(100);
    expect(Number.isFinite(job.checksum())).toBe(true);
  });
