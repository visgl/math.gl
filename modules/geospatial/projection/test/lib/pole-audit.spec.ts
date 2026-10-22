// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {runPoleAudit} from '../pole-audit-workload';
import reference from '../fixtures/pole-audit-reference.json';
import findings from '../fixtures/pole-audit-findings.json';

test('native PROJ audit retains every probe and permits no new or worsening findings', () => {
  expect(reference.pyproj).toBe('3.7.2');
  expect(reference.proj).toBe('9.5.1');
  expect(findings.referenceSourceSHA256).toBe(reference.sourceSHA256);
  expect(findings.referenceGeneratorSHA256).toBe(reference.generatorSHA256);
  const actual = runPoleAudit();
  expect(actual.map(c => c.id)).toEqual(findings.cases.map(c => c.id));
  expect(actual.reduce((n, c) => n + c.probes, 0)).toBe(
    reference.cases.reduce((n, c) => n + c.results.length, 0)
  );
  for (const [index, row] of actual.entries()) {
    const baseline = findings.cases[index];
    expect(row.definition).toBe(baseline.definition);
    expect(row.probes).toBe(baseline.probes);
    // These are retained audit findings, not successful accuracy qualifications.
    // Fixes may remove them; a new coordinate, rejection, or larger discrepancy
    // requires explicit review rather than silently widening a global tolerance.
    for (const mismatch of row.mismatches) {
      const previous =
        baseline.mismatches.find(
          m =>
            m.direction === mismatch.direction &&
            m.kind === mismatch.kind &&
            m.input[0] === mismatch.input[0] &&
            m.input[1] === mismatch.input[1]
        ) ||
        (mismatch.kind === 'numeric difference' && Math.abs(mismatch.input[1]) > 89.9999
          ? // Different JS engines can move a roundoff-conditioned pole finding
            // between meridians. Retain the same boundary and its measured ceiling;
            // never use this allowance for a new rejection or an interior point.
            baseline.mismatches
              .filter(
                m =>
                  m.kind === mismatch.kind &&
                  m.direction === mismatch.direction &&
                  Math.abs(m.input[1] - mismatch.input[1]) < 1e-5
              )
              .sort((a, b) => (b.error || 0) - (a.error || 0))[0]
          : undefined);
      expect(previous, `${row.id}: ${JSON.stringify(mismatch)}`).toBeDefined();
      if (mismatch.error !== undefined)
        expect(mismatch.error).toBeLessThanOrEqual(previous!.error! * 1.05 + 1e-10);
    }
  }
});
