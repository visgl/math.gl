// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {compileResolvedScale} from '@math.gl/core/color';
import {SCALE_CONFORMANCE_CASES} from '../src/scales/conformance';

for (const fixture of SCALE_CONFORMANCE_CASES) {
  test(`portable scale conformance: ${fixture.id}`, () => {
    // Also exercise the descriptor's worker/JSON boundary.
    expect(JSON.parse(JSON.stringify(fixture))).toEqual(fixture);
    const {descriptor} = fixture;
    const scale = compileResolvedScale(
      {...descriptor, domain: {type: 'fixed', values: descriptor.domain}},
      descriptor.domain,
      descriptor.thresholds
    );
    for (const {input, expected} of fixture.samples) {
      const actual = scale.sample(input);
      if (expected === null) {
        expect(actual).toBeNull();
      } else if (typeof expected === 'number') {
        expect(typeof actual).toBe('number');
        expect(Math.abs((actual as number) - expected)).toBeLessThanOrEqual(
          fixture.absoluteTolerance
        );
      } else {
        expect(Array.isArray(actual)).toBe(true);
        expect(actual).toHaveLength(expected.length);
        expected.forEach((channel, index) => {
          expect(Math.abs((actual as readonly number[])[index]! - channel)).toBeLessThanOrEqual(
            fixture.absoluteTolerance
          );
        });
      }
    }
  });
}

test('duplicate quantile breaks resolve to the portable conformance descriptor', () => {
  const fixture = SCALE_CONFORMANCE_CASES.find(
    candidate => candidate.id === 'quantile-boundary-after-duplicate-removal'
  )!;
  const scale = compileResolvedScale(
    {
      type: 'quantile',
      domain: {type: 'fixed', values: [0, 10]},
      range: {
        type: 'colors',
        values: [
          [0, 0, 0, 1],
          [1, 0, 0, 1],
          [1, 1, 1, 1]
        ]
      }
    },
    [0, 10],
    [5, 5]
  );
  expect(scale.descriptor).toEqual(fixture.descriptor);
});
