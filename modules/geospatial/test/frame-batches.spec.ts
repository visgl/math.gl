// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {Ellipsoid, LocalReferenceFrame} from '@math.gl/geospatial/ellipsoid';
import {qualifyFrameBatches, frameBatchMethods} from './frame-batch-qualification';
for (const row of qualifyFrameBatches())
  test(`G7 independent packed frame ${row.id}`, () => {
    expect(row.passed, JSON.stringify(row)).toBe(true);
  });
const frame = new LocalReferenceFrame([Math.SQRT1_2, Math.SQRT1_2, 0], {
  ellipsoid: new Ellipsoid(1, 1, 1)
});
for (const [index, method] of frameBatchMethods.entries()) {
  test(`${method} rejects invalid batches atomically and preserves overlap boundaries`, () => {
    const output = new Float64Array(6).fill(7);
    for (const input of [
      [1, 2],
      [1, 2, 3, 4, NaN, 6],
      [1, 2, 3, 4, Infinity, 6]
    ]) {
      expect(() => frame[method](input, output)).toThrow(RangeError);
      expect(Array.from(output)).toEqual([7, 7, 7, 7, 7, 7]);
    }
    expect(() => frame[method]([1, 2, 3], new Float64Array(2))).toThrow(RangeError);
    // @ts-expect-error Output precision is explicitly Float64.
    expect(() => frame[method]([1, 2, 3], new Float32Array(3))).toThrow(RangeError);
    const backing = new Float64Array([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(() => frame[method](backing.subarray(0, 6), backing.subarray(3, 9))).toThrow(/overlap/);
    expect(Array.from(backing)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(frame[method]([])).toHaveLength(0);
    expect(frame[method](new Float32Array([1, 2, 3]))).toBeInstanceOf(Float64Array);
    const max = Number.MAX_VALUE;
    const extreme = new Float64Array([0, 0, 0, ...(index % 2 ? [max, max, 0] : [max, 0, max])]);
    const before = extreme.slice();
    expect(() => frame[method](extreme, output)).toThrow(/overflow/);
    expect(Array.from(output)).toEqual([7, 7, 7, 7, 7, 7]);
    expect(() => frame[method](extreme, extreme)).toThrow(/overflow/);
    expect(extreme).toEqual(before);
  });
}
test('Packed extreme finite cancellation retains the scalar representability fix', () => {
  const e = new Ellipsoid(1, 1, 1);
  const f = new LocalReferenceFrame(e.cartographicToCartesian([-160, -70, 0]), {ellipsoid: e});
  const unit = [-1, -0.8, 0.8],
    scale = 1.6e308,
    m = f.localToFixedMatrix;
  const result = f.localToFixedVectorsFlat(unit.map(x => x * scale));
  for (let i = 0; i < 3; i++)
    expect(
      Math.abs(result[i] / scale - (m[i] * unit[0] + m[i + 4] * unit[1] + m[i + 8] * unit[2]))
    ).toBeLessThan(2e-15);
});
