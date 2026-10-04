// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original mixed-stage arithmetic, intermediate validation, ownership, epoch and recursion tests. Benchmark anchors independently compose pinned PROJ results with an authored unit/axis oracle.
import {expect, test} from 'vitest';
import {ProjectionPipeline} from '@math.gl/projection/pipeline';
import type {PipelineStep} from '@math.gl/projection/pipeline';
const input = {space: 'geocentric', units: ['m', 'm', 'm']} as const;
type Helmert = Extract<PipelineStep, {type: 'helmert'}>;
function pipeline(steps: PipelineStep[], general = false) {
  return new ProjectionPipeline({
    input,
    steps: general
      ? [{type: 'push', components: [3]}, {type: 'pop', components: [3]}, ...steps]
      : steps
  });
}
function assertBatch(steps: PipelineStep[], epochs?: number | Float32Array | Float64Array) {
  const direct = pipeline(steps),
    general = pipeline(steps, true);
  for (const ArrayType of [Float32Array, Float64Array])
    for (const dimension of [3, 4, 6]) {
      const storage = new ArrayType(dimension * 7 + 2).fill(77),
        view = storage.subarray(1, -1);
      for (let record = 0; record < 7; record++) {
        view.set(
          [
            record % 2 ? -0 : 4000000 + record * 0.031,
            1000000 - record * 0.017,
            4800000 + record * 0.043
          ],
          record * dimension
        );
        if (dimension >= 4) view[record * dimension + 3] = record % 2 ? NaN : Infinity;
        if (dimension === 6) {
          view[record * dimension + 4] = -0;
          view[record * dimension + 5] = -Infinity;
        }
      }
      for (const inverse of [false, true]) {
        const expected = view.slice(),
          actual = view.slice(),
          dispatched = view.slice();
        const scalar = inverse ? direct.unprojectSync : direct.projectSync;
        for (let offset = 0; offset < view.length; offset += dimension)
          expected.set(
            scalar(
              Array.from(view.subarray(offset, offset + dimension)),
              typeof epochs === 'number' ? epochs : epochs?.[offset / dimension]
            ),
            offset
          );
        expect(
          (inverse ? direct.unprojectFlatSync : direct.projectFlatSync)(actual, dimension, epochs)
        ).toBe(actual);
        (inverse ? general.unprojectFlatSync : general.projectFlatSync)(
          dispatched,
          dimension,
          epochs
        );
        expect(Array.from(actual)).toEqual(Array.from(expected));
        expect(Array.from(dispatched)).toEqual(Array.from(expected));
      }
      const expected = view.slice();
      direct.projectFlatSync(expected, dimension, epochs);
      expect(direct.projectFlatSync(view, dimension, epochs)).toBe(view);
      expect(Array.from(view)).toEqual(Array.from(expected));
      expect(storage[0]).toBe(77);
      expect(storage.at(-1)).toBe(77);
    }
}
for (const rates of [false, true])
  for (const exact of [false, true])
    for (const convention of ['position_vector', 'coordinate_frame'] as const)
      for (const inverse of [false, true]) {
        test(`mixed Helmert scalar/general equality: ${rates}/${exact}/${convention}/${inverse}`, () => {
          const step: Helmert = {
            type: 'helmert',
            translation: [1.2, -2.3, 3.4],
            rotation: exact ? [15000, -7000, 3000] : [0.12, -0.25, 0.31],
            scalePPM: 12.5,
            exact,
            convention,
            inverse,
            ...(rates
              ? {
                  referenceEpoch: 2000,
                  rates: {
                    translation: [0.1, -0.2, 0.3],
                    rotation: [0.01, -0.02, 0.03],
                    scalePPM: 0.5
                  }
                }
              : {})
          };
          const steps: PipelineStep[] = [
            {type: 'unitconvert', xy: {from: 'm', to: 'ft'}, z: {from: 'm', to: 'us-ft'}},
            {
              type: 'unitconvert',
              xy: {from: 'm', to: 'ft'},
              z: {from: 'm', to: 'us-ft'},
              inverse: true
            },
            {type: 'axisswap', order: [-3, 1, -2]},
            step,
            {type: 'axisswap', order: [-3, 1, -2], inverse: true},
            {...step, inverse: !inverse},
            {type: 'unitconvert', xy: {from: 'm', to: 'ft'}, z: {from: 'm', to: 'us-ft'}}
          ];
          const modes = rates
            ? [
                2020,
                new Float32Array([2000, 2000, 2025, 2025, 2030, 2030, 2000]),
                new Float64Array([2000, 2030, 2000, 2030, 2000, 2030, 2000])
              ]
            : [undefined, 2020, new Float64Array(7).fill(2020)];
          for (const epochs of modes) assertBatch(steps, epochs);
        });
      }

test('all signed axis permutations preserve mixed Helmert arithmetic', () => {
  const permutations = [
    [1, 2, 3],
    [1, 3, 2],
    [2, 1, 3],
    [2, 3, 1],
    [3, 1, 2],
    [3, 2, 1]
  ];
  for (const axes of permutations)
    for (let mask = 0; mask < 8; mask++)
      assertBatch([
        {type: 'axisswap', order: axes.map((axis, i) => (mask & (1 << i) ? -axis : axis))},
        {
          type: 'helmert',
          translation: [0, -0, 0],
          rotation: [-0, 0, -0],
          convention: 'coordinate_frame'
        },
        {type: 'unitconvert', xy: {from: 'm', to: 'ft'}, z: {from: 'm', to: 'ft'}}
      ]);
});

test('mixed programs validate stages before cancellation or later epoch preparation', () => {
  const overflowing: PipelineStep[] = [
    {type: 'unitconvert', xy: {from: 'm', to: 'ft'}},
    {type: 'unitconvert', xy: {from: 'ft', to: 'm'}},
    {type: 'helmert', translation: [0, 0, 0], referenceEpoch: 2000, rates: {scalePPM: -1e6}}
  ];
  for (const general of [false, true]) {
    const direct = pipeline(overflowing, general),
      buffer = new Float64Array([Number.MAX_VALUE, 1, 2, 8]);
    expect(() => direct.projectFlatSync(buffer, 4, 2001)).toThrow(/coordinate must be finite/);
    expect(Array.from(buffer)).toEqual([Number.MAX_VALUE, 1, 2, 8]);
    expect(() => direct.projectFlatSync(new Float64Array([1, 2, 3]), 3, 2001)).toThrow(
      /epoch-adjusted/
    );
    expect(direct.projectFlatSync(new Float64Array(0), 3, 2001)).toHaveLength(0);
  }
  const cancels: PipelineStep[] = [
    {type: 'helmert', translation: [Number.MAX_VALUE, 0, 0]},
    {type: 'helmert', translation: [-Number.MAX_VALUE, 0, 0]}
  ];
  const direct = pipeline(cancels),
    buffer = new Float64Array([Number.MAX_VALUE, 1, 2]);
  expect(() => direct.projectFlatSync(buffer, 3)).toThrow(/finite/);
  expect(Array.from(buffer)).toEqual([Number.MAX_VALUE, 1, 2]);
});

test('mixed batches commit only complete records and round Float32 only at the end', () => {
  for (const general of [false, true]) {
    const direct = pipeline(
      [
        {type: 'helmert', translation: [1, 2, 3], scalePPM: 1e6},
        {type: 'unitconvert', xy: {from: 'm', to: 'ft'}, z: {from: 'm', to: 'ft'}}
      ],
      general
    );
    for (const ArrayType of [Float32Array, Float64Array]) {
      const original = new ArrayType([
        10,
        20,
        30,
        NaN,
        ArrayType === Float32Array ? 3e38 : Number.MAX_VALUE,
        1,
        2,
        Infinity,
        40,
        50,
        60,
        9
      ]);
      const buffer = original.slice();
      expect(() => direct.projectFlatSync(buffer, 4)).toThrow(
        ArrayType === Float32Array ? /Float32/ : /finite/
      );
      expect(Array.from(buffer.subarray(0, 4))).toEqual(
        Array.from(new ArrayType(direct.projectSync([10, 20, 30, NaN])))
      );
      expect(Array.from(buffer.subarray(4))).toEqual(Array.from(original.subarray(4)));
    }
    const rounds = pipeline(
      [
        {type: 'helmert', translation: [0, 0, 0], scalePPM: 1e6},
        {type: 'helmert', translation: [0, 0, 0], scalePPM: -500000}
      ],
      general
    );
    const buffer = new Float32Array([3e38, 1, 2]);
    expect(rounds.projectFlatSync(buffer, 3)).toBe(buffer);
    expect(Array.from(buffer)).toEqual(Array.from(new Float32Array([3e38, 1, 2])));
  }
});

test('mixed epoch failure, cache recovery and omitted directions retain contracts', () => {
  const step: Helmert = {
    type: 'helmert',
    translation: [1, 2, 3],
    referenceEpoch: 2000,
    rates: {scalePPM: -1e6}
  };
  const direct = pipeline([step, {type: 'axisswap', order: [-2, 1, 3]}]);
  const points = [10, 20, 30, 8, 40, 50, 60, NaN, 70, 80, 90, Infinity];
  for (const bad of [NaN, 2001]) {
    const buffer = new Float64Array(points),
      epochs = new Float64Array([2000, bad, 2000]);
    expect(() => direct.projectFlatSync(buffer, 4, epochs)).toThrow(/epoch/);
    expect(Array.from(buffer)).toEqual([
      ...direct.projectSync(points.slice(0, 4), 2000),
      ...points.slice(4)
    ]);
    expect(Array.from(epochs)).toEqual([2000, bad, 2000]);
    const restored = new Float64Array(points);
    direct.projectFlatSync(restored, 4, 2000);
    expect(Array.from(restored.subarray(0, 4))).toEqual(
      direct.projectSync(points.slice(0, 4), 2000)
    );
  }
  expect(() => direct.projectFlatSync(new Float64Array(0), 3)).toThrow(/explicit coordinate epoch/);
  expect(() => direct.projectFlatSync(new Float64Array(points), 4, new Float64Array(2))).toThrow(
    /Epoch buffer/
  );
  const shared = new Float64Array(points);
  expect(() => direct.projectFlatSync(shared, 4, shared.subarray(0, 3))).toThrow(/overlap/);
  const omitted = pipeline([
    {...step, omitForward: true},
    {type: 'helmert', translation: [1, 2, 3]},
    {type: 'axisswap', order: [-2, 1, 3]}
  ]);
  expect(() => omitted.projectFlatSync(new Float64Array([1, 2, 3]), 3)).toThrow(/epoch/);
  assertBatch(
    [
      {...step, omitForward: true},
      {type: 'helmert', translation: [1, 2, 3]},
      {type: 'axisswap', order: [-2, 1, 3]}
    ],
    2000
  );
});

test('mixed numeric programs snapshot constants and isolate recursive custom hooks', () => {
  const translation = [1, 2, 3],
    order = [-2, 1, 3];
  const direct = pipeline([
    {type: 'helmert', translation},
    {type: 'axisswap', order}
  ]);
  translation.fill(999);
  order.fill(1);
  const buffer = new Float64Array([10, 20, 30, 8]),
    expected = [-22, 11, 33, 8];
  const outer = pipeline([
    {
      type: 'deformation',
      sourceEpoch: 2000,
      targetEpoch: 2020,
      model: {
        forward(point) {
          direct.projectFlatSync(buffer, 4);
          point.x += 1;
        },
        inverse(point) {
          direct.unprojectFlatSync(buffer, 4);
          point.x -= 1;
        }
      }
    }
  ]);
  expect(outer.projectSync([7, 8, 9])).toEqual([8, 8, 9]);
  expect(Array.from(buffer)).toEqual(expected);
  expect(outer.unprojectSync([8, 8, 9])).toEqual([7, 8, 9]);
  expect(Array.from(buffer)).toEqual([10, 20, 30, 8]);
});
