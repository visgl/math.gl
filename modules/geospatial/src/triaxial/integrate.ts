// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original adaptive Dormand-Prince integration of the constrained Cartesian geodesic equation; mathematical coefficients, no third-party implementation copied.
const C = [0, 1 / 5, 3 / 10, 4 / 5, 8 / 9, 1, 1];
const A = [
  [],
  [1 / 5],
  [3 / 40, 9 / 40],
  [44 / 45, -56 / 15, 32 / 9],
  [19372 / 6561, -25360 / 2187, 64448 / 6561, -212 / 729],
  [9017 / 3168, -355 / 33, 46732 / 5247, 49 / 176, -5103 / 18656],
  [35 / 384, 0, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84]
];
const B = [35 / 384, 0, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84, 0];
const ERROR = [
  35 / 384 - 5179 / 57600,
  0,
  500 / 1113 - 7571 / 16695,
  125 / 192 - 393 / 640,
  -2187 / 6784 + 92097 / 339200,
  11 / 84 - 187 / 2100,
  -1 / 40
];
export function integrateGeodesic(
  initial: readonly number[],
  q: readonly number[],
  distance: number
): number[] {
  let state = Array.from(initial),
    done = 0,
    step = Math.sign(distance) * Math.min(0.01, Math.abs(distance));
  const derivative = (y: readonly number[]) => {
    const normal = [q[0] * y[0], q[1] * y[1], q[2] * y[2]];
    const curvature =
      (q[0] * y[3] ** 2 + q[1] * y[4] ** 2 + q[2] * y[5] ** 2) /
      (normal[0] ** 2 + normal[1] ** 2 + normal[2] ** 2);
    return [
      y[3],
      y[4],
      y[5],
      -curvature * normal[0],
      -curvature * normal[1],
      -curvature * normal[2]
    ];
  };
  for (let attempt = 0; attempt < 50000; attempt++) {
    if (done === distance) return state;
    if (Math.abs(step) > Math.abs(distance - done)) step = distance - done;
    const stages: number[][] = [];
    for (let j = 0; j < C.length; j++) {
      const y = state.map(
        (v, i) => v + step * A[j].reduce((sum, a, k) => sum + a * stages[k][i], 0)
      );
      stages.push(derivative(y));
    }
    const next = state.map((v, i) => v + step * B.reduce((sum, b, j) => sum + b * stages[j][i], 0));
    let error = 0;
    for (let i = 0; i < 6; i++)
      error = Math.max(
        error,
        Math.abs(step * ERROR.reduce((sum, e, j) => sum + e * stages[j][i], 0))
      );
    const tolerance = 2e-15;
    if (error <= tolerance) {
      state = next;
      done += step;
      // Restore the two constraints and unit speed only at accepted steps.
      const surface = Math.sqrt(q[0] * state[0] ** 2 + q[1] * state[1] ** 2 + q[2] * state[2] ** 2);
      for (let i = 0; i < 3; i++) state[i] /= surface;
      const normal = state.slice(0, 3).map((x, i) => q[i] * x),
        nn = normal.reduce((s, x) => s + x * x, 0);
      const dot = normal.reduce((s, x, i) => s + x * state[i + 3], 0) / nn;
      for (let i = 0; i < 3; i++) state[i + 3] -= normal[i] * dot;
      const speed = Math.hypot(state[3], state[4], state[5]);
      for (let i = 3; i < 6; i++) state[i] /= speed;
    }
    step *= Math.max(0.2, Math.min(4, 0.9 * (tolerance / Math.max(error, 1e-300)) ** 0.2));
    if (done + step === done) throw new RangeError('Triaxial integration step underflow');
  }
  throw new RangeError('Triaxial integration work limit exceeded');
}
