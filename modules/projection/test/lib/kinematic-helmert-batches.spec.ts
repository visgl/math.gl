// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original kinematic bulk Helmert arithmetic, ownership, epoch, failure and recursive-use tests. Independent PROJ anchors are maintained in the pipeline qualification fixtures.
import {expect, test} from 'vitest';
import {ProjectionPipeline} from '@math.gl/projection/pipeline';
import type {PipelineStep} from '@math.gl/projection/pipeline';

const input = {space: 'geocentric', units: ['m', 'm', 'm']} as const;
type HelmertStep = Extract<PipelineStep, {type: 'helmert'}>;
function pipeline(step: HelmertStep, general = false) {
  return new ProjectionPipeline({
    input,
    steps: general ? [step, {type: 'unitconvert', xy: {from: 'm', to: 'm'}}] : [step]
  });
}
for (const exact of [false, true]) {
  for (const convention of ['position_vector', 'coordinate_frame'] as const) {
    for (const inverse of [false, true]) {
      test(`kinematic batch preserves scalar arithmetic: ${exact}/${convention}/${inverse}`, () => {
        const step: HelmertStep = {
          type: 'helmert',
          translation: [100, -200, 30],
          rotation: exact ? [15000, -7000, 3000] : [0.12, -0.25, 0.31],
          scalePPM: 12.5,
          referenceEpoch: 2000,
          rates: {translation: [0.1, -0.2, 0.3], rotation: [0.01, -0.02, 0.03], scalePPM: 0.5},
          convention,
          exact,
          inverse
        };
        const direct = pipeline(step),
          general = pipeline(step, true);
        for (const ArrayType of [Float32Array, Float64Array]) {
          for (const dimension of [3, 4, 6]) {
            const storage = new ArrayType(dimension * 19 + 2).fill(77),
              view = storage.subarray(1, -1);
            let seed = 12345;
            for (let offset = 0; offset < view.length; offset += dimension) {
              for (let axis = 0; axis < 3; axis++) {
                seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
                view[offset + axis] = (seed / 4294967296 - 0.5) * 1e7;
              }
              if (dimension >= 4) view[offset + 3] = offset % 2 ? NaN : Infinity;
              if (dimension === 6) {
                view[offset + 4] = -0;
                view[offset + 5] = -Infinity;
              }
            }
            view[0] = -0;
            for (const reverse of [false, true]) {
              for (const epochs of [
                2020,
                new Float32Array(19).fill(2000).map((_, i) => 2000 + Math.floor(i / 2)),
                new Float64Array(19).fill(2000).map((_, i) => (i % 2 ? 2025 : 2000))
              ]) {
                const coordinates = view.slice(),
                  expected = view.slice(),
                  dispatched = view.slice();
                for (let offset = 0; offset < view.length; offset += dimension) {
                  const point = Array.from(view.subarray(offset, offset + dimension));
                  expected.set(
                    (reverse ? direct.unprojectSync : direct.projectSync)(
                      point,
                      typeof epochs === 'number' ? epochs : epochs[offset / dimension]
                    ),
                    offset
                  );
                }
                expect(
                  (reverse ? direct.unprojectFlatSync : direct.projectFlatSync)(
                    coordinates,
                    dimension,
                    epochs
                  )
                ).toBe(coordinates);
                (reverse ? general.unprojectFlatSync : general.projectFlatSync)(
                  dispatched,
                  dimension,
                  epochs
                );
                expect(Array.from(coordinates)).toEqual(Array.from(expected));
                expect(Array.from(dispatched)).toEqual(Array.from(expected));
              }
            }
            const expected = view.slice();
            direct.projectFlatSync(expected, dimension, 2030);
            expect(direct.projectFlatSync(view, dimension, 2030)).toBe(view);
            expect(Array.from(view)).toEqual(Array.from(expected));
            expect(storage[0]).toBe(77);
            expect(storage.at(-1)).toBe(77);
          }
        }
      });
    }
  }
}

for (const exact of [false, true]) {
  for (const reverse of [false, true]) {
    test(`kinematic failures preserve commits and recover: ${exact}/${reverse}`, () => {
      const direct = pipeline({
        type: 'helmert',
        translation: [1, 2, 3],
        exact,
        referenceEpoch: 2000,
        rates: {translation: [0.1, -0.2, 0.3], scalePPM: reverse ? -500000 : 1e6}
      });
      const flat = reverse ? direct.unprojectFlatSync : direct.projectFlatSync;
      const scalar = reverse ? direct.unprojectSync : direct.projectSync;
      for (const ArrayType of [Float32Array, Float64Array]) {
        for (const failure of ['epoch', 'coordinate', 'scale', 'overflow']) {
          const first = [10, 20, 30, NaN],
            tail = [40, 50, 60, Infinity];
          const failing = [
            failure === 'coordinate'
              ? NaN
              : failure === 'overflow'
                ? ArrayType === Float32Array
                  ? 3e38
                  : Number.MAX_VALUE
                : 10,
            2,
            3,
            -0
          ];
          const buffer = new ArrayType([...first, ...failing, ...tail]);
          const saved = buffer.slice();
          const epochs = new Float64Array([
            2000,
            failure === 'epoch' ? NaN : failure === 'scale' ? (reverse ? 2002 : 1999) : 2001,
            2000
          ]);
          expect(() => flat(buffer, 4, epochs)).toThrow(
            failure === 'epoch'
              ? /epoch/
              : failure === 'scale'
                ? /epoch-adjusted/
                : failure === 'overflow' && ArrayType === Float32Array
                  ? /Float32/
                  : /finite/
          );
          expect(Array.from(buffer.subarray(0, 4))).toEqual(
            Array.from(new ArrayType(scalar(first, 2000)))
          );
          expect(Array.from(buffer.subarray(4))).toEqual(Array.from(saved.subarray(4)));
          // A failed prepare must not poison the shared scalar/bulk epoch cache.
          const restored = new ArrayType(first);
          expect(flat(restored, 4, 2000)).toBe(restored);
          expect(Array.from(restored)).toEqual(Array.from(new ArrayType(scalar(first, 2000))));
        }
      }
    });
  }
}

test('kinematic epoch and XYZ failure precedence matches general dispatch', () => {
  const step: HelmertStep = {
    type: 'helmert',
    translation: [0, 0, 0],
    referenceEpoch: 2000,
    rates: {scalePPM: -1e6}
  };
  for (const general of [false, true]) {
    const direct = pipeline(step, general);
    for (const reverse of [false, true]) {
      const flat = reverse ? direct.unprojectFlatSync : direct.projectFlatSync;
      expect(() => flat(new Float64Array([NaN, 2, 3]), 3, 2001)).toThrow(
        /coordinate must be finite/
      );
      expect(() => flat(new Float64Array([NaN, 2, 3]), 3, new Float64Array([NaN]))).toThrow(
        /epoch/
      );
      expect(() => flat(new Float64Array([1, 2, 3]), 3, 2001)).toThrow(/epoch-adjusted/);
      // No coordinates means no epoch-adjusted parameter preparation.
      expect(flat(new Float64Array(0), 3, 2001)).toHaveLength(0);
      expect(flat(new Float64Array(0), 3, new Float64Array(0))).toHaveLength(0);
      expect(() => flat(new Float64Array(0), 3)).toThrow(/explicit coordinate epoch/);
      expect(() => flat(new Float64Array(0), 3, Infinity)).toThrow(/epoch/);
      expect(() => flat(new Float64Array([1, 2]), 2, 2000)).toThrow(/stride/);
      expect(() => flat(new Float64Array(4), 3, 2000)).toThrow(/stride/);
    }
  }
});

test('kinematic epoch buffers remain borrowed and cannot overlap coordinate views', () => {
  const direct = pipeline({
    type: 'helmert',
    translation: [1, 2, 3],
    referenceEpoch: 2000,
    rates: {translation: [1, 2, 3]}
  });
  for (const reverse of [false, true]) {
    const flat = reverse ? direct.unprojectFlatSync : direct.projectFlatSync;
    const storage = new Float64Array([10, 20, 30, NaN, 40, 50, 60, Infinity]);
    const saved = storage.slice();
    expect(() => flat(storage, 4, storage.subarray(0, 2))).toThrow(/overlap/);
    expect(() => flat(storage, 4, new Float64Array(1))).toThrow(/Epoch buffer/);
    expect(Array.from(storage)).toEqual(Array.from(saved));
    const epochs = new Float32Array([2000, 2020]);
    const expected = [
      ...(reverse ? direct.unprojectSync : direct.projectSync)([10, 20, 30, NaN], 2000),
      ...(reverse ? direct.unprojectSync : direct.projectSync)([40, 50, 60, Infinity], 2020)
    ];
    flat(storage, 4, epochs);
    expect(Array.from(storage)).toEqual(expected);
    expect(Array.from(epochs)).toEqual([2000, 2020]);
  }
});

test('kinematic constants snapshot caller base and rate arrays before first use', () => {
  for (const exact of [false, true]) {
    const translation = [1, 2, 3],
      rotation = [20, -35, 55];
    const translationRate = [0.1, 0.2, -0.3],
      rotationRate = [0.01, -0.02, 0.03];
    const step: HelmertStep = {
      type: 'helmert',
      translation,
      rotation,
      convention: 'position_vector',
      exact,
      referenceEpoch: 2000,
      rates: {translation: translationRate, rotation: rotationRate, scalePPM: 1}
    };
    const direct = pipeline(step);
    const reference = pipeline({
      ...step,
      translation: [...translation],
      rotation: [...rotation],
      rates: {...step.rates, translation: [...translationRate], rotation: [...rotationRate]}
    });
    translation.fill(999);
    rotation.fill(-999);
    translationRate.fill(888);
    rotationRate.fill(-888);
    for (const epoch of [2020, 2000, 2030, 2020]) {
      const buffer = new Float64Array([4000000, 1000000, 4800000, 8]);
      const expected = reference.projectSync(Array.from(buffer), epoch);
      direct.projectFlatSync(buffer, 4, epoch);
      expect(Array.from(buffer)).toEqual(expected);
      expect(direct.projectSync([4000000, 1000000, 4800000, 8], epoch)).toEqual(expected);
    }
  }
});

test('kinematic batches remain isolated inside recursive model hooks', () => {
  const inner = pipeline({
    type: 'helmert',
    translation: [1, 2, 3],
    referenceEpoch: 2000,
    rates: {translation: [0.1, -0.2, 0.3]},
    exact: true,
    convention: 'coordinate_frame'
  });
  const buffer = new Float64Array([10, 20, 30, 8, 40, 50, 60, 9]);
  const epochs = new Float64Array([2000, 2020]);
  const expected = [
    ...inner.projectSync([10, 20, 30, 8], 2000),
    ...inner.projectSync([40, 50, 60, 9], 2020)
  ];
  const outer = new ProjectionPipeline({
    input,
    steps: [
      {
        type: 'deformation',
        sourceEpoch: 2000,
        targetEpoch: 2020,
        model: {
          forward(point) {
            inner.projectFlatSync(buffer, 4, epochs);
            point.x += 1;
          },
          inverse(point) {
            inner.unprojectFlatSync(buffer, 4, epochs);
            point.x -= 1;
          }
        }
      }
    ]
  });
  expect(outer.projectSync([7, 8, 9, 10])).toEqual([8, 8, 9, 10]);
  expect(Array.from(buffer)).toEqual(expected);
  expect(outer.unprojectSync([8, 8, 9, 10])).toEqual([7, 8, 9, 10]);
  buffer.forEach((value, i) => expect(value).toBeCloseTo([10, 20, 30, 8, 40, 50, 60, 9][i], 10));
});

test('kinematic zero coefficients, omissions and extreme epochs keep scalar behavior', () => {
  for (const exact of [false, true]) {
    const step: HelmertStep = {
      type: 'helmert',
      translation: [0, -0, 0],
      rotation: [-0, 0, -0],
      convention: 'coordinate_frame',
      exact,
      referenceEpoch: 2000,
      rates: {translation: [0, 0, 0]}
    };
    const direct = pipeline(step);
    for (const reverse of [false, true]) {
      const flat = reverse ? direct.unprojectFlatSync : direct.projectFlatSync;
      const scalar = reverse ? direct.unprojectSync : direct.projectSync;
      const buffer = new Float64Array([-0, 0, -0, NaN]);
      const expected = scalar(Array.from(buffer), 2020);
      flat(buffer, 4, 2020);
      buffer.forEach((value, axis) => expect(Object.is(value, expected[axis])).toBe(true));
      const omitted = pipeline({...step, omitForward: !reverse, omitInverse: reverse});
      const omittedFlat = reverse ? omitted.unprojectFlatSync : omitted.projectFlatSync;
      const untouched = new Float64Array([-0, 0, -0, NaN]);
      expect(() => omittedFlat(untouched, 4)).toThrow(/explicit coordinate epoch/);
      expect(omittedFlat(untouched, 4, 2020)).toBe(untouched);
      expect(Object.is(untouched[0], -0)).toBe(true);
    }
    const extreme = pipeline({...step, rates: {translation: [Number.MAX_VALUE, 0, 0]}});
    const buffer = new Float64Array([1, 2, 3]);
    expect(() => extreme.projectFlatSync(buffer, 3, Number.MAX_VALUE)).toThrow(/epoch-adjusted/);
    expect(Array.from(buffer)).toEqual([1, 2, 3]);
    expect(extreme.projectFlatSync(buffer, 3, 2000)).toBe(buffer);
    expect(Array.from(buffer)).toEqual(extreme.projectSync([1, 2, 3], 2000));
  }
});
