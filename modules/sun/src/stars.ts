// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original implementation of tangent-basis space motion and Planck radiation.
// Catalog data and license: https://github.com/brettonw/YaleBrightStarCatalog
// B-V temperature approximation: https://arxiv.org/abs/1201.1809 (Ballesteros 2012).
import {STAR_CATALOG_DATA} from './data/bright-stars';
import {
  equatorialToGalactic,
  galacticToEquatorial,
  integrateGalacticOrbit,
  KMS_TO_PC_PER_YEAR,
  SOLAR_POSITION,
  SOLAR_VELOCITY
} from './star-galactic';
import type {StarRecord, StarPosition, StarPositionOptions} from './star-types';

export type {StarRecord, StarPosition, StarPositionOptions} from './star-types';
export {
  getGalacticAcceleration,
  getGalacticPotential,
  integrateGalacticOrbit
} from './star-galactic';
export {createMilkyWayBackground} from './star-milky-way';
export type {MilkyWayBackground, MilkyWaySample} from './star-milky-way';

/** Brightest 7,000 BSC5 sources, sorted by visual magnitude then HR number. */
export const STAR_CATALOG: readonly StarRecord[] = Object.freeze(
  STAR_CATALOG_DATA.map(row =>
    Object.freeze({
      id: row[0],
      designation: row[10],
      epochYear: 2000,
      rightAscension: row[1],
      declination: row[2],
      magnitude: row[3],
      colorIndex: row[4],
      properMotionRA: row[5],
      properMotionDec: row[6],
      parallax: row[7],
      radialVelocity: row[8],
      dynamicalParallax: row[9].startsWith('D'),
      radialVelocityFlags: row[9].split('|')[1]
    })
  )
);

/** Metadata describes the fixed input selection, not a completeness guarantee at future epochs. */
export const STAR_CATALOG_INFO = Object.freeze({
  count: 7000,
  epochYear: 2000,
  faintestMagnitude: 6.3,
  positiveParallaxes: 2797,
  fullSpaceMotions: 2796,
  sourceRevision: 'abffb3b7223ae37e879b0a3ff5b49ad06aed5576',
  source: 'Yale Bright Star Catalog, fifth revised edition (1991), MIT-licensed Bretton Wade export'
});
const MAS_TO_RADIANS = Math.PI / (180 * 3600 * 1000);
const colorCache = new Map<number | null, readonly number[]>();

/** Propagate a source to a numeric Julian epoch, without extrapolating Earth precession. */
export function getStarPosition(
  star: StarRecord,
  epochYear: number,
  options: StarPositionOptions = {}
): StarPosition {
  validateOptions(epochYear, options);
  const solar =
    options.model === 'galactic'
      ? integrateGalacticOrbit(
          SOLAR_POSITION,
          SOLAR_VELOCITY,
          epochYear - 2000,
          options.maximumStepYears
        ).position
      : undefined;
  return propagate(star, epochYear, options, solar);
}

/** Batch propagation shares the observer's Galactic integration between all sources. */
export function getStarPositions(
  epochYear: number,
  options: StarPositionOptions = {},
  catalog: readonly StarRecord[] = STAR_CATALOG
): StarPosition[] {
  validateOptions(epochYear, options);
  const solar =
    options.model === 'galactic'
      ? integrateGalacticOrbit(
          SOLAR_POSITION,
          SOLAR_VELOCITY,
          epochYear - 2000,
          options.maximumStepYears
        ).position
      : undefined;
  return catalog.map(star => propagate(star, epochYear, options, solar));
}

/** Observed B-V to qualitative linear RGB. Missing B-V uses white. */
export function getStarColor(colorIndex: number | null): readonly number[] {
  if (colorIndex !== null && !Number.isFinite(colorIndex))
    throw new RangeError('B-V must be finite or null');
  const cached = colorCache.get(colorIndex);
  if (cached) return cached;
  if (colorCache.size >= 1024) colorCache.clear();
  let color: number[] = [1, 1, 1];
  if (colorIndex !== null) {
    const bv = Math.max(-0.4, Math.min(2, colorIndex));
    const temperature = 4600 * (1 / (0.92 * bv + 1.7) + 1 / (0.92 * bv + 0.62));
    // Three broad spectral samples; this is a rendering tint, not calibrated sRGB photometry.
    const planck = (wavelength: number): number =>
      1 / (wavelength ** 5 * Math.expm1(0.01438776877 / (wavelength * temperature)));
    color = [680e-9, 550e-9, 440e-9].map(planck);
    const peak = Math.max(...color);
    color = color.map(value => value / peak);
  }
  const result = Object.freeze(color);
  colorCache.set(colorIndex, result);
  return result;
}

function propagate(
  star: StarRecord,
  epochYear: number,
  options: StarPositionOptions,
  solar?: number[]
): StarPosition {
  validateStar(star);
  if (solar && star.epochYear !== 2000)
    throw new RangeError('Galactic motion requires J2000 input records');
  const years = epochYear - star.epochYear;
  if (Math.abs(years) > 1e7)
    throw new RangeError('Star propagation is limited to 10 million Julian years');
  const {rightAscension: ra, declination: dec} = star;
  const cosDec = Math.cos(dec),
    sinDec = Math.sin(dec),
    cosRA = Math.cos(ra),
    sinRA = Math.sin(ra);
  const direction = [cosDec * cosRA, cosDec * sinRA, sinDec];
  const raRate = star.properMotionRA * MAS_TO_RADIANS;
  const decRate = star.properMotionDec * MAS_TO_RADIANS;
  const tangent = [
    -sinRA * raRate - sinDec * cosRA * decRate,
    cosRA * raRate - sinDec * sinRA * decRate,
    cosDec * decRate
  ];
  const distance = star.parallax !== null && star.parallax > 0 ? 1000 / star.parallax : null;
  let relative: number[],
    distanceParsecs: number | null = null;
  let motionModel: StarPosition['motionModel'] = 'angular';
  if (distance !== null) {
    const position = direction.map(value => value * distance);
    const velocity = tangent.map(
      (value, i) =>
        value * distance + direction[i] * (star.radialVelocity ?? 0) * KMS_TO_PC_PER_YEAR
    );
    if (solar) {
      const galPosition = equatorialToGalactic(position).map(
        (value, i) => value + SOLAR_POSITION[i]
      );
      const galVelocity = equatorialToGalactic(velocity).map(
        (value, i) => value * 1e6 + SOLAR_VELOCITY[i]
      );
      const moved = integrateGalacticOrbit(
        galPosition,
        galVelocity,
        years,
        options.maximumStepYears
      ).position;
      relative = galacticToEquatorial(moved.map((value, i) => value - solar[i]));
      motionModel = 'galactic';
    } else {
      relative = position.map((value, i) => value + velocity[i] * years);
      motionModel = 'rectilinear';
    }
    distanceParsecs = Math.hypot(...relative);
  } else relative = direction.map((value, i) => value + tangent[i] * years);
  const length = Math.hypot(...relative);
  if (!(length > 0) || !Number.isFinite(length))
    throw new RangeError('Star coincides with observer or motion overflowed');
  const equatorialDirection = relative.map(value => value / length);
  const rotated = options.rotation
    ? rotate(options.rotation, equatorialDirection)
    : [...equatorialDirection];
  const magnitude =
    distanceParsecs !== null && distance !== null
      ? star.magnitude + 5 * Math.log10(distanceParsecs / distance)
      : star.magnitude;
  return {
    star,
    equatorialDirection,
    direction: rotated,
    rightAscension:
      (Math.atan2(equatorialDirection[1], equatorialDirection[0]) + 2 * Math.PI) % (2 * Math.PI),
    declination: Math.asin(Math.max(-1, Math.min(1, equatorialDirection[2]))),
    distanceParsecs,
    magnitude,
    relativeFlux: 10 ** (-0.4 * magnitude),
    color: getStarColor(star.colorIndex),
    motionModel,
    radialVelocityAssumed: star.radialVelocity === null
  };
}

function validateStar(star: StarRecord): void {
  if (
    ![
      star.epochYear,
      star.rightAscension,
      star.declination,
      star.magnitude,
      star.properMotionRA,
      star.properMotionDec
    ].every(Number.isFinite) ||
    Math.abs(star.declination) > Math.PI / 2 ||
    (star.parallax !== null && !Number.isFinite(star.parallax)) ||
    (star.radialVelocity !== null && !Number.isFinite(star.radialVelocity))
  ) {
    throw new RangeError('Invalid star coordinates or motion');
  }
}
function validateOptions(epochYear: number, options: StarPositionOptions): void {
  if (!Number.isFinite(epochYear) || Math.abs(epochYear - 2000) > 1e7)
    throw new RangeError('Epoch must be within 10 million years of J2000');
  if (
    options.model !== undefined &&
    options.model !== 'rectilinear' &&
    options.model !== 'galactic'
  )
    throw new RangeError('Unknown stellar motion model');
  if (
    options.maximumStepYears !== undefined &&
    (!Number.isFinite(options.maximumStepYears) ||
      options.maximumStepYears <= 0 ||
      options.maximumStepYears > 10000)
  )
    throw new RangeError('Invalid Galactic step');
  const m = options.rotation;
  if (m) {
    if (m.length !== 9 || !m.every(Number.isFinite))
      throw new RangeError('Rotation must be a finite 3x3 matrix');
    for (let a = 0; a < 3; a++)
      for (let b = 0; b < 3; b++) {
        const dot = [0, 1, 2].reduce((sum, i) => sum + m[a * 3 + i] * m[b * 3 + i], 0);
        if (Math.abs(dot - (a === b ? 1 : 0)) > 1e-6)
          throw new RangeError('Rotation must be orthonormal');
      }
    const determinant =
      m[0] * (m[4] * m[8] - m[7] * m[5]) -
      m[3] * (m[1] * m[8] - m[7] * m[2]) +
      m[6] * (m[1] * m[5] - m[4] * m[2]);
    if (Math.abs(determinant - 1) > 1e-6) throw new RangeError('Rotation must preserve handedness');
  }
}
function rotate(m: readonly number[], v: readonly number[]): number[] {
  return [0, 1, 2].map(i => m[i] * v[0] + m[i + 3] * v[1] + m[i + 6] * v[2]);
}

export {getStarLayerData} from './star-render';
export type {StarLayerOptions, StarLayerDatum} from './star-render';
