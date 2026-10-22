// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Original unchanged-definition audit against independent native PROJ coordinates.
import * as native from '@math.gl/geospatial/projection/experimental';
import type {ProjectionPlugin} from '@math.gl/geospatial/projection/experimental';
import reference from './fixtures/pole-audit-reference.json';

type OracleRow = {
  input: number[];
  forward?: number[];
  inverse?: number[];
  inverseRejected?: boolean;
};
const projections = Object.values(native).filter((value): value is ProjectionPlugin =>
  Boolean(value && typeof value === 'object' && 'create' in value)
);

export function runPoleAudit() {
  return reference.cases.map(fixture => {
    const transform = new native.ProjectionTransform({
      from: '+proj=longlat +datum=none',
      to: fixture.definition,
      projections
    });
    const algorithm = /\+proj=(\w+)/.exec(fixture.definition)![1];
    const poleLine = ['eck6', 'eqearth', 'eqc', 'equi', 'cea', 'mill', 'robin'].includes(algorithm);
    const errors = {forward: 0, inverse: 0};
    const mismatches: {input: number[]; direction: string; error?: number; kind: string}[] = [];
    let comparisons = 0;
    let rejectedByPROJ = 0;
    for (const row of fixture.results as OracleRow[]) {
      for (const direction of ['forward', 'inverse'] as const) {
        if (direction === 'inverse' && !row.forward) continue;
        const expected = row[direction];
        const input = direction === 'forward' ? row.input : row.forward!;
        let actual: number[];
        try {
          actual = direction === 'forward' ? transform.project(input) : transform.unproject(input);
        } catch {
          if (expected) mismatches.push({input: row.input, direction, kind: 'math.gl rejects'});
          else rejectedByPROJ++;
          continue;
        }
        if (!expected) {
          rejectedByPROJ++;
          mismatches.push({input: row.input, direction, kind: 'PROJ rejects'});
          continue;
        }
        comparisons++;
        // Longitude at a collapsed pole is indeterminate. Compare its physical
        // contribution, while retaining unweighted longitude on pole-line maps.
        const longitude = Math.abs(((actual[0] - expected[0] + 540) % 360) - 180);
        const error =
          direction === 'forward'
            ? Math.max(...expected.map((v, i) => Math.abs(v - actual[i])))
            : Math.max(
                Math.abs(actual[1] - expected[1]),
                longitude * (poleLine ? 1 : Math.abs(Math.cos((expected[1] * Math.PI) / 180)))
              );
        errors[direction] = Math.max(errors[direction], error);
        const tolerance =
          direction === 'forward' ? 0.001 + 1e-12 * Math.max(...expected.map(Math.abs)) : 1e-6;
        if (error > tolerance)
          mismatches.push({input: row.input, direction, error, kind: 'numeric difference'});
      }
    }
    return {
      id: fixture.id,
      algorithm,
      definition: fixture.definition,
      probes: fixture.results.length,
      comparisons,
      rejectedByPROJ,
      errors,
      mismatches
    };
  });
}
