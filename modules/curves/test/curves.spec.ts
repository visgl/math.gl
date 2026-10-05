// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  Curve,
  LineCurve,
  QuadraticBezierCurve,
  CubicBezierCurve,
  HermiteCurve,
  CatmullRomCurve,
  CurveArcLength
} from '@math.gl/curves';

function close(actual: ArrayLike<number>, expected: ArrayLike<number>, digits = 10): void {
  expect(actual.length).toBe(expected.length);
  for (let i = 0; i < actual.length; i++) expect(actual[i]).toBeCloseTo(expected[i], digits);
}

test('line endpoints, exact derivative, unit tangent, flat sampling and output reuse', () => {
  const curve = new LineCurve([1, 2, 3], [4, 6, 3]);
  expect(curve.dimension).toBe(3);
  close(curve.getPoint(0), [1, 2, 3]);
  close(curve.getPoint(1), [4, 6, 3]);
  close(curve.getPoint(0.5), [2.5, 4, 3]);
  close(curve.getDerivative(0.25), [3, 4, 0]);
  close(curve.getTangent(0.5), [0.6, 0.8, 0]);
  close(curve.getPoints(2), [1, 2, 3, 2.5, 4, 3, 4, 6, 3]);
  for (const output of [[0, 0, 0, 99], new Float32Array(4), new Float64Array(4)]) {
    const sentinel = output[3];
    expect(curve.getPoint(0.5, output)).toBe(output);
    expect(output[3]).toBe(sentinel);
    expect(curve.getDerivative(0.5, output)).toBe(output);
    expect(curve.getTangent(0.5, output)).toBe(output);
    close(output.slice(0, 3), [0.6, 0.8, 0], 6);
  }
});

test('Bezier curves match analytic polynomials and endpoint derivatives', () => {
  const quadratic = new QuadraticBezierCurve([0, 0], [0, 1], [1, 0]);
  const cubic = new CubicBezierCurve([0, 0], [0, 1], [0, 1], [1, 0]);
  for (const t of [0, 0.01, 0.25, 0.5, 0.9, 1]) {
    close(quadratic.getPoint(t), [t * t, 2 * t * (1 - t)]);
    close(quadratic.getDerivative(t), [2 * t, 2 - 4 * t]);
    close(cubic.getPoint(t), [t ** 3, 3 * t * (1 - t)]);
    close(cubic.getDerivative(t), [3 * t * t, 3 - 6 * t]);
  }
});

test('Hermite endpoint derivatives and Bezier equivalence in three dimensions', () => {
  const start = [1, -2, 3];
  const end = [7, 4, -1];
  const m0 = [3, 6, -3];
  const m1 = [-6, 0, 9];
  const hermite = new HermiteCurve(start, end, m0, m1);
  const bezier = new CubicBezierCurve(
    start,
    start.map((v, i) => v + m0[i] / 3),
    end.map((v, i) => v - m1[i] / 3),
    end
  );
  close(hermite.getPoint(0), start);
  close(hermite.getPoint(1), end);
  close(hermite.getDerivative(0), m0);
  close(hermite.getDerivative(1), m1);
  for (let i = 0; i <= 20; i++) {
    close(hermite.getPoint(i / 20), bezier.getPoint(i / 20));
    close(hermite.getDerivative(i / 20), bezier.getDerivative(i / 20));
  }
});

// Independent recursive knot interpolation oracle for nonuniform Catmull-Rom.
function interpolateKnots(points: number[][], alpha: number, u: number): number[] {
  const knots = [0];
  for (let i = 1; i < 4; i++) {
    knots.push(
      knots[i - 1] + Math.hypot(...points[i].map((x, k) => x - points[i - 1][k])) ** alpha
    );
  }
  const t = knots[1] + u * (knots[2] - knots[1]);
  const blend = (a: number[], b: number[], low: number, high: number): number[] =>
    a.map((x, i) => ((high - t) * x + (t - low) * b[i]) / (high - low));
  const a0 = blend(points[0], points[1], knots[0], knots[1]);
  const a1 = blend(points[1], points[2], knots[1], knots[2]);
  const a2 = blend(points[2], points[3], knots[2], knots[3]);
  return blend(
    blend(a0, a1, knots[0], knots[2]),
    blend(a1, a2, knots[1], knots[3]),
    knots[1],
    knots[2]
  );
}

test('Catmull-Rom interpolates knots and matches independent nonuniform interpolation', () => {
  const points = [
    [0, 0, 0],
    [1, 2, 3],
    [4, -1, 2],
    [5, 3, -1]
  ];
  for (const parameterization of ['uniform', 'centripetal', 'chordal'] as const) {
    const curve = new CatmullRomCurve(points, {parameterization});
    for (let i = 0; i < 4; i++) close(curve.getPoint(i / 3), points[i]);
    if (parameterization !== 'uniform') {
      for (const u of [0.1, 0.25, 0.5, 0.75, 0.9]) {
        close(
          curve.getPoint((1 + u) / 3),
          interpolateKnots(points, parameterization === 'chordal' ? 1 : 0.5, u)
        );
      }
    }
    for (const t of [0.1, 0.4, 0.8]) {
      const before = curve.getPoint(t - 1e-6);
      const after = curve.getPoint(t + 1e-6);
      close(
        curve.getDerivative(t),
        after.map((x, i) => (x - before[i]) / 2e-6),
        6
      );
    }
  }
  const uniform = new CatmullRomCurve(points, {parameterization: 'uniform'});
  close(
    uniform.getDerivative(1 / 3),
    points[2].map((x, i) => 1.5 * (x - points[0][i]))
  );
  close(
    new CatmullRomCurve(points, {
      parameterization: 'uniform',
      tension: 0
    }).getDerivative(1 / 3),
    [0, 0, 0]
  );
});

test('open two-point splines are lines, closed splines join with matching tangent directions', () => {
  for (const parameterization of ['uniform', 'centripetal', 'chordal'] as const) {
    const line = new CatmullRomCurve(
      [
        [2, 3],
        [6, 9]
      ],
      {parameterization}
    );
    close(line.getPoint(0.25), [3, 4.5]);
    const loop = new CatmullRomCurve(
      [
        [0, 0],
        [2, 0],
        [1, 3]
      ],
      {closed: true, parameterization}
    );
    close(loop.getPoint(0), loop.getPoint(1));
    close(loop.getTangent(0), loop.getTangent(1));
    for (let knot = 1; knot < 3; knot++) {
      close(loop.getTangent(knot / 3 - 1e-9), loop.getTangent(knot / 3), 6);
    }
  }
});

test('constant curves and repeated knots remain finite', () => {
  for (const curve of [
    new LineCurve([2, 3], [2, 3]),
    new CatmullRomCurve([
      [2, 3],
      [2, 3],
      [2, 3]
    ])
  ]) {
    close(curve.getTangent(0.5), [0, 0]);
    const table = new CurveArcLength(curve, 16);
    expect(table.length).toBe(0);
    expect(table.getParameterAt(0.3)).toBe(0.3);
    close(table.getPointAt(0.7), [2, 3]);
  }
  for (const parameterization of ['uniform', 'centripetal', 'chordal'] as const) {
    const repeated = new CatmullRomCurve(
      [
        [0, 0],
        [1, 2],
        [1, 2],
        [3, 0]
      ],
      {parameterization}
    );
    expect(Array.from(repeated.getPoints(64)).every(Number.isFinite)).toBe(true);
  }
});

test('arc length is exact for a line and remaps a nonuniform straight Bezier', () => {
  const line = new CurveArcLength(new LineCurve([0, 0, 0], [3, 4, 0]), 16);
  expect(line.length).toBe(5);
  close(line.getPointAt(0.2), [0.6, 0.8, 0]);
  const output = new Float64Array(3);
  expect(line.getPointAt(0.2, output)).toBe(output);
  const table = new CurveArcLength(new CubicBezierCurve([0, 0], [0, 0], [0, 0], [1, 0]));
  expect(table.length).toBe(1);
  expect(table.getParameterAt(0.125)).toBeCloseTo(0.5, 5);
  close(table.getSpacedPoints(4), [0, 0, 0.25, 0, 0.5, 0, 0.75, 0, 1, 0], 5);
  expect(table.getParameterAt(0)).toBe(0);
  expect(table.getParameterAt(1)).toBe(1);
});

test('arc-length approximation converges on a parabola and handles stationary intervals', () => {
  // x=t, y=t^2: integral sqrt(1+4t^2) dt from 0 to 1.
  const parabola = new QuadraticBezierCurve([0, 0], [0.5, 0], [1, 1]);
  const exact = Math.sqrt(5) / 2 + Math.asinh(2) / 4;
  const coarse = new CurveArcLength(parabola, 8);
  const fine = new CurveArcLength(parabola, 1024);
  expect(Math.abs(fine.length - exact)).toBeLessThan(Math.abs(coarse.length - exact));
  expect(fine.length).toBeCloseTo(exact, 6);
  class PausedCurve extends Curve {
    constructor() {
      super(2);
    }
    protected evaluate(t: number, result: number[], derivative: boolean): void {
      result[0] = derivative ? (t > 0.5 ? 2 : 0) : Math.max(0, 2 * t - 1);
      result[1] = 0;
    }
  }
  const table = new CurveArcLength(new PausedCurve(), 16);
  expect(table.getParameterAt(0.5)).toBe(0.75);
  close(table.getPointAt(0.5), [0.5, 0]);
});

test('constructor copies points and tangents', () => {
  const a = [0, 0];
  const b = [1, 1];
  const tangent = [1, 0];
  const curves = [
    new LineCurve(a, b),
    new QuadraticBezierCurve(a, b, a),
    new CubicBezierCurve(a, b, b, a),
    new HermiteCurve(a, b, tangent, tangent),
    new CatmullRomCurve([a, b])
  ];
  const expected = curves.map(curve => curve.getPoint(0.5));
  a[0] = 100;
  b[1] = 100;
  tangent[0] = 100;
  curves.forEach((curve, i) => close(curve.getPoint(0.5), expected[i]));
});

test('invalid points, options, parameters, divisions and buffers are rejected', () => {
  for (const points of [
    [[0], [1]],
    [
      [0, 0],
      [1, 2, 3]
    ],
    [
      [0, NaN],
      [1, 2]
    ],
    [
      [0, 0],
      [Infinity, 2]
    ]
  ]) {
    expect(() => new LineCurve(points[0], points[1])).toThrow(RangeError);
  }
  expect(() => new CatmullRomCurve([])).toThrow(RangeError);
  expect(() => new CatmullRomCurve([[0, 0]])).toThrow(RangeError);
  expect(
    () =>
      new CatmullRomCurve(
        [
          [0, 0],
          [1, 1]
        ],
        {closed: true}
      )
  ).toThrow(RangeError);
  expect(
    () =>
      new CatmullRomCurve(
        [
          [0, 0],
          [1, 1]
        ],
        {tension: 0.5}
      )
  ).toThrow(/uniform/);
  expect(
    () =>
      new CatmullRomCurve(
        [
          [0, 0],
          [1, 1]
        ],
        {parameterization: 'bad' as never}
      )
  ).toThrow();
  for (const tension of [-1, 2, NaN]) {
    expect(
      () =>
        new CatmullRomCurve(
          [
            [0, 0],
            [1, 1]
          ],
          {parameterization: 'uniform', tension}
        )
    ).toThrow();
  }
  const curve = new LineCurve([0, 0], [1, 1]);
  const table = new CurveArcLength(curve);
  for (const t of [-1, 2, NaN, Infinity]) {
    expect(() => curve.getPoint(t)).toThrow(RangeError);
    expect(() => curve.getDerivative(t)).toThrow(RangeError);
    expect(() => curve.getTangent(t)).toThrow(RangeError);
    expect(() => table.getParameterAt(t)).toThrow(RangeError);
  }
  for (const divisions of [0, -1, 1.5, NaN, Infinity]) {
    expect(() => curve.getPoints(divisions)).toThrow(RangeError);
    expect(() => new CurveArcLength(curve, divisions)).toThrow(RangeError);
    expect(() => table.getSpacedPoints(divisions)).toThrow(RangeError);
  }
  expect(() => curve.getPoint(0, new Float64Array(1))).toThrow(/short/);
  expect(() => curve.getDerivative(0, [0])).toThrow(/short/);
  expect(() => table.getPointAt(0, [0])).toThrow(/short/);
});

test('repeated nonuniform knots are stationary and preserve scale invariance', () => {
  const points = [
    [0, 0],
    [1, 2],
    [1, 2],
    [3, 0]
  ];
  for (const parameterization of ['centripetal', 'chordal'] as const) {
    const curve = new CatmullRomCurve(points, {parameterization});
    const scaled = new CatmullRomCurve(
      points.map(p => p.map(x => x * 100)),
      {parameterization}
    );
    close(curve.getPoint(0.5), [1, 2]);
    close(curve.getDerivative(0.5), [0, 0]);
    for (const t of [0.1, 0.25, 0.5, 0.75, 0.9]) {
      close(
        scaled.getPoint(t).map(x => x / 100),
        curve.getPoint(t)
      );
    }
  }
});
