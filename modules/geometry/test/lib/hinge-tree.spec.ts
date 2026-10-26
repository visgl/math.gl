// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Matrix4} from '@math.gl/core';
import {HingeTree, type HingePanel} from '@math.gl/geometry';
import {tree as cube, corners} from '../../../../examples/unfolding-polyhedron/cube';

const joint: HingePanel = {parent: 0, pivot: [1, 0, 0], axis: [0, 0, 2]};
function matrix(output: Float64Array, index: number): Matrix4 {
  return new Matrix4().copy(output.subarray(index * 16, index * 16 + 16));
}
function near(actual: ArrayLike<number>, expected: ArrayLike<number>): void {
  expect(actual.length).toBe(expected.length);
  for (let i = 0; i < actual.length; i++) expect(actual[i]).toBeCloseTo(expected[i], 10);
}

test('HingeTree: right-handed rotation about an offset axis keeps hinge points fixed', () => {
  const tree = new HingeTree([{parent: -1}, joint]);
  const pose = matrix(tree.evaluate([0, Math.PI / 2]), 1);
  near(pose.transformAsPoint([2, 0, 0]), [1, 1, 0]);
  near(pose.transformAsPoint([1, 0, -3]), [1, 0, -3]);
  near(pose.transformAsPoint([1, 0, 7]), [1, 0, 7]);
  near(matrix(tree.evaluate([0, -Math.PI / 2]), 1).transformAsPoint([2, 0, 0]), [1, -1, 0]);
});

test('HingeTree: arbitrary order, rest attachments, descendant motion and forests', () => {
  const tree = new HingeTree([
    {
      parent: 2,
      pivot: [0, 0, 0],
      axis: [0, 0, 1],
      restTransform: new Matrix4().translate([1, 0, 0])
    },
    {parent: -1, restTransform: new Matrix4().translate([9, 0, 0])},
    {
      parent: 3,
      pivot: [0, 0, 0],
      axis: [0, 0, 1],
      restTransform: new Matrix4().translate([1, 0, 0])
    },
    {parent: -1}
  ]);
  const rest = tree.evaluate([0, 0, 0, 0]);
  near(matrix(rest, 0).transformAsPoint([0, 0, 0]), [2, 0, 0]);
  const pose = tree.evaluate([Math.PI / 2, 0, Math.PI / 2, 0]);
  near(matrix(pose, 0).transformAsPoint([0, 0, 0]), [-1, 1, 0]);
  near(matrix(pose, 1).transformAsPoint([0, 0, 0]), [9, 0, 0]);
});

test('HingeTree: root placement composes on the left and preserves panel distances', () => {
  const tree = new HingeTree([{parent: -1}, joint]);
  const root = new Matrix4().translate([4, -8, 2]).rotateX(0.8).rotateY(-0.3);
  const local = tree.evaluate([0, 0.7]);
  const placed = tree.evaluate([0, 0.7], undefined, root);
  near(matrix(placed, 1), root.clone().multiplyRight(matrix(local, 1)));
  const pose = matrix(placed, 1);
  const a = pose.transformAsPoint([1, 2, 3]);
  const b = pose.transformAsPoint([4, 6, 3]);
  expect(Math.hypot(...a.map((value, i) => value - b[i]))).toBeCloseTo(5, 10);
});

test('HingeTree: joint axes stay in parent space when the rest attachment is rotated', () => {
  const tree = new HingeTree([
    {parent: -1},
    {
      parent: 0,
      pivot: [0, 0, 0],
      axis: [0, 0, 1],
      restTransform: new Matrix4().rotateX(Math.PI / 2)
    }
  ]);
  // Local Y is rest-rotated onto parent Z, which is unchanged by the hinge rotation.
  near(matrix(tree.evaluate([0, Math.PI / 2]), 1).transformAsPoint([0, 1, 0]), [0, 0, 1]);
  near(matrix(tree.evaluate([0, Math.PI / 2]), 1).transformAsPoint([1, 0, 0]), [0, 1, 0]);
});

test('HingeTree: input failures leave output intact; composition overflow is reported', () => {
  const tree = new HingeTree([{parent: -1}, joint]);
  const output = new Float64Array(32).fill(42);
  expect(() => tree.evaluate([0, NaN], output)).toThrow();
  expect(Array.from(output).every(value => value === 42)).toBe(true);
  const huge = new Matrix4().translate([Number.MAX_VALUE, 0, 0]);
  const overflowing = new HingeTree([{parent: -1, restTransform: huge}]);
  expect(() => overflowing.evaluate([0], undefined, huge)).toThrow();
});

test('HingeTree: snapshots descriptors and reuses output, including aliased inputs', () => {
  const rest = new Matrix4().translate([1, 0, 0]);
  const pivot: [number, number, number] = [0, 0, 0];
  const axis: [number, number, number] = [0, 0, 1];
  const tree = new HingeTree([{parent: -1}, {parent: 0, restTransform: rest, pivot, axis}]);
  rest.translate([100, 0, 0]);
  pivot[0] = 100;
  axis[0] = 100;
  const output = new Float64Array(32);
  output[1] = Math.PI / 2;
  expect(tree.evaluate(output.subarray(0, 2), output)).toBe(output);
  near(matrix(output, 1).transformAsPoint([0, 0, 0]), [0, 1, 0]);
  const expected = tree.evaluate([0, 0], undefined, output.subarray(16));
  tree.evaluate([0, 0], output, output.subarray(16));
  near(output, expected);
});

test('HingeTree: rejects invalid topology, axes, angles and storage', () => {
  for (const parent of [-2, 0, 2, 0.5, NaN]) {
    expect(() => new HingeTree([{parent}])).toThrow();
  }
  expect(() => new HingeTree([{...joint, parent: 1}, joint])).toThrow(/cycle/);
  expect(() => new HingeTree([{parent: -1}, {parent: 0}])).toThrow();
  for (const axis of [
    [0, 0, 0],
    [Infinity, 0, 0],
    [NaN, 0, 0]
  ]) {
    expect(
      () => new HingeTree([{parent: -1}, {...joint, axis: axis as [number, number, number]}])
    ).toThrow();
  }
  const tree = new HingeTree([{parent: -1}, joint]);
  for (const angles of [[0], [1, 0], [0, Infinity], [0, NaN]])
    expect(() => tree.evaluate(angles)).toThrow();
  expect(() => tree.evaluate([0, 0], new Float64Array(31))).toThrow();
});

test('HingeTree: rejects scale, shear, reflection, perspective and nonfinite transforms', () => {
  const shear = new Matrix4();
  shear[4] = 0.1;
  const nonfinite = new Matrix4();
  nonfinite[12] = Infinity;
  for (const restTransform of [
    new Matrix4().scale([2, 1, 1]),
    new Matrix4().scale([-1, 1, 1]),
    shear,
    nonfinite,
    new Matrix4().perspective({fovy: 1, aspect: 1, near: 1, far: 10}),
    [1, 2]
  ]) {
    expect(() => new HingeTree([{parent: -1, restTransform}])).toThrow();
    expect(() => new HingeTree([{parent: -1}]).evaluate([0], undefined, restTransform)).toThrow();
  }
});

test('HingeTree: empty and deep trees do not require recursive traversal', () => {
  expect(new HingeTree([]).evaluate([]).length).toBe(0);
  const panels: HingePanel[] = Array.from({length: 10000}, (_, i) => ({
    parent: i - 1,
    pivot: [0, 0, 0],
    axis: [0, 0, 1]
  }));
  const tree = new HingeTree(panels);
  near(matrix(tree.evaluate(new Float64Array(10000)), 9999), new Matrix4());
});

test('cube example: flat net, closed cube, and rigid panels throughout the motion', () => {
  for (const angle of [0, 0.3, 0.9, Math.PI / 2]) {
    const pose = cube.evaluate([0, angle, angle, angle, angle, angle]);
    const points = Array.from({length: 6}, (_, i) =>
      corners.map(p => matrix(pose, i).transformAsPoint(p))
    );
    for (const face of points) {
      for (let i = 0; i < 4; i++) {
        expect(Math.hypot(...face[i].map((x, j) => x - face[(i + 1) % 4][j]))).toBeCloseTo(1, 10);
      }
    }
    // All five joins coincide throughout the motion, including the lid's moving hinge.
    for (const [parent, child, pa, pb, ca, cb] of [
      [0, 1, 3, 2, 0, 1],
      [0, 2, 0, 1, 3, 2],
      [0, 3, 1, 2, 0, 3],
      [0, 4, 0, 3, 1, 2],
      [1, 5, 3, 2, 0, 1]
    ]) {
      near(points[parent][pa], points[child][ca]);
      near(points[parent][pb], points[child][cb]);
    }
    if (angle === 0) for (const p of points.flat()) expect(p[2]).toBe(0);
    if (angle === Math.PI / 2) {
      const vertices = new Set(points.flat().map(p => p.map(x => Math.round(x * 2)).join(',')));
      expect(vertices.size).toBe(8);
      for (const p of points.flat()) {
        expect(Math.abs(p[0])).toBeCloseTo(0.5, 10);
        expect(Math.abs(p[1])).toBeCloseTo(0.5, 10);
        expect(Math.min(Math.abs(p[2]), Math.abs(p[2] - 1))).toBeLessThan(1e-10);
      }
    }
  }
});
