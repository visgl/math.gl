// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original evaluation of the IAU WGCCRE 2015 rotation models. Coefficients from Archinal et al. 2018 as NAIF pck00011.tpc gives them; no SPICE code copied.

import {CelestialFrameTransform} from './frame-transform';
import type {JulianDate} from './julian-date';
import {checkBody, getDaysSinceJ2000TT} from './solar-system-body';
import type {SolarSystemBody} from './solar-system-body';

/** The orientation of a body: its north pole and prime meridian in the ICRF. */
export type BodyRotationElements = {
  /** Right ascension of the north pole, α0, degrees, 0 ≤ α0 < 360. */
  readonly poleRightAscension: number;
  /** Declination of the north pole, δ0, degrees, −90 ≤ δ0 ≤ 90. */
  readonly poleDeclination: number;
  /** Angle W of the prime meridian along the equator from the ascending node, degrees, 0 ≤ W < 360. */
  readonly primeMeridian: number;
};

/**
 * One periodic term: an angle θ = θ0 + θ1 T + θ2 T² (degrees, T in Julian centuries of TT) and
 * the amplitudes, in degrees, of `sin θ` in α0, `cos θ` in δ0 and `sin θ` in W.
 */
type PeriodicTerm = readonly [
  angle0: number,
  angle1: number,
  angle2: number,
  rightAscension: number,
  declination: number,
  primeMeridian: number
];

/**
 * α0 = a0 + a1 T + Σ, δ0 = d0 + d1 T + Σ, W = w0 + w1 d + w2 d² + Σ; T in Julian centuries and d
 * in days of TT since J2000.0.
 */
type RotationModel = {
  readonly rightAscension: readonly [number, number];
  readonly declination: readonly [number, number];
  readonly primeMeridian: readonly [number, number, number];
  readonly terms: readonly PeriodicTerm[];
};

// Coefficients of Archinal et al. (2018), Tables 1 and 2, as NAIF pck00011.tpc gives them (rates
// of the angles in degrees per Julian century). Only the angles with a non-zero amplitude for the
// body itself are listed.
// biome-ignore format: keep one periodic term per row
const MODELS: Readonly<Record<SolarSystemBody, RotationModel>> = {
  sun: {rightAscension: [286.13, 0], declination: [63.87, 0], primeMeridian: [84.176, 14.1844, 0], terms: []},
  mercury: {
    rightAscension: [281.0103, -0.0328],
    declination: [61.4155, -0.0049],
    primeMeridian: [329.5988, 6.1385108, 0],
    // M1 to M5
    terms: [
      [174.7910857, 149472.535875, 0, 0, 0, 0.01067257],
      [349.5821714, 298945.07175, 0, 0, 0, -0.00112309],
      [164.3732571, 448417.607625, 0, 0, 0, -0.0001104],
      [339.1643429, 597890.1435, 0, 0, 0, -0.00002539],
      [153.9554286, 747362.679375, 0, 0, 0, -0.00000571]
    ]
  },
  venus: {rightAscension: [272.76, 0], declination: [67.16, 0], primeMeridian: [160.2, -1.4813688, 0], terms: []},
  earth: {rightAscension: [0, -0.641], declination: [90, -0.557], primeMeridian: [190.147, 360.9856235, 0], terms: []},
  moon: {
    rightAscension: [269.9949, 0.0031],
    declination: [66.5392, 0.013],
    primeMeridian: [38.3213, 13.17635815, -1.4e-12],
    // E1 to E13
    terms: [
      [125.045, -1935.5364525, 0, -3.8787, 1.5419, 3.561],
      [250.089, -3871.072905, 0, -0.1204, 0.0239, 0.1208],
      [260.008, 475263.3328725, 0, 0.07, -0.0278, -0.0642],
      [176.625, 487269.629985, 0, -0.0172, 0.0068, 0.0158],
      [357.529, 35999.0509575, 0, 0, 0, 0.0252],
      [311.589, 964468.49931, 0, 0.0072, -0.0029, -0.0066],
      [134.963, 477198.869325, 0, 0, 0.0009, -0.0047],
      [276.617, 12006.300765, 0, 0, 0, -0.0046],
      [34.226, 63863.5132425, 0, 0, 0, 0.0028],
      [15.134, -5806.6093575, 0, -0.0052, 0.0008, 0.0052],
      [119.743, 131.84064, 0, 0, 0, 0.004],
      [239.961, 6003.1503825, 0, 0, 0, 0.0019],
      [25.053, 473327.79642, 0, 0.0043, -0.0009, -0.0044]
    ]
  },
  mars: {
    rightAscension: [317.269202, -0.10927547],
    declination: [54.432516, -0.05827105],
    primeMeridian: [176.049863, 350.891982443297, 0],
    terms: [
      [198.991226, 19139.4819985, 0, 0.000068, 0, 0],
      [226.292679, 38280.8511281, 0, 0.000238, 0, 0],
      [249.663391, 57420.7251593, 0, 0.000052, 0, 0],
      [266.18351, 76560.636795, 0, 0.000009, 0, 0],
      [79.398797, 0.5042615, 0, 0.419057, 0, 0],
      [122.433576, 19139.9407476, 0, 0, 0.000051, 0],
      [43.058401, 38280.8753272, 0, 0, 0.000141, 0],
      [57.663379, 57420.7517205, 0, 0, 0.000031, 0],
      [79.476401, 76560.6495004, 0, 0, 0.000005, 0],
      [166.325722, 0.5042615, 0, 0, 1.591274, 0],
      [129.071773, 19140.0328244, 0, 0, 0, 0.000145],
      [36.352167, 38281.0473591, 0, 0, 0, 0.000157],
      [56.668646, 57420.929536, 0, 0, 0, 0.00004],
      [67.364003, 76560.2552215, 0, 0, 0, 0.000001],
      [104.79268, 95700.4387578, 0, 0, 0, 0.000001],
      [95.391654, 0.5042615, 0, 0, 0, 0.584542]
    ]
  },
  jupiter: {
    rightAscension: [268.056595, -0.006499],
    declination: [64.495303, 0.002413],
    primeMeridian: [284.95, 870.536, 0],
    // Ja to Je
    terms: [
      [99.360714, 4850.4046, 0, 0.000117, 0.00005, 0],
      [175.895369, 1191.9605, 0, 0.000938, 0.000404, 0],
      [300.323162, 262.5475, 0, 0.001432, 0.000617, 0],
      [114.012305, 6070.2476, 0, 0.00003, -0.000013, 0],
      [49.511251, 64.3, 0, 0.00215, 0.000926, 0]
    ]
  },
  saturn: {rightAscension: [40.589, -0.036], declination: [83.537, -0.004], primeMeridian: [38.9, 810.7939024, 0], terms: []},
  uranus: {rightAscension: [257.311, 0], declination: [-15.175, 0], primeMeridian: [203.81, -501.1600928, 0], terms: []},
  neptune: {
    rightAscension: [299.36, 0],
    declination: [43.46, 0],
    primeMeridian: [249.978, 541.1397757, 0],
    // N
    terms: [[357.85, 52.316, 0, 0.7, -0.51, -0.48]]
  }
};

/** The supported dates: 1900-01-01T12:00 TT to 2100-01-01T12:00 TT, in days from J2000.0. */
const MINIMUM_DAYS = -36524;
const MAXIMUM_DAYS = 36525;
const DAYS_PER_CENTURY = 36525;
const RADIANS = Math.PI / 180;

type RotationState = {
  /** α0, δ0 and W, degrees, W not reduced. */
  angles: [number, number, number];
  /** dα0/dt, dδ0/dt and dW/dt, degrees per day. */
  rates: [number, number, number];
};

/** Evaluates a rotation model and its time derivative at `days` days of TT since J2000.0. */
function evaluate(model: RotationModel, days: number): RotationState {
  const centuries = days / DAYS_PER_CENTURY;
  let rightAscension = model.rightAscension[0] + model.rightAscension[1] * centuries;
  let declination = model.declination[0] + model.declination[1] * centuries;
  const [w0, w1, w2] = model.primeMeridian;
  let primeMeridian = w0 + w1 * days + w2 * days * days;
  let rightAscensionRate = model.rightAscension[1] / DAYS_PER_CENTURY;
  let declinationRate = model.declination[1] / DAYS_PER_CENTURY;
  let primeMeridianRate = w1 + 2 * w2 * days;
  for (const [a0, a1, a2, ra, dec, pm] of model.terms) {
    const angle = (a0 + a1 * centuries + a2 * centuries * centuries) * RADIANS;
    // dθ/dt in radians per day, so that amplitude × dθ/dt is in degrees per day.
    const angleRate = ((a1 + 2 * a2 * centuries) / DAYS_PER_CENTURY) * RADIANS;
    const sine = Math.sin(angle);
    const cosine = Math.cos(angle);
    rightAscension += ra * sine;
    declination += dec * cosine;
    primeMeridian += pm * sine;
    rightAscensionRate += ra * cosine * angleRate;
    declinationRate -= dec * sine * angleRate;
    primeMeridianRate += pm * cosine * angleRate;
  }
  return {
    angles: [rightAscension, declination, primeMeridian],
    rates: [rightAscensionRate, declinationRate, primeMeridianRate]
  };
}

/**
 * Returns the IAU WGCCRE 2015 orientation of a body: the right ascension α0 and declination δ0 of
 * its north pole, and the angle W of its prime meridian, in the ICRF.
 *
 * The models are those of Archinal et al. (2018), "Report of the IAU Working Group on Cartographic
 * Coordinates and Rotational Elements: 2015", Celest. Mech. Dyn. Astr. 130:22,
 * doi:10.1007/s10569-017-9805-5, Tables 1 and 2, including the periodic terms of Mercury, the Moon,
 * Mars, Jupiter and Neptune. The coefficients are as NAIF `pck00011.tpc` gives them. The result
 * agrees with CSPICE and `pck00011.tpc` to 1e-8 degrees in the supported range; the limit is the
 * binary64 precision of W, which grows to 3e7 degrees for Jupiter in 2100.
 *
 * The IAU Earth model is a simple linear model. It has no nutation and no polar motion, and it uses
 * TT in place of UT1; its error is of the order of 0.1 degree in W. Use an Earth orientation model
 * for precise work on the Earth. The IAU Moon model approximates the mean Earth/polar axis frame.
 * @param body - The body.
 * @param tt - The date, a `JulianDate` in the TT scale, from 1900-01-01T12:00 to 2100-01-01T12:00 TT.
 * @returns α0 and δ0, degrees, and W, degrees. α0 and W are in [0, 360) and δ0 is in [−90, 90].
 * @throws {RangeError} When `body` is not supported, `tt` is not TT, or `tt` is outside the range.
 */
export function getBodyRotationElements(
  body: SolarSystemBody,
  tt: JulianDate
): BodyRotationElements {
  const model = MODELS[checkBody(body)];
  const days = getDaysSinceJ2000TT(tt, MINIMUM_DAYS, MAXIMUM_DAYS);
  let [poleRightAscension, poleDeclination, primeMeridian] = evaluate(model, days).angles;
  // The linear Earth model gives δ0 > 90 degrees before J2000.0. The same orientation has the
  // pole at δ0' = 180 − δ0, α0' = α0 + 180 and W' = W + 180.
  if (poleDeclination > 90) {
    poleDeclination = 180 - poleDeclination;
    poleRightAscension += 180;
    primeMeridian += 180;
  }
  return {
    poleRightAscension: reduceDegrees(poleRightAscension),
    poleDeclination,
    primeMeridian: reduceDegrees(primeMeridian)
  };
}

/**
 * Returns the rotation from the ICRF to the body-fixed frame of a body, with its time derivative.
 *
 * The body-fixed frame has +Z at the north pole and +X at the prime meridian, as the IAU WGCCRE
 * 2015 report defines them (see {@link getBodyRotationElements}). The rotation is
 * `R = Rz(W) Rx(90° − δ0) Rz(90° + α0)`, where each factor rotates the frame (not the vector).
 * The derivative includes the rates of α0, δ0 and W. `frame.transformState` thus gives a
 * body-fixed velocity from an ICRF state. The result agrees with the CSPICE `sxform` from `J2000`
 * to `IAU_<BODY>` with `pck00011.tpc` to 1e-10 in the matrix and 1e-14 per second in the derivative.
 * @param body - The body.
 * @param tt - The date, a `JulianDate` in the TT scale, from 1900-01-01T12:00 to 2100-01-01T12:00 TT.
 * @returns A frame snapshot from `'ICRF'` to `'IAU_<BODY>'` (for example `'IAU_MARS'`), at `tt`,
 * with a column-major rotation and a rotation rate per second.
 * @throws {RangeError} When `body` is not supported, `tt` is not TT, or `tt` is outside the range.
 */
export function getBodyFixedFrame(body: SolarSystemBody, tt: JulianDate): CelestialFrameTransform {
  const model = MODELS[checkBody(body)];
  const days = getDaysSinceJ2000TT(tt, MINIMUM_DAYS, MAXIMUM_DAYS);
  const {angles, rates} = evaluate(model, days);
  const [alpha, delta, w] = angles.map(angle => angle * RADIANS);
  // Rates in radians per second.
  const [alphaRate, deltaRate, wRate] = rates.map(rate => (rate * RADIANS) / 86400);

  const first = frameRotationZ(Math.PI / 2 + alpha);
  const second = frameRotationX(Math.PI / 2 - delta);
  const third = frameRotationZ(w);
  const rotation = multiply(third, multiply(second, first));
  const rate = add(
    add(
      scale(multiply(frameRotationZDerivative(w), multiply(second, first)), wRate),
      scale(
        multiply(third, multiply(frameRotationXDerivative(Math.PI / 2 - delta), first)),
        -deltaRate
      )
    ),
    scale(
      multiply(third, multiply(second, frameRotationZDerivative(Math.PI / 2 + alpha))),
      alphaRate
    )
  );
  return new CelestialFrameTransform(rotation, {
    from: 'ICRF',
    to: `IAU_${body.toUpperCase()}`,
    epoch: tt,
    rotationRate: rate
  });
}

/** Reduces an angle in degrees to [0, 360). */
function reduceDegrees(angle: number): number {
  const reduced = ((angle % 360) + 360) % 360;
  return reduced === 360 ? 0 : reduced;
}

// 3 x 3 matrices, column-major, as CelestialFrameTransform uses them.

/** Frame rotation about +Z: the coordinates of a fixed vector in a frame turned by `angle`. */
function frameRotationZ(angle: number): number[] {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [c, -s, 0, s, c, 0, 0, 0, 1];
}
/** The derivative of {@link frameRotationZ} by `angle`. */
function frameRotationZDerivative(angle: number): number[] {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [-s, -c, 0, c, -s, 0, 0, 0, 0];
}
/** Frame rotation about +X. */
function frameRotationX(angle: number): number[] {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [1, 0, 0, 0, c, -s, 0, s, c];
}
/** The derivative of {@link frameRotationX} by `angle`. */
function frameRotationXDerivative(angle: number): number[] {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [0, 0, 0, 0, -s, -c, 0, c, -s];
}
/** The product a b of two column-major 3 x 3 matrices. */
function multiply(a: readonly number[], b: readonly number[]): number[] {
  const output = new Array<number>(9);
  for (let column = 0; column < 3; column++) {
    for (let row = 0; row < 3; row++) {
      output[column * 3 + row] =
        a[row] * b[column * 3] + a[row + 3] * b[column * 3 + 1] + a[row + 6] * b[column * 3 + 2];
    }
  }
  return output;
}
/** The sum of two matrices. */
function add(a: readonly number[], b: readonly number[]): number[] {
  return a.map((value, i) => value + b[i]);
}
/** A matrix times a number. */
function scale(a: readonly number[], factor: number): number[] {
  return a.map(value => value * factor);
}
