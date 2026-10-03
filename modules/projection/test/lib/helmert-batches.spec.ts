// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original bulk Helmert arithmetic, ownership, epoch, failure and recursive-use tests. Independent PROJ anchors are maintained in the pipeline qualification fixtures.
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
      test(`Helmert batch preserves scalar arithmetic: ${exact}/${convention}/${inverse}`, () => {
        const step: HelmertStep = {
          type: 'helmert',
          translation: [100, -200, 30],
          rotation: exact ? [15000, -7000, 3000] : [0.12, -0.25, 0.31],
          scalePPM: 12.5,
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
              const coordinates = view.slice(),
                expected = view.slice(),
                dispatched = view.slice();
              for (let offset = 0; offset < view.length; offset += dimension) {
                const point = Array.from(view.subarray(offset, offset + dimension));
                expected.set((reverse ? direct.unprojectSync : direct.projectSync)(point), offset);
              }
              expect(
                (reverse ? direct.unprojectFlatSync : direct.projectFlatSync)(
                  coordinates,
                  dimension
                )
              ).toBe(coordinates);
              (reverse ? general.unprojectFlatSync : general.projectFlatSync)(
                dispatched,
                dimension
              );
              expect(Array.from(coordinates)).toEqual(Array.from(expected));
              expect(Array.from(dispatched)).toEqual(Array.from(expected));
            }
            const expected = view.slice();
            direct.projectFlatSync(expected, dimension);
            expect(direct.projectFlatSync(view, dimension)).toBe(view);
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
  test('Helmert batch preserves completed records on non-finite input/output: ' + exact, () => {
    for (const reverse of [false, true]) {
      const direct = pipeline({
        type: 'helmert',
        translation: [1, 2, 3],
        scalePPM: reverse ? -500000 : 1e6,
        exact
      });
      const operation = reverse ? direct.unprojectFlatSync : direct.projectFlatSync;
      const scalar = reverse ? direct.unprojectSync : direct.projectSync;
      for (const failing of [
        [NaN, 2, 3, 8],
        [1, Infinity, 3, 8],
        [1, 2, -Infinity, 8],
        [Number.MAX_VALUE, 2, 3, 8]
      ]) {
        const first = [10, 20, 30, 7],
          tail = [40, 50, 60, 9];
        const view = new Float64Array([...first, ...failing, ...tail]);
        expect(() => operation(view, 4)).toThrow(/finite/);
        expect(Array.from(view)).toEqual([...scalar(first), ...failing, ...tail]);
        const restored = new Float64Array(first);
        expect(operation(restored, 4)).toBe(restored);
        expect(Array.from(restored)).toEqual(scalar(first));
      }
    }
  });

  test('Helmert batch checks Float32 overflow before writing XYZ: ' + exact, () => {
    for (const reverse of [false, true]) {
      const direct = pipeline({
        type: 'helmert',
        translation: [1, 2, 3],
        scalePPM: reverse ? -500000 : 1e6,
        exact
      });
      const buffer = new Float32Array([10, 20, 30, 7, 3e38, 2, 3, 8, 40, 50, 60, 9]);
      const saved = buffer.slice();
      expect(() =>
        (reverse ? direct.unprojectFlatSync : direct.projectFlatSync)(buffer, 4)
      ).toThrow(/Float32/);
      const first = new Float32Array(
        (reverse ? direct.unprojectSync : direct.projectSync)([10, 20, 30, 7])
      );
      expect(Array.from(buffer.subarray(0, 4))).toEqual(Array.from(first));
      expect(Array.from(buffer.subarray(4))).toEqual(Array.from(saved.subarray(4)));
    }
  });

  test('static Helmert validates explicit epoch buffers but does not use M: ' + exact, () => {
    const direct = pipeline({type: 'helmert', translation: [1, 2, 3], exact});
    for (const reverse of [false, true]) {
      const operation = reverse ? direct.unprojectFlatSync : direct.projectFlatSync;
      const scalar = reverse ? direct.unprojectSync : direct.projectSync;
      const points = [10, 20, 30, NaN, 40, 50, 60, Infinity, 70, 80, 90, 9];
      const view = new Float64Array(points),
        epochs = new Float64Array([2000, NaN, 2020]);
      expect(() => operation(view, 4, epochs)).toThrow(/epoch/);
      expect(Array.from(view)).toEqual([...scalar(points.slice(0, 4)), ...points.slice(4)]);
      expect(Array.from(epochs)).toEqual([2000, NaN, 2020]);
      expect(() => operation(new Float64Array(points), 4, Infinity)).toThrow(/epoch/);
      const shared = new Float64Array(12);
      expect(() => operation(shared, 4, shared.subarray(0, 3))).toThrow(/overlap/);
      expect(() => operation(new Float64Array(points), 4, new Float64Array(2))).toThrow(
        /Epoch buffer/
      );
      for (const epoch of [undefined, 2020, new Float32Array([2000, 2010, 2020])]) {
        const valid = new Float64Array(points);
        operation(valid, 4, epoch);
        expect(Array.from(valid.subarray(0, 4))).toEqual(scalar(points.slice(0, 4)));
      }
    }
  });
}

test('omitted Helmert directions and invalid strides retain existing contracts', () => {
  for (const omitForward of [false, true]) {
    const direct = pipeline({
      type: 'helmert',
      translation: [1, 2, 3],
      omitForward,
      omitInverse: !omitForward
    });
    const buffer = new Float64Array([10, 20, 30, 8]);
    const operation = omitForward ? direct.projectFlatSync : direct.unprojectFlatSync;
    expect(operation(buffer, 4)).toBe(buffer);
    expect(Array.from(buffer)).toEqual([10, 20, 30, 8]);
    expect(() => operation(new Float64Array([Infinity, 2, 3]), 3)).toThrow(/finite/);
  }
  const direct = pipeline({type: 'helmert', translation: [1, 2, 3]});
  expect(() => direct.projectFlatSync(new Float64Array([1, 2]), 2)).toThrow(/stride/);
  expect(() => direct.projectFlatSync(new Float64Array(4), 3)).toThrow(/stride/);
  expect(direct.projectFlatSync(new Float64Array(0), 3)).toHaveLength(0);
});

test('direct Helmert batches remain isolated during recursive pipeline hooks', () => {
  const inner = pipeline({
    type: 'helmert',
    translation: [1, 2, 3],
    rotation: [20, -35, 55],
    convention: 'coordinate_frame',
    exact: true
  });
  const buffer = new Float64Array([10, 20, 30, 8, 40, 50, 60, 9]);
  const expected = [...inner.projectSync([10, 20, 30, 8]), ...inner.projectSync([40, 50, 60, 9])];
  const outer = new ProjectionPipeline({
    input,
    steps: [
      {
        type: 'deformation',
        sourceEpoch: 2000,
        targetEpoch: 2020,
        model: {
          forward(point) {
            inner.projectFlatSync(buffer, 4);
            point.x += 1;
          },
          inverse(point) {
            inner.unprojectFlatSync(buffer, 4);
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

test('Helmert batch constants snapshot caller parameter arrays before first use', () => {
  for (const exact of [false, true]) {
    const translation = [1, 2, 3],
      rotation = [20, -35, 55];
    const direct = pipeline({
      type: 'helmert',
      translation,
      rotation,
      convention: 'position_vector',
      exact
    });
    const reference = pipeline({
      type: 'helmert',
      translation: [...translation],
      rotation: [...rotation],
      convention: 'position_vector',
      exact
    });
    translation.fill(999);
    rotation.fill(-999);
    const buffer = new Float64Array([4000000, 1000000, 4800000, 8]);
    const expected = reference.projectSync(Array.from(buffer));
    direct.projectFlatSync(buffer, 4);
    expect(Array.from(buffer)).toEqual(expected);
    expect(direct.projectSync([4000000, 1000000, 4800000, 8])).toEqual(expected);
  }
});

test('static specialized direction still requires epochs when an omitted rate step declares them', () => {
  const direct = new ProjectionPipeline({
    input,
    steps: [
      {type: 'helmert', translation: [1, 2, 3]},
      {
        type: 'helmert',
        translation: [0, 0, 0],
        referenceEpoch: 2000,
        rates: {translation: [0, 0, 0]},
        omitForward: true
      }
    ]
  });
  const buffer = new Float64Array([10, 20, 30, 8]);
  expect(() => direct.projectFlatSync(buffer, 4)).toThrow(/explicit coordinate epoch/);
  expect(Array.from(buffer)).toEqual([10, 20, 30, 8]);
  expect(() => direct.projectFlatSync(buffer, 4, new Float64Array([NaN]))).toThrow(/epoch/);
  expect(Array.from(buffer)).toEqual([10, 20, 30, 8]);
  expect(direct.projectFlatSync(buffer, 4, new Float64Array([2020]))).toBe(buffer);
  expect(Array.from(buffer)).toEqual([11, 22, 33, 8]);
});
