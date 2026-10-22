// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {projectionEngine} from '@math.gl/geospatial/projection';
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
    const baseline = findings.cases[index] as {
      definition: string;
      probes: number;
      mismatches: {direction: string; kind: string; input: number[]; error?: number}[];
    };
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
      if (mismatch.error !== undefined) {
        let ceiling = previous!.error! * 1.05 + 1e-10;
        const origin = Number(/\+lat_0=([^ ]+)/.exec(row.definition)?.[1] || 0);
        if (
          row.algorithm === 'qsc' &&
          row.definition.includes('+ellps=WGS84') &&
          mismatch.direction === 'inverse' &&
          Math.abs(mismatch.input[1]) > 89.9999 &&
          origin * mismatch.input[1] < 0
        ) {
          // The raw extension outside the selected face has square-root pole
          // conditioning. Keep the existing probe, an explicit angular boundary
          // ceiling and a tight planar residual; own-face gates stay strict.
          const probe = reference.cases[index].results.find(
            p => p.input[0] === mismatch.input[0] && p.input[1] === mismatch.input[1]
          )!;
          const a = 6378137;
          expect(Math.max(...probe.forward!.map(Math.abs))).toBeGreaterThan(a);
          const transform = projectionEngine.createProjection({
            from: '+proj=longlat +datum=none',
            to: row.definition
          });
          const projected = transform.project(transform.unproject(probe.forward!));
          expect(
            Math.max(...projected.map((v, i) => Math.abs(v - probe.forward![i])))
          ).toBeLessThan(64 * Number.EPSILON * a);
          ceiling = Math.max(ceiling, (Math.sqrt(32 * Number.EPSILON) * 180) / Math.PI);
        }
        expect(mismatch.error, `${row.id}: ${JSON.stringify(mismatch)}`).toBeLessThanOrEqual(
          ceiling
        );
      }
    }
  }
});
