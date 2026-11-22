// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {describe, expect, test} from 'vitest';
import {
  getApproximateErfcx,
  getChapmanGrazingIncidenceFunction,
  getCornetteShanksPhaseFunction,
  getHenyeyGreensteinPhaseFunction,
  getRayleighPhaseFunction
} from '@math.gl/earth/sun';

// exp(x^2) erfc(x) to 20 digits, from mpmath 1.3 at 30 digits:
// mp.nstr(mp.exp(mp.mpf(x)**2) * mp.erfc(mp.mpf(x)), 20).
const ERFCX_REFERENCE: readonly [number, number][] = [
  [0, 1],
  [0.01, 0.98881546104634251056],
  [0.1, 0.89645697996912664193],
  [0.5, 0.61569034419292587487],
  [1, 0.42758357615580700441],
  [1.25, 0.36782291645236109293],
  [1.75, 0.28497223473743638921],
  [2, 0.25539567631050574387],
  [3, 0.17900115118138995042],
  [5, 0.11070463773306862637],
  [10, 0.056140992743822585858],
  [30, 0.018795888861416751497],
  [100, 0.0056416137829894329036],
  [1000, 0.0005641893014533876542]
];
// The largest relative error of the Ren & MacKenzie approximation on [0, 40], measured against
// mpmath on a 0.005 grid: 0.0033074 at x = 1.745.
const ERFCX_GATE = 0.00331;

/** Integral of a phase function of cos(theta) over the sphere, and its mean cosine (midpoint rule). */
function sphereIntegral(phase: (cosine: number) => number, samples = 200000) {
  let total = 0;
  let mean = 0;
  const weight = (4 * Math.PI) / samples;
  for (let i = 0; i < samples; i++) {
    const cosine = -1 + (2 * (i + 0.5)) / samples;
    total += phase(cosine) * weight;
    mean += phase(cosine) * cosine * weight;
  }
  return {total, mean};
}

/** exp(x^2) erfc(x) for x >= 0 in float64, to about 1e-13: a Taylor series of erf below 2, a continued fraction above. */
function referenceErfcx(x: number): number {
  if (x < 2) {
    let term = x;
    let sum = x;
    for (let n = 1; n < 200; n++) {
      term *= (-x * x) / n;
      sum += term / (2 * n + 1);
    }
    return Math.exp(x * x) * (1 - (2 / Math.sqrt(Math.PI)) * sum);
  }
  // erfcx(x) = (1 / sqrt(pi)) / (x + (1/2) / (x + 1 / (x + (3/2) / (x + 2 / (x + ...))))).
  let fraction = x;
  for (let n = 200; n >= 1; n--) fraction = x + n / 2 / fraction;
  return 1 / (Math.sqrt(Math.PI) * fraction);
}

/** Composite Simpson rule on [0, upper] with an even number of steps. */
function simpson(f: (t: number) => number, upper: number, steps = 4000): number {
  const h = upper / steps;
  let sum = f(0) + f(upper);
  for (let i = 1; i < steps; i++) sum += (i % 2 ? 4 : 2) * f(i * h);
  return (sum * h) / 3;
}

/** Column to infinity along a ray that starts upward at radius x (scale heights), by quadrature. */
function upwardColumn(x: number, cosine: number): number {
  // Height u = t^2 above the start point; ds = 2 t r / sqrt(x^2 cos^2 z + r^2 - x^2) dt, smooth at t = 0.
  return simpson(t => {
    const r = x + t * t;
    const root = Math.sqrt(x * x * cosine * cosine + 2 * x * t * t + t ** 4);
    return t === 0 && cosine === 0
      ? (2 * x * Math.SQRT1_2) / Math.sqrt(x)
      : (Math.exp(-t * t) * (2 * t * r)) / root;
  }, 9);
}

/** Chapman function by quadrature: upward rays directly, downward rays through the tangent point. */
function chapmanByQuadrature(x: number, cosine: number): number {
  if (cosine >= 0) return upwardColumn(x, cosine);
  const tangent = x * Math.sqrt(1 - cosine * cosine);
  const fromTangent = simpson(t => {
    const r = tangent + t * t;
    return (Math.exp(-t * t) * (2 * r)) / Math.sqrt(2 * tangent + t * t);
  }, 9);
  return 2 * Math.exp(x - tangent) * fromTangent - upwardColumn(x, -cosine);
}

describe('phase functions', () => {
  test.each([-0.5, 0, 0.3, 0.7, 0.85, 0.95])(
    'getHenyeyGreensteinPhaseFunction g = %s integrates to one with mean cosine g',
    g => {
      const {total, mean} = sphereIntegral(mu => getHenyeyGreensteinPhaseFunction(mu, g));
      expect(total).toBeCloseTo(1, 5);
      expect(mean).toBeCloseTo(g, 5);
    }
  );

  test.each([-0.5, 0, 0.3, 0.7, 0.85, 0.95])(
    'getCornetteShanksPhaseFunction g = %s integrates to one with mean cosine 3g(4+g²)/(5(2+g²))',
    g => {
      const {total, mean} = sphereIntegral(mu => getCornetteShanksPhaseFunction(mu, g));
      expect(total).toBeCloseTo(1, 5);
      expect(mean).toBeCloseTo((3 * g * (4 + g * g)) / (5 * (2 + g * g)), 5);
    }
  );

  test('getRayleighPhaseFunction integrates to one, symmetric, twice as strong along the beam as across it', () => {
    const {total, mean} = sphereIntegral(getRayleighPhaseFunction);
    expect(total).toBeCloseTo(1, 8);
    expect(mean).toBeCloseTo(0, 10);
    expect(getRayleighPhaseFunction(1) / getRayleighPhaseFunction(0)).toBeCloseTo(2, 14);
    expect(getRayleighPhaseFunction(-0.3)).toBe(getRayleighPhaseFunction(0.3));
  });

  test('closed-form values and limits', () => {
    // Isotropic at g = 0; Cornette-Shanks at g = 0 is Rayleigh.
    expect(getHenyeyGreensteinPhaseFunction(0.4, 0)).toBeCloseTo(1 / (4 * Math.PI), 15);
    for (const mu of [-1, -0.2, 0, 0.6, 1]) {
      expect(getCornetteShanksPhaseFunction(mu, 0)).toBeCloseTo(getRayleighPhaseFunction(mu), 15);
    }
    // HG forward and backward peaks: (1 + g) / (4 pi (1 - g)^2) and (1 - g) / (4 pi (1 + g)^2).
    expect(getHenyeyGreensteinPhaseFunction(1, 0.7)).toBeCloseTo(1.7 / (4 * Math.PI * 0.09), 12);
    expect(getHenyeyGreensteinPhaseFunction(-1, 0.7)).toBeCloseTo(0.3 / (4 * Math.PI * 2.89), 14);
    // Reversing g mirrors the function.
    expect(getHenyeyGreensteinPhaseFunction(0.3, -0.6)).toBeCloseTo(
      getHenyeyGreensteinPhaseFunction(-0.3, 0.6),
      15
    );
  });

  test('the peaks keep full precision when |g| is near 1', () => {
    for (const g of [0.999999999, 0.9999]) {
      // HG at mu = 1 is (1 + g) / (4 pi (1 - g)^2); at mu = -1 for -g it is the same.
      const peak = (1 + g) / (4 * Math.PI * (1 - g) ** 2);
      expect(getHenyeyGreensteinPhaseFunction(1, g) / peak - 1).toBeCloseTo(0, 6);
      expect(getHenyeyGreensteinPhaseFunction(-1, -g) / peak - 1).toBeCloseTo(0, 6);
      const cornette = (3 * (1 - g * g) * 2) / (8 * Math.PI * (2 + g * g) * (1 - g) ** 3);
      expect(getCornetteShanksPhaseFunction(1, g) / cornette - 1).toBeCloseTo(0, 6);
    }
  });

  test('invalid inputs throw RangeError', () => {
    for (const fn of [getHenyeyGreensteinPhaseFunction, getCornetteShanksPhaseFunction]) {
      expect(() => fn(1.01, 0.5)).toThrow(RangeError);
      expect(() => fn(NaN, 0.5)).toThrow(RangeError);
      expect(() => fn(0.5, 1)).toThrow(RangeError);
      expect(() => fn(0.5, -1)).toThrow(RangeError);
      expect(() => fn(0.5, NaN)).toThrow(RangeError);
    }
    expect(() => getRayleighPhaseFunction(-1.01)).toThrow(RangeError);
    expect(() => getRayleighPhaseFunction(Infinity)).toThrow(RangeError);
  });
});

describe('getApproximateErfcx (Ren & MacKenzie 2007)', () => {
  test.each(ERFCX_REFERENCE)('erfcx(%s) matches the 30-digit value within the gate', (x, exact) => {
    expect(Math.abs(getApproximateErfcx(x) / exact - 1)).toBeLessThanOrEqual(ERFCX_GATE);
  });

  test('the largest error on a dense grid is the measured one, near x = 1.75', () => {
    let worst = 0;
    let where = 0;
    for (let i = 0; i <= 40000; i++) {
      const x = i * 0.001;
      const error = Math.abs(getApproximateErfcx(x) / referenceErfcx(x) - 1);
      if (error > worst) {
        worst = error;
        where = x;
      }
    }
    expect(worst).toBeLessThanOrEqual(ERFCX_GATE);
    expect(worst).toBeGreaterThan(0.0033);
    expect(where).toBeGreaterThan(1.6);
    expect(where).toBeLessThan(1.9);
  });

  test('the float64 reference agrees with the stored 30-digit values', () => {
    for (const [x, exact] of ERFCX_REFERENCE) {
      if (x <= 30) expect(Math.abs(referenceErfcx(x) / exact - 1)).toBeLessThan(1e-11);
    }
  });

  test('exact at 0, asymptote 1 / (sqrt(pi) x), decreasing', () => {
    expect(getApproximateErfcx(0)).toBe(1);
    expect(getApproximateErfcx(Infinity)).toBe(0);
    expect(getApproximateErfcx(1e8) * Math.sqrt(Math.PI) * 1e8).toBeCloseTo(1, 12);
    let last = Infinity;
    for (let x = 0; x < 50; x += 0.01) {
      const value = getApproximateErfcx(x);
      expect(value).toBeLessThan(last);
      last = value;
    }
    // No overflow of x squared for large finite arguments.
    for (const x of [1e10, 1e155, 1e300]) {
      expect(getApproximateErfcx(x) * Math.sqrt(Math.PI) * x).toBeCloseTo(1, 12);
    }
    // The two forms agree at the switch point.
    expect(getApproximateErfcx(1)).toBeCloseTo(getApproximateErfcx(1 + 1e-12), 11);
    expect(() => getApproximateErfcx(-0.1)).toThrow(RangeError);
    expect(() => getApproximateErfcx(NaN)).toThrow(RangeError);
  });
});

describe('getChapmanGrazingIncidenceFunction', () => {
  // x = R / H: 100 (gate 1 %), Mars 306, the Earth 797 and the Venus haze above the deck 1255
  // (gate 0.5 %). The cosine runs from straight up through the horizontal to below it.
  test.each([
    [100, 0.01],
    [306, 0.005],
    [797, 0.005],
    [1255, 0.005]
  ])('x = %s matches quadrature within %s', (x, gate) => {
    for (const cosine of [1, 0.7, 0.4, 0.2, 0.1, 0.05, 0.02, 0, -0.02, -0.05, -0.1, -0.15]) {
      const exact = chapmanByQuadrature(x, cosine);
      const error = Math.abs(getChapmanGrazingIncidenceFunction(x, cosine) / exact - 1);
      expect(error, `cos z = ${cosine}`).toBeLessThan(gate);
    }
  });

  test('the quadrature is exact for a vertical ray and the plane-parallel limit', () => {
    expect(chapmanByQuadrature(797, 1)).toBeCloseTo(1, 10);
    // Far from the horizon, Ch tends to sec z.
    expect(chapmanByQuadrature(1e6, 0.5)).toBeCloseTo(2, 4);
  });

  test('closed-form values', () => {
    // A horizontal ray: sqrt(pi x / 2).
    expect(getChapmanGrazingIncidenceFunction(797, 0)).toBeCloseTo(
      Math.sqrt((Math.PI / 2) * 797),
      10
    );
    // Vertical: 1 - O(1 / x), as documented.
    expect(getChapmanGrazingIncidenceFunction(797, 1)).toBeCloseTo(0.9988, 4);
    expect(getChapmanGrazingIncidenceFunction(1e6, 0.5)).toBeCloseTo(2, 2);
    // The prefactor must not overflow at the upper bound of the radius.
    expect(getChapmanGrazingIncidenceFunction(Number.MAX_VALUE, 1)).toBeCloseTo(1, 6);
    expect(getChapmanGrazingIncidenceFunction(Number.MAX_VALUE, 0.5)).toBeCloseTo(2, 6);
    // Continuous through the horizontal.
    expect(getChapmanGrazingIncidenceFunction(797, -1e-9)).toBeCloseTo(
      getChapmanGrazingIncidenceFunction(797, 1e-9),
      5
    );
    // Increasing with the zenith angle.
    let last = 0;
    for (let cosine = 1; cosine >= -0.2; cosine -= 0.001) {
      const value = getChapmanGrazingIncidenceFunction(797, cosine);
      expect(value).toBeGreaterThan(last);
      last = value;
    }
  });

  test('invalid inputs throw RangeError', () => {
    expect(() => getChapmanGrazingIncidenceFunction(0.5, 0.5)).toThrow(RangeError);
    expect(() => getChapmanGrazingIncidenceFunction(NaN, 0.5)).toThrow(RangeError);
    expect(() => getChapmanGrazingIncidenceFunction(797, 1.01)).toThrow(RangeError);
    expect(() => getChapmanGrazingIncidenceFunction(797, NaN)).toThrow(RangeError);
    // Straight down, or nearly: the tangent radius is below one scale height.
    expect(() => getChapmanGrazingIncidenceFunction(100, -1)).toThrow(/tangent radius/);
    expect(() => getChapmanGrazingIncidenceFunction(797, -0.9999999)).toThrow(/tangent radius/);
  });
});
