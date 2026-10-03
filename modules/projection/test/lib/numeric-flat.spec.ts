// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original unit/axis batch rounding, permutation, epoch and commit contract tests.
import {expect, test} from 'vitest';
import {ProjectionPipeline} from '@math.gl/projection/pipeline';
import type {PipelineStep, PipelineUnit} from '@math.gl/projection/pipeline';

const xyz = {space: 'geocentric', units: ['m', 'm', 'm']} as const;
const permutations = [
  [1, 2, 3],
  [1, 3, 2],
  [2, 1, 3],
  [2, 3, 1],
  [3, 1, 2],
  [3, 2, 1]
];
for (const permutation of permutations) {
  for (let mask = 0; mask < 8; mask++) {
    const order = permutation.map((axis, index) => (mask & (1 << index) ? -axis : axis));
    test('numeric flat signed XYZ permutation: ' + order.join(','), () => {
      const pipeline = new ProjectionPipeline({
        input: xyz,
        steps: [
          {type: 'unitconvert', xy: {from: 'm', to: 'm'}},
          {type: 'axisswap', order}
        ]
      });
      for (const ArrayType of [Float32Array, Float64Array]) {
        const input = new ArrayType([11, -23, -0, NaN, -0, 7, -9, Infinity]);
        const expected = Array.from(input);
        for (let offset = 0; offset < input.length; offset += 4) {
          const point = Array.from(input.subarray(offset, offset + 3));
          for (let axis = 0; axis < 3; axis++)
            expected[offset + axis] = Math.sign(order[axis]) * point[Math.abs(order[axis]) - 1];
        }
        const storage = new ArrayType(input.length + 2).fill(77),
          view = storage.subarray(1, -1);
        view.set(input);
        expect(pipeline.projectFlat(view, 4)).toBe(view);
        expect(Array.from(view)).toEqual(expected);
        expect(storage[0]).toBe(77);
        expect(storage.at(-1)).toBe(77);
        expect(pipeline.unprojectFlat(view, 4)).toBe(view);
        expect(Array.from(view)).toEqual(Array.from(input));
      }
    });
  }
}

for (const from of ['m', 'ft', 'us-ft'] as const) {
  for (const to of ['m', 'ft', 'us-ft'] as const) {
    test('numeric flat unit steps retain exact scalar rounding: ' + from + '/' + to, () => {
      const pipeline = new ProjectionPipeline({
        input: {space: 'geocentric', units: [from, from, from]},
        steps: [
          {type: 'unitconvert', xy: {from, to}, z: {from, to}},
          {type: 'axisswap', order: [-3, 1, -2]},
          {type: 'unitconvert', xy: {from: to, to: from}, z: {from: to, to: from}}
        ]
      });
      for (const ArrayType of [Float32Array, Float64Array]) {
        const input = new ArrayType([
          1.23456789,
          -0,
          1000.1234567,
          8,
          -23.7,
          11.4,
          -12.6,
          -Infinity
        ]);
        for (const inverse of [false, true]) {
          const expected = new ArrayType(input.length);
          for (let offset = 0; offset < input.length; offset += 4)
            expected.set(
              (inverse ? pipeline.unproject : pipeline.project)(
                Array.from(input.subarray(offset, offset + 4))
              ),
              offset
            );
          const output = input.slice();
          (inverse ? pipeline.unprojectFlat : pipeline.projectFlat)(output, 4);
          expect(Array.from(output)).toEqual(Array.from(expected));
        }
      }
    });
  }
}

test('numeric XY programs preserve step orientation, angular units, tails and omitted directions', () => {
  const steps: PipelineStep[] = [
    {type: 'unitconvert', xy: {from: 'rad', to: 'deg'}, inverse: true},
    {type: 'axisswap', order: [-2, 1]},
    {type: 'axisswap', order: [-1, -2], omitForward: true},
    {type: 'axisswap', order: [-1, -2], omitForward: true},
    {type: 'unitconvert', xy: {from: 'rad', to: 'deg'}}
  ];
  const pipeline = new ProjectionPipeline({
    input: {space: 'geographic', units: ['deg', 'deg', 'm']},
    steps
  });
  steps[1] = {type: 'axisswap', order: [1, 2]}; // Construction owns the validated program.
  for (const ArrayType of [Float32Array, Float64Array]) {
    for (const dimension of [2, 3, 4, 5]) {
      const point = [11.12345, -0, 100.345, NaN, Infinity].slice(0, dimension);
      for (const inverse of [false, true]) {
        const input = new ArrayType([...point, ...point]);
        const rounded = Array.from(input.subarray(0, dimension));
        const expected = new ArrayType((inverse ? pipeline.unproject : pipeline.project)(rounded));
        (inverse ? pipeline.unprojectFlatSync : pipeline.projectFlatSync)(input, dimension, 2020);
        expect(Array.from(input)).toEqual([...expected, ...expected]);
      }
    }
  }
});

test('numeric batches validate every static epoch and retain completed records on failure', () => {
  const pipeline = new ProjectionPipeline({
    input: xyz,
    steps: [
      {type: 'unitconvert', xy: {from: 'm', to: 'm'}},
      {type: 'axisswap', order: [-2, 1, 3]}
    ]
  });
  for (const ArrayType of [Float32Array, Float64Array]) {
    for (const inverse of [false, true]) {
      const operation = inverse ? pipeline.unprojectFlatSync : pipeline.projectFlatSync;
      const input = new ArrayType([11, 23, 100, 8, 14, 26, 200, 9, 17, 29, 300, 10]);
      const original = input.slice(),
        epochs = new ArrayType([2020, NaN, 2021]);
      expect(() => operation(input, 4, epochs)).toThrow('epoch');
      expect(Array.from(input.subarray(0, 4))).toEqual(
        (inverse ? pipeline.unproject : pipeline.project)(Array.from(original.subarray(0, 4)), 2020)
      );
      expect(Array.from(input.subarray(4))).toEqual(Array.from(original.subarray(4)));
      expect(Array.from(epochs)).toEqual([2020, NaN, 2021]);
      expect(() => operation(original, 4, new ArrayType(2))).toThrow('Epoch');
      expect(() => operation(original, 4, original.subarray(0, 3))).toThrow('overlap');
      expect(operation(new ArrayType(0), 4, new ArrayType(0))).toHaveLength(0);
    }
  }
});

test('numeric batches check XYZ and final Float32 overflow before committing each record', () => {
  for (const units of ['m', 'ft', 'us-ft'] as PipelineUnit[]) {
    const pipeline = new ProjectionPipeline({
      input: xyz,
      steps: [{type: 'unitconvert', xy: {from: 'm', to: units}, z: {from: 'm', to: units}}]
    });
    for (const ArrayType of [Float32Array, Float64Array]) {
      for (const axis of [0, 1, 2]) {
        const input = new ArrayType([1, 2, 3, 8, 4, 5, 6, 9, 7, 8, 9, 10]);
        input[4 + axis] = NaN;
        const original = input.slice();
        expect(() => pipeline.projectFlat(input, 4)).toThrow('finite');
        expect(Array.from(input.subarray(0, 4))).toEqual(
          Array.from(new ArrayType(pipeline.project([1, 2, 3, 8])))
        );
        expect(Array.from(input.subarray(4))).toEqual(Array.from(original.subarray(4)));
      }
    }
  }
  const overflow = new ProjectionPipeline({
    input: xyz,
    steps: [{type: 'unitconvert', z: {from: 'm', to: 'ft'}}]
  });
  const buffer = new Float32Array([1, 2, 3, 8, 4, 5, 2e38, 9]);
  const original = buffer.slice();
  expect(() => overflow.projectFlat(buffer, 4)).toThrow('Float32');
  expect(Array.from(buffer.subarray(4))).toEqual(Array.from(original.subarray(4)));
  const doubleOverflow = new ProjectionPipeline({
    input: xyz,
    steps: [
      {type: 'unitconvert', xy: {from: 'm', to: 'ft'}},
      {type: 'unitconvert', xy: {from: 'ft', to: 'm'}}
    ]
  });
  const doubles = new Float64Array([Number.MAX_VALUE, 1, 2]);
  expect(() => doubleOverflow.projectFlat(doubles, 3)).toThrow('finite');
  expect(Array.from(doubles)).toEqual([Number.MAX_VALUE, 1, 2]);
});
