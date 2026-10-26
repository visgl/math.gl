// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original bounded adaptive Gauss-Legendre evaluation of elliptic geodesic integrals.
const X16 = [
  0.09501250983763744, 0.2816035507792589, 0.4580167776572274, 0.6178762444026438,
  0.755404408355003, 0.8656312023878318, 0.9445750230732326, 0.9894009349916499
];
const W16 = [
  0.1894506104550685, 0.1826034150449236, 0.16915651939500254, 0.14959598881657673,
  0.12462897125553387, 0.09515851168249278, 0.06225352393864789, 0.027152459411754096
];
const X8 = [0.1834346424956498, 0.525532409916329, 0.7966664774136267, 0.9602898564975363];
const W8 = [0.362683783378362, 0.3137066458778873, 0.2223810344533745, 0.1012285362903763];
export function integrate(f: (x: number) => number, start: number, length: number): number {
  if (length === 0) return 0;
  function rule(x: readonly number[], w: readonly number[], a: number, h: number) {
    const mid = a + h / 2,
      half = h / 2;
    let sum = 0;
    for (let i = 0; i < x.length; i++) sum += w[i] * (f(mid - half * x[i]) + f(mid + half * x[i]));
    return half * sum;
  }
  function visit(a: number, h: number, depth: number): number {
    const high = rule(X16, W16, a, h),
      low = rule(X8, W8, a, h);
    if (!Number.isFinite(high)) throw new RangeError('Nonfinite elliptic integral');
    if (Math.abs(high - low) <= 2e-15 * Math.abs(h) + 8 * Number.EPSILON * Math.abs(high))
      return high;
    if (depth === 16) throw new RangeError('Elliptic quadrature did not converge');
    return visit(a, h / 2, depth + 1) + visit(a + h / 2, h / 2, depth + 1);
  }
  return visit(start, length, 0);
}
export function ellipticIntegrals(k2: number, ep2: number) {
  const dn = (x: number) => Math.sqrt(1 + k2 * Math.sin(x) ** 2);
  const densityD = (x: number) => Math.sin(x) ** 2 / dn(x);
  const densityH = (x: number) => Math.cos(x) ** 2 / ((1 + ep2 * Math.sin(x) ** 2) * dn(x));
  const complete = new Map<Function, number>();
  const total = (f: (x: number) => number) => {
    let v = complete.get(f);
    if (v === undefined) {
      v = integrate(f, 0, Math.PI);
      complete.set(f, v);
    }
    return v;
  };
  const periodic = (f: (x: number) => number, start: number, delta: number) => {
    const turns = Math.trunc(delta / Math.PI),
      remainder = delta - turns * Math.PI;
    return (turns ? turns * total(f) : 0) + integrate(f, start % Math.PI, remainder);
  };
  return {
    E: (s: number, d: number) => periodic(dn, s, d),
    J: (s: number, d: number) => k2 * periodic(densityD, s, d),
    H: (s: number, d: number) => periodic(densityH, s, d),
    meanE: () => total(dn) / Math.PI,
    meanJ: () => (k2 * total(densityD)) / Math.PI
  };
}
