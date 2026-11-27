// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {projectionEngine} from '@math.gl/geospatial/projection';
import {runPoleAudit, consumePoleFinding, conePoleRetainsLongitude} from '../pole-audit-workload';
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
      mismatches: {
        direction: string;
        kind: string;
        input: number[];
        error?: number;
      }[];
    };
    expect(row.definition).toBe(baseline.definition);
    expect(row.probes).toBe(baseline.probes);
    // These are retained audit findings, not successful accuracy qualifications.
    // Fixes may remove them; a new coordinate, rejection, or larger discrepancy
    // requires explicit review rather than silently widening a global tolerance.
    const remaining = [...baseline.mismatches];
    const exact = (a: (typeof remaining)[number], b: (typeof remaining)[number]) =>
      a.direction === b.direction &&
      a.kind === b.kind &&
      a.input[0] === b.input[0] &&
      a.input[1] === b.input[1];
    // Reserve exact coordinates first, then consume each portable boundary
    // allowance once. One finding must never permit failures to spread.
    const ordered = [...row.mismatches].sort(
      (a, b) =>
        Number(baseline.mismatches.some(m => exact(m, b))) -
          Number(baseline.mismatches.some(m => exact(m, a))) || (b.error || 0) - (a.error || 0)
    );
    for (const mismatch of ordered) {
      const previous = consumePoleFinding(remaining, mismatch);
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

test('near-pole baseline allowances cannot be reused for additional meridians', () => {
  const entry = {
    direction: 'inverse',
    kind: 'numeric difference',
    input: [0, 89.999999],
    error: 2e-6
  };
  const remaining = [entry];
  expect(consumePoleFinding(remaining, {...entry, input: [30, 89.999999]})).toBe(entry);
  expect(consumePoleFinding(remaining, {...entry, input: [60, 89.999999]})).toBeUndefined();
  expect(consumePoleFinding([entry], {...entry, input: [30, 80]})).toBeUndefined();
  expect(consumePoleFinding([entry], {...entry, kind: 'math.gl rejects'})).toBeUndefined();
});

test('conic audit retains longitude on arcs and ignores longitude only at collapsed poles', () => {
  for (const algorithm of ['aea', 'eqdc']) {
    for (const sign of [-1, 1]) {
      const create = (parallels: string) =>
        projectionEngine.createProjection({
          from: '+proj=longlat +datum=none',
          to: `+proj=${algorithm} ${parallels} +ellps=WGS84 +units=m`
        });
      const ordinary = create(`+lat_1=${sign * 20} +lat_2=${sign * 50}`);
      for (const latitude of [-90, 90]) {
        expect(conePoleRetainsLongitude(p => ordinary.project(p), latitude)).toBe(true);
      }
      // A conformal cone supplies an accepted collapsed-pole control; Albers
      // and equidistant conic reject the limiting standard parallel at 90°.
      const polar = projectionEngine.createProjection({
        from: '+proj=longlat +datum=none',
        to: `+proj=lcc +lat_1=${sign * 20} +lat_2=${sign * 50} +ellps=WGS84`
      });
      expect(conePoleRetainsLongitude(p => polar.project(p), sign * 90)).toBe(false);
    }
  }
});
