// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Numeric rows generated from BSC5; angular motions are projected mas/Julian year. */
export type StarCatalogRow = readonly [
  hr: number,
  rightAscension: number,
  declination: number,
  magnitude: number,
  colorIndex: number | null,
  properMotionRA: number,
  properMotionDec: number,
  parallax: number | null,
  radialVelocity: number | null,
  flags: string,
  designation: string
];

export type StarRecord = {
  /** Harvard Revised Bright Star number; identifies a catalog source, sometimes a multiple system. */
  readonly id: number;
  readonly designation: string;
  /** Julian epoch; the bundled catalog uses 2000.0. Axes remain equatorial J2000. */
  readonly epochYear: number;
  readonly rightAscension: number;
  readonly declination: number;
  readonly magnitude: number;
  /** Observed B minus V, including reddening; null when missing. */
  readonly colorIndex: number | null;
  /** cos(declination) * d(RA)/dt, milliarcseconds per Julian year. */
  readonly properMotionRA: number;
  readonly properMotionDec: number;
  /** Milliarcseconds; zero and negative catalog measurements are retained. */
  readonly parallax: number | null;
  /** km/s, positive receding. */
  readonly radialVelocity: number | null;
  readonly dynamicalParallax: boolean;
  readonly radialVelocityFlags: string;
};

export type StarPosition = {
  readonly star: StarRecord;
  /** Unit vector in fixed equatorial J2000 axes. */
  readonly equatorialDirection: readonly number[];
  /** Unit vector after the optional rendering rotation. */
  readonly direction: readonly number[];
  readonly rightAscension: number;
  readonly declination: number;
  readonly distanceParsecs: number | null;
  readonly magnitude: number;
  readonly relativeFlux: number;
  /** Approximate linear RGB, normalized to a peak of one. */
  readonly color: readonly number[];
  readonly motionModel: 'rectilinear' | 'galactic' | 'angular';
  readonly radialVelocityAssumed: boolean;
};

export type StarPositionOptions = {
  /** Default rectilinear. Galactic integrates an illustrative static Galactic potential. */
  model?: 'rectilinear' | 'galactic';
  /** Column-major 3x3 proper rotation, e.g. getStarfieldRotation for a modern observer date. */
  rotation?: readonly number[];
  /** Galactic integration maximum step in Julian years; default 10,000. */
  maximumStepYears?: number;
};
