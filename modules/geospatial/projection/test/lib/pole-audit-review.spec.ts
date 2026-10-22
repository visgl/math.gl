// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original mathematical/domain evidence for every retained audit configuration.
import {expect, test} from 'vitest';
import {projectionEngine} from '@math.gl/geospatial/projection';
import review from '../fixtures/pole-audit-review.json';
import reference from '../fixtures/pole-audit-reference.json';
import {runPoleAudit} from '../pole-audit-workload';

const physicalError = (actual: number[], expected: number[]) =>
  Math.max(
    Math.abs(actual[1] - expected[1]),
    Math.abs(((actual[0] - expected[0] + 540) % 360) - 180) *
      Math.abs(Math.cos((expected[1] * Math.PI) / 180))
  );

test('all 49 original findings are reviewed and no accuracy-fixed configuration still fails', () => {
  expect(review.cases).toHaveLength(49);
  expect(new Set(review.cases.map(c => c.id)).size).toBe(49);
  for (const actual of runPoleAudit()) {
    if (!actual.mismatches.length) continue;
    const disposition = review.cases.find(c => c.id === actual.id);
    expect(disposition, actual.id).toBeDefined();
    expect(disposition!.category).not.toBe('accuracy-fixed');
    expect(disposition!.definition).toBe(actual.definition);
  }
});

for (const entry of review.cases) {
  test(`reviewed boundary evidence: ${entry.id} (${entry.category})`, () => {
    const fixture = reference.cases.find(c => c.id === entry.id)!;
    const transform = projectionEngine.createProjection({
      from: '+proj=longlat +datum=none',
      to: fixture.definition
    });
    for (const finding of entry.originalFindings) {
      const row = fixture.results.find(
        r => r.input[0] === finding.input[0] && r.input[1] === finding.input[1]
      )!;
      expect(row).toBeDefined();
      const latitude = row.input[1];
      const x0 = Number(/\+x_0=([^ ]+)/.exec(fixture.definition)?.[1] || 0);
      if (entry.algorithm === 'geos') {
        const longitude = (row.input[0] * Math.PI) / 180;
        const satelliteRadius = 1 + 35785831 / 6371000;
        expect(
          satelliteRadius * Math.cos((latitude * Math.PI) / 180) * Math.cos(longitude) - 1
        ).toBeLessThan(0);
        expect(() => transform.project(row.input)).toThrow();
        expect(Math.abs(row.inverse![1] - latitude)).toBeGreaterThan(10);
      } else if (
        entry.algorithm === 'merc' ||
        entry.category === 'singular-antipode' ||
        entry.category === 'nonunique-antipode'
      ) {
        expect(Math.abs(latitude)).toBe(90);
        expect(() => transform.project(row.input)).toThrow();
        expect(
          transform.project([row.input[0], latitude * (89.999999 / 90)]).every(Number.isFinite)
        ).toBe(true);
      } else if (entry.algorithm === 'moll') {
        expect(Math.abs(latitude)).toBe(90);
        const actual = transform.project(row.input);
        const a = fixture.definition.includes('+R=') ? 6371000 : 6378137;
        expect(Math.abs(actual[0] - x0)).toBeLessThan(1e-8);
        expect(Math.abs(actual[1] - Math.sign(latitude) * Math.SQRT2 * a)).toBeLessThan(1e-8);
      } else if (entry.algorithm === 'robin') {
        expect(Math.abs(latitude % 5)).toBe(0);
        const actual = transform.unproject(row.forward!);
        expect(physicalError(actual, row.input)).toBeLessThan(1e-8);
      } else if (entry.category === 'native-inverse-failure' || entry.category === 'rounded-limb') {
        expect(Math.abs(latitude)).toBeGreaterThan(89.9999);
        const actual = transform.unproject(row.forward!);
        expect(physicalError(actual, row.input)).toBeLessThan(2e-6);
        const reprojection = transform.project(actual);
        expect(Math.max(...reprojection.map((v, i) => Math.abs(v - row.forward![i])))).toBeLessThan(
          0.001
        );
      } else if (entry.algorithm === 'aea') {
        expect(Math.abs(latitude)).toBe(89.99);
        expect(Math.abs(row.inverse![1])).toBe(90);
        expect(physicalError(transform.unproject(row.forward!), row.input)).toBeLessThan(1e-8);
      } else if (entry.algorithm === 'cea' || entry.algorithm === 'eqearth') {
        expect(Math.abs(latitude)).toBeGreaterThan(89.99999);
        const actual = transform.unproject(row.forward!);
        expect(Math.abs(Math.abs(actual[1]) - 90)).toBeLessThan(1e-10);
        expect(Math.abs(Math.abs(row.inverse![1]) - 90)).toBeGreaterThan(1e-6);
      } else if (entry.algorithm === 'qsc') {
        const origin = Number(/\+lat_0=([^ ]+)/.exec(fixture.definition)![1]);
        expect(latitude * origin).toBeLessThan(0);
        expect(Math.max(...row.forward!.map(Math.abs))).toBeGreaterThan(6378137);
      } else {
        // Only a narrow polar boundary is reviewed for these numerical findings.
        expect(Math.abs(latitude)).toBeGreaterThan(89.9999);
      }
    }
  });
}
