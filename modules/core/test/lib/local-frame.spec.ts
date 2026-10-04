// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original cardinal/Pythagorean local-frame references; no upstream code or data.
import {expect, test} from 'vitest';
import {
  createLocalFrameBasis,
  eastNorthUpBasis,
  eastNorthUpBasisFromDirections,
  localToFixed,
  fixedToLocal,
  localFrameToMatrix,
  type LocalFrameAxis
} from '@math.gl/core/local-frame';
const axes = ['east', 'north', 'up', 'west', 'south', 'down'] as const;
// Authored orthonormal Pythagorean frame, independent of trigonometric construction.
const directions = {
  east: [-0.8, 0.6, 0],
  north: [-0.48, -0.64, 0.6],
  up: [0.36, 0.48, 0.8],
  west: [0.8, -0.6, 0],
  south: [0.48, 0.64, -0.6],
  down: [-0.36, -0.48, -0.8]
};
function close(actual: ArrayLike<number>, expected: ArrayLike<number>, tolerance = 2e-15) {
  for (let i = 0; i < expected.length; i++)
    expect(Math.abs(actual[i] - expected[i])).toBeLessThanOrEqual(tolerance);
}
function authoredBasis() {
  const basis = createLocalFrameBasis();
  expect(
    eastNorthUpBasisFromDirections({x: -0.8, y: 0.6, z: 0}, {x: 0.36, y: 0.48, z: 0.8}, basis)
  ).toBe(true);
  return basis;
}
function cross(a: readonly number[], b: readonly number[]) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
for (const first of axes)
  for (const second of axes)
    for (const third of axes) {
      const product = cross(directions[first], directions[second]);
      const valid = Math.hypot(...product.map((value, i) => value - directions[third][i])) < 1e-14;
      test(`signed right-handed axes ${first}/${second}/${third}`, () => {
        const output = new Float64Array(16).fill(7);
        expect(
          localFrameToMatrix(authoredBasis(), {x: 10, y: 20, z: 30}, first, second, third, output)
        ).toBe(valid);
        if (valid) {
          close(output, [
            ...directions[first],
            0,
            ...directions[second],
            0,
            ...directions[third],
            0,
            10,
            20,
            30,
            1
          ]);
        } else expect(Array.from(output)).toEqual(new Array(16).fill(7));
      });
    }

test('angle and supplied-direction frames match independent orthonormal vectors', () => {
  const basis = createLocalFrameBasis();
  expect(eastNorthUpBasis(Math.atan2(4, 3), Math.atan2(4, 3), basis)).toBe(true);
  const output: number[] = [];
  expect(localFrameToMatrix(basis, {x: 0, y: 0, z: 0}, 'east', 'north', 'up', output)).toBe(true);
  close(output, [...directions.east, 0, ...directions.north, 0, ...directions.up, 0, 0, 0, 0, 1]);
  for (const local of [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
    [2, -3, 4]
  ]) {
    const source = {x: local[0], y: local[1], z: local[2]},
      result = {x: 7, y: 8, z: 9};
    expect(localToFixed(source, basis, result)).toBe(true);
    close(
      [result.x, result.y, result.z],
      local.map(
        (_, i) =>
          local[0] * directions.east[i] +
          local[1] * directions.north[i] +
          local[2] * directions.up[i]
      )
    );
    expect(source).toEqual({x: local[0], y: local[1], z: local[2]});
    expect(fixedToLocal(result, basis)).toBe(true);
    close([result.x, result.y, result.z], local);
  }
});

test('all cardinal longitudes, both poles, and near-pole angles retain ENU handedness', () => {
  for (const longitude of [0, Math.PI / 2, Math.PI, -Math.PI / 2])
    for (const latitude of [
      0,
      Math.PI / 2,
      -Math.PI / 2,
      Math.PI / 2 - 1e-10,
      -Math.PI / 2 + 1e-10
    ]) {
      const basis = createLocalFrameBasis(),
        matrix = new Float64Array(16);
      expect(eastNorthUpBasis(longitude, latitude, basis)).toBe(true);
      expect(localFrameToMatrix(basis, {x: 0, y: 0, z: 0}, 'east', 'north', 'up', matrix)).toBe(
        true
      );
      const east = Array.from(matrix.slice(0, 3)),
        north = Array.from(matrix.slice(4, 7)),
        up = Array.from(matrix.slice(8, 11));
      close(cross(east, north), up);
      for (const axis of [east, north, up])
        expect(Math.abs(Math.hypot(...axis) - 1)).toBeLessThan(1e-15);
      const source = {x: 2, y: -3, z: 4},
        output = {x: 0, y: 0, z: 0};
      localToFixed(source, basis, output);
      fixedToLocal(output, basis);
      close([output.x, output.y, output.z], [2, -3, 4]);
    }
});

test('matrices preserve float views/tails, growable arrays, NED signs and origin units', () => {
  for (const ArrayType of [Float32Array, Float64Array]) {
    const buffer = new ArrayType(20).fill(99),
      view = buffer.subarray(2, 18);
    const basis = authoredBasis();
    expect(
      localFrameToMatrix(basis, {x: 1.25, y: -2.5, z: 3.75}, 'north', 'east', 'down', view)
    ).toBe(true);
    const expected = new ArrayType([
      ...directions.north,
      0,
      ...directions.east,
      0,
      ...directions.down,
      0,
      1.25,
      -2.5,
      3.75,
      1
    ]);
    if (ArrayType === Float32Array) expect(Array.from(view)).toEqual(Array.from(expected));
    else close(view, expected);
    expect(buffer[0]).toBe(99);
    expect(buffer[1]).toBe(99);
    expect(buffer[18]).toBe(99);
    expect(buffer[19]).toBe(99);
  }
});

test('invalid angles/directions, overflowing rotations and unsupported matrix storage fail atomically', () => {
  const basis = authoredBasis(),
    snapshot = {...basis};
  for (const [lon, lat] of [
    [NaN, 0],
    [0, Infinity],
    [0, Math.PI]
  ]) {
    expect(eastNorthUpBasis(lon, lat, basis)).toBe(false);
    expect(basis).toEqual(snapshot);
  }
  expect(eastNorthUpBasisFromDirections({x: 0, y: 1, z: 1}, {x: 1, y: 0, z: 0}, basis)).toBe(false);
  expect(eastNorthUpBasisFromDirections({x: NaN, y: 1, z: 0}, {x: 1, y: 0, z: 0}, basis)).toBe(
    false
  );
  expect(basis).toEqual(snapshot);
  for (const convert of [localToFixed, fixedToLocal]) {
    const input = {x: NaN, y: 2, z: 3},
      out = {x: 7, y: 8, z: 9};
    expect(convert(input, basis, out)).toBe(false);
    expect(out).toEqual({x: 7, y: 8, z: 9});
    expect(convert(input, basis)).toBe(false);
    expect(Number.isNaN(input.x)).toBe(true);
    expect(input.y).toBe(2);
    expect(input.z).toBe(3);
  }
  for (const out of [new Float64Array(15).fill(7), new Float32Array(16).fill(7)]) {
    const before = Array.from(out);
    expect(localFrameToMatrix(basis, {x: 1e100, y: 0, z: 0}, 'east', 'north', 'up', out)).toBe(
      false
    );
    expect(Array.from(out)).toEqual(before);
  }
  const out = new Float64Array(16).fill(7);
  expect(localFrameToMatrix(basis, {x: NaN, y: 0, z: 0}, 'east', 'north', 'up', out)).toBe(false);
  expect(
    localFrameToMatrix(basis, {x: 0, y: 0, z: 0}, 'invalid' as LocalFrameAxis, 'north', 'up', out)
  ).toBe(false);
  expect(Array.from(out)).toEqual(new Array(16).fill(7));
});

test('recursive point and matrix output setters cannot overwrite captured basis/origin/results', () => {
  const basis = authoredBasis(),
    source = {x: 2, y: -3, z: 4},
    expected = {x: 0, y: 0, z: 0};
  localToFixed(source, basis, expected);
  let value = 0;
  const output = {
    get x() {
      return value;
    },
    set x(v: number) {
      value = v;
      eastNorthUpBasis(0, 0, basis);
      localToFixed({x: 1, y: 2, z: 3}, basis, source);
    },
    y: 0,
    z: 0
  };
  expect(localToFixed(source, basis, output)).toBe(true);
  close([output.x, output.y, output.z], [expected.x, expected.y, expected.z]);
  const frame = authoredBasis(),
    origin = {x: 10, y: 20, z: 30},
    matrix = new Array(16).fill(0);
  Object.defineProperty(matrix, 0, {
    set(v: number) {
      value = v;
      eastNorthUpBasis(0, 0, frame);
      origin.x = origin.y = origin.z = 99;
    },
    get() {
      return value;
    }
  });
  expect(localFrameToMatrix(frame, origin, 'east', 'north', 'up', matrix)).toBe(true);
  close(matrix, [
    ...directions.east,
    0,
    ...directions.north,
    0,
    ...directions.up,
    0,
    10,
    20,
    30,
    1
  ]);
});
