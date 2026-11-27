// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {CelestialFrameTransform, JulianDate} from '../../src/celestial';
const epoch = new JulianDate(2451545);
const identity = [1, 0, 0, 0, 1, 0, 0, 0, 1];
const zero = new Array<number>(9).fill(0);
function rotation(angle: number, rate: number, from = 'A', to = 'B') {
  const s = Math.sin(angle),
    c = Math.cos(angle);
  return new CelestialFrameTransform([c, s, 0, -s, c, 0, 0, 0, 1], {
    from,
    to,
    epoch,
    rotationRate: [-rate * s, rate * c, 0, -rate * c, -rate * s, 0, 0, 0, 0]
  });
}
function close(a: number[], b: number[], digits = 12) {
  for (let i = 0; i < a.length; i++) expect(a[i]).toBeCloseTo(b[i], digits);
}

test('State transforms include frame motion, verified analytically and by finite differences', () => {
  const angle = 0.7,
    omega = 0.1;
  const frame = rotation(angle, omega);
  const state = frame.transformState({position: [2, 0, 0], velocity: [0, 0, 0]});
  close(state.position, [2 * Math.cos(angle), 2 * Math.sin(angle), 0]);
  close(state.velocity, [-2 * omega * Math.sin(angle), 2 * omega * Math.cos(angle), 0]);
  const h = 1e-4;
  const plus = rotation(angle + omega * h, omega).transformPosition([2, 0, 0]);
  const minus = rotation(angle - omega * h, omega).transformPosition([2, 0, 0]);
  close(
    state.velocity,
    plus.map((v, i) => (v - minus[i]) / (2 * h)),
    10
  );
  close(frame.inverse().transformState(state).position, [2, 0, 0]);
  close(frame.inverse().transformState(state).velocity, [0, 0, 0]);
});

test('Composition uses the derivative product rule and enforces frame/epoch agreement', () => {
  const first = rotation(0.4, 0.2);
  const second = rotation(-0.7, -0.03, 'B', 'C');
  const state = {position: [3, 4, -2], velocity: [-2, 3, 1]};
  const sequential = second.transformState(first.transformState(state));
  const combined = first.then(second).transformState(state);
  close(combined.position, sequential.position);
  close(combined.velocity, sequential.velocity);
  close(combined.position, rotation(-0.3, 0.17).transformState(state).position);
  expect(() => first.then(first)).toThrow(RangeError);
  const later = new CelestialFrameTransform(identity, {
    from: 'B',
    to: 'C',
    epoch: epoch.addSeconds(1),
    rotationRate: zero
  });
  expect(() => first.then(later)).toThrow(RangeError);
});

test('Rotation-only snapshots reject state transforms until rate is supplied explicitly', () => {
  const frame = new CelestialFrameTransform(identity, {from: 'A', to: 'B', epoch});
  expect(frame.rotationRate).toBeUndefined();
  expect(frame.transformPosition([1, 2, 3])).toEqual([1, 2, 3]);
  expect(() => frame.transformState({position: [1, 2, 3], velocity: [0, 0, 0]})).toThrow(
    RangeError
  );
  expect(frame.inverse().rotationRate).toBeUndefined();
  expect(
    frame.then(new CelestialFrameTransform(identity, {from: 'B', to: 'C', epoch})).rotationRate
  ).toBeUndefined();
});

test('Snapshots isolate input and getter mutation, and reject nonrigid/invalid rate models', () => {
  const matrix = identity.slice(),
    rate = zero.slice();
  const frame = new CelestialFrameTransform(matrix, {
    from: 'A',
    to: 'B',
    epoch,
    rotationRate: rate
  });
  matrix.fill(0);
  rate.fill(10);
  frame.rotation.fill(0);
  frame.rotationRate!.fill(10);
  expect(Object.isFrozen(frame)).toBe(true);
  expect(frame.transformState({position: [1, 2, 3], velocity: [4, 5, 6]})).toEqual({
    position: [1, 2, 3],
    velocity: [4, 5, 6]
  });
  expect(() => new CelestialFrameTransform([1, 2], {from: 'A', to: 'B', epoch})).toThrow(
    RangeError
  );
  expect(
    () =>
      new CelestialFrameTransform(
        identity.map(v => v * 2),
        {from: 'A', to: 'B', epoch}
      )
  ).toThrow(RangeError);
  expect(
    () => new CelestialFrameTransform([-1, 0, 0, 0, 1, 0, 0, 0, 1], {from: 'A', to: 'B', epoch})
  ).toThrow(RangeError);
  expect(
    () => new CelestialFrameTransform(identity, {from: 'A', to: 'B', epoch, rotationRate: identity})
  ).toThrow(RangeError);
  expect(() => frame.transformPosition([NaN, 0, 0])).toThrow(RangeError);
});

test('A rotating snapshot composes with its inverse despite derivative cancellation roundoff', () => {
  const [sx, sy, sz] = [0.4, 0.7, 0.9].map(Math.sin);
  const [cx, cy, cz] = [0.4, 0.7, 0.9].map(Math.cos);
  // Independent Rz Ry Rx matrix, and dR/dt = cross([1,2,3]) R.
  const matrix = [
    cz * cy,
    sz * cy,
    -sy,
    cz * sy * sx - sz * cx,
    sz * sy * sx + cz * cx,
    cy * sx,
    cz * sy * cx + sz * sx,
    sz * sy * cx - cz * sx,
    cy * cx
  ];
  const rate: number[] = [];
  for (let column = 0; column < 3; column++) {
    const [x, y, z] = matrix.slice(column * 3, column * 3 + 3);
    rate.push(2 * z - 3 * y, 3 * x - z, y - 2 * x);
  }
  const multiaxis = new CelestialFrameTransform(matrix, {
    from: 'A',
    to: 'B',
    epoch,
    rotationRate: rate
  });
  const state = {position: [7e6, -2e6, 1e6], velocity: [1e3, 7e3, -2e3]};
  for (const frame of [rotation(0.7, 0.1), multiaxis]) {
    for (const combined of [frame.then(frame.inverse()), frame.inverse().then(frame)]) {
      close(combined.rotation, identity);
      close(combined.rotationRate!, zero);
      const output = combined.transformState(state);
      close(output.position, state.position, 7);
      close(output.velocity, state.velocity, 7);
    }
  }
});
