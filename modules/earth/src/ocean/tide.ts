// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original implementation from Schureman (1958), U.S. Coast and Geodetic Survey Special Publication 98.

import type {JulianDate} from '../celestial/julian-date';
import {checkFinite, checkRange} from './domain';

/**
 * Names of the tidal constituents with tabulated arguments and node factors. The names are the
 * NOAA CO-OPS names (for example `NU2`, `LAM2`, `RHO`), so that NOAA harmonic constants can be
 * passed directly.
 */
export type TidalConstituentName =
  | 'M2' | 'S2' | 'N2' | 'K1' | 'M4' | 'O1' | 'M6' | 'MK3' | 'S4' | 'MN4' | 'NU2' | 'S6'
  | 'MU2' | '2N2' | 'OO1' | 'LAM2' | 'S1' | 'M1' | 'J1' | 'MM' | 'SSA' | 'SA' | 'MSF' | 'MF'
  | 'RHO' | 'Q1' | 'T2' | 'R2' | '2Q1' | 'P1' | '2SM2' | 'M3' | 'L2' | '2MK3' | 'K2' | 'M8'
  | 'MS4'; // biome-ignore format: one line per group of names

/** One harmonic constituent of a station, as a harmonic analysis gives it. */
export type TidalConstituent = {
  /** Constituent name. */
  name: TidalConstituentName;
  /** Mean amplitude H, in the caller's height unit. Node factors are not applied. */
  amplitude: number;
  /** Phase lag κ (the Greenwich epoch G), degrees. */
  phase: number;
  /** Speed a, degrees per mean solar hour. */
  speed: number;
};

/** Options of {@link getTideHeight}. */
export type TideHeightOptions = {
  /** Height of the mean water level above the height datum, Z0. Default 0. */
  datumOffset?: number;
};

/** First and last calendar years of the supported domain. */
const MIN_YEAR = 1800;
const MAX_YEAR = 2200;

const DEGREES = Math.PI / 180;
/** Julian date of Greenwich mean noon, 31 December 1899, the epoch of Schureman's table 1. */
const SCHUREMAN_EPOCH = 2415020;

type Factor =
  | 'Mm' | 'Mf' | 'O1' | 'J1' | 'OO1' | 'M2' | 'M3' | 'K1' | 'K2' | 'M1' | 'L2'; // biome-ignore format: keep the list short

/**
 * Argument and node factor of one constituent.
 * - `v`: coefficients of T, s, h, p and p1, and a constant in degrees (Schureman's V).
 * - `u`: coefficients of ξ, ν, ν′, 2ν″ and R, and of Q for M1 (Schureman's u).
 * - `f`: node-factor formulas and their powers. An empty list gives f = 1.
 */
type ConstituentDefinition = {
  v: readonly [number, number, number, number, number, number];
  u: readonly [number, number, number, number, number, number];
  f: readonly (readonly [Factor, number])[];
};

const M2_F = [['M2', 1]] as const;
const O1_F = [['O1', 1]] as const;
const UNITY: readonly (readonly [Factor, number])[] = [];
const ZERO_U = [0, 0, 0, 0, 0, 0] as const;

/**
 * Schureman (1958), table 2 (pp. 164-166) and table 2a (p. 167). The reference numbers of table 2
 * are in the comments. For M1 see {@link getTidalEquilibriumArgument}. MSf takes the node factor
 * of M2, as the footnote of table 14 (p. 203) states for prediction. Table 2 gives formula (73) for
 * the long-period term A5 of the tide-producing force.
 */
// biome-ignore format: keep one constituent per line
export const TIDAL_CONSTITUENTS: Readonly<Record<TidalConstituentName, ConstituentDefinition>> = {
  //           T   s   h   p  p1  const        ξ   ν  ν′ 2ν″  R   Q
  SA:   {v: [0,  0,  1,  0,  0,    0], u: ZERO_U, f: UNITY},                       // B64
  SSA:  {v: [0,  0,  2,  0,  0,    0], u: ZERO_U, f: UNITY},                       // B6
  MM:   {v: [0,  1,  0, -1,  0,    0], u: ZERO_U, f: [['Mm', 1]]},                 // A2
  MSF:  {v: [0,  2, -2,  0,  0,    0], u: ZERO_U, f: M2_F},  // A5; f from table 14 footnote
  MF:   {v: [0,  2,  0,  0,  0,    0], u: [-2, 0, 0, 0, 0, 0], f: [['Mf', 1]]},    // A6
  '2Q1':{v: [1, -4,  1,  2,  0,   90], u: [2, -1, 0, 0, 0, 0], f: O1_F},           // A17
  Q1:   {v: [1, -3,  1,  1,  0,   90], u: [2, -1, 0, 0, 0, 0], f: O1_F},           // A15
  RHO:  {v: [1, -3,  3, -1,  0,   90], u: [2, -1, 0, 0, 0, 0], f: O1_F},           // A18
  O1:   {v: [1, -2,  1,  0,  0,   90], u: [2, -1, 0, 0, 0, 0], f: O1_F},           // A14
  M1:   {v: [1, -1,  1,  0,  0,  -90], u: [1, -1, 0, 0, 0, 1], f: [['M1', 1]]},    // note 1, (201)
  P1:   {v: [1,  0, -1,  0,  0,   90], u: ZERO_U, f: UNITY},                       // B14
  S1:   {v: [1,  0,  0,  0,  0,    0], u: ZERO_U, f: UNITY},                       // B71
  K1:   {v: [1,  0,  1,  0,  0,  -90], u: [0, 0, -1, 0, 0, 0], f: [['K1', 1]]},    // note 2
  J1:   {v: [1,  1,  1, -1,  0,  -90], u: [0, -1, 0, 0, 0, 0], f: [['J1', 1]]},    // A24
  OO1:  {v: [1,  2,  1,  0,  0,  -90], u: [-2, -1, 0, 0, 0, 0], f: [['OO1', 1]]},  // A31
  '2N2':{v: [2, -4,  2,  2,  0,    0], u: [2, -2, 0, 0, 0, 0], f: M2_F},           // A42
  MU2:  {v: [2, -4,  4,  0,  0,    0], u: [2, -2, 0, 0, 0, 0], f: M2_F},           // A45
  N2:   {v: [2, -3,  2,  1,  0,    0], u: [2, -2, 0, 0, 0, 0], f: M2_F},           // A40
  NU2:  {v: [2, -3,  4, -1,  0,    0], u: [2, -2, 0, 0, 0, 0], f: M2_F},           // A43
  M2:   {v: [2, -2,  2,  0,  0,    0], u: [2, -2, 0, 0, 0, 0], f: M2_F},           // A39
  LAM2: {v: [2, -1,  0,  1,  0,  180], u: [2, -2, 0, 0, 0, 0], f: M2_F},           // A44
  L2:   {v: [2, -1,  2, -1,  0,  180], u: [2, -2, 0, 0, -1, 0], f: [['L2', 1]]},   // note 3
  T2:   {v: [2,  0, -1,  0,  1,    0], u: ZERO_U, f: UNITY},                       // B40
  S2:   {v: [2,  0,  0,  0,  0,    0], u: ZERO_U, f: UNITY},                       // B39
  R2:   {v: [2,  0,  1,  0, -1,  180], u: ZERO_U, f: UNITY},                       // B41
  K2:   {v: [2,  0,  2,  0,  0,    0], u: [0, 0, 0, -1, 0, 0], f: [['K2', 1]]},    // note 4
  '2SM2':{v: [2, 2, -2,  0,  0,    0], u: [-2, 2, 0, 0, 0, 0], f: M2_F},           // table 2a
  M3:   {v: [3, -3,  3,  0,  0,    0], u: [3, -3, 0, 0, 0, 0], f: [['M3', 1]]},    // A82
  '2MK3':{v: [3, -4, 3,  0,  0,   90], u: [4, -4, 1, 0, 0, 0], f: [['M2', 2], ['K1', 1]]}, // 2a
  MK3:  {v: [3, -2,  3,  0,  0,  -90], u: [2, -2, -1, 0, 0, 0], f: [['M2', 1], ['K1', 1]]}, // 2a
  MN4:  {v: [4, -5,  4,  1,  0,    0], u: [4, -4, 0, 0, 0, 0], f: [['M2', 2]]},    // table 2a
  M4:   {v: [4, -4,  4,  0,  0,    0], u: [4, -4, 0, 0, 0, 0], f: [['M2', 2]]},    // table 2a
  MS4:  {v: [4, -2,  2,  0,  0,    0], u: [2, -2, 0, 0, 0, 0], f: M2_F},           // table 2a
  S4:   {v: [4,  0,  0,  0,  0,    0], u: ZERO_U, f: UNITY},                       // table 2a
  M6:   {v: [6, -6,  6,  0,  0,    0], u: [6, -6, 0, 0, 0, 0], f: [['M2', 3]]},    // table 2a
  S6:   {v: [6,  0,  0,  0,  0,    0], u: ZERO_U, f: UNITY},                       // table 2a
  M8:   {v: [8, -8,  8,  0,  0,    0], u: [8, -8, 0, 0, 0, 0], f: [['M2', 4]]}     // table 2a
};

/** Mean longitudes of Schureman (1958), table 1 (p. 162), degrees. */
type Longitudes = {h: number; p1: number; s: number; p: number; N: number};

/** Arguments of the moon's orbit for one instant, degrees, and the node factors. */
type NodalTerms = {u: [number, number, number, number, number, number]; f: Record<Factor, number>};

function arcseconds(degrees: number, minutes: number, seconds: number): number {
  return degrees + minutes / 60 + seconds / 3600;
}

/** Mean longitudes at a Julian date in mean solar time, from Schureman (1958), table 1. */
function getMeanLongitudes(julianDate: number): Longitudes {
  // Julian centuries of 36525 days from Greenwich mean noon, 31 December 1899.
  const c = (julianDate - SCHUREMAN_EPOCH) / 36525;
  const c2 = c * c;
  const c3 = c2 * c;
  return {
    h: arcseconds(279, 41, 48.04) + (129602768.13 * c + 1.089 * c2) / 3600,
    p1: arcseconds(281, 13, 15.0) + (6189.03 * c + 1.63 * c2 + 0.012 * c3) / 3600,
    s:
      arcseconds(270, 26, 14.72) +
      1336 * 360 * c +
      (1108411.2 * c + 9.09 * c2 + 0.0068 * c3) / 3600,
    p: arcseconds(334, 19, 40.87) + 11 * 360 * c + (392515.94 * c - 37.24 * c2 - 0.045 * c3) / 3600,
    N: arcseconds(259, 10, 57.12) - 5 * 360 * c + (-482912.63 * c + 7.58 * c2 + 0.008 * c3) / 3600
  };
}

/** Wraps an angle in degrees to [-180, 180). */
function wrapSigned(degrees: number): number {
  return degrees - 360 * Math.floor((degrees + 180) / 360);
}

/** Wraps an angle in degrees to [0, 360). */
function wrapPositive(degrees: number): number {
  return degrees - 360 * Math.floor(degrees / 360);
}

/** The u terms and node factors at a Julian date in mean solar time. */
function getNodalTerms(julianDate: number): NodalTerms {
  const {N, p} = getMeanLongitudes(julianDate);
  const halfN = (N / 2) * DEGREES;
  // Schureman (1958), p. 156: cos I, and tan ½(N − ξ ± ν) in terms of tan ½N.
  const cosI = 0.9137 - 0.03569 * Math.cos(N * DEGREES);
  const I = Math.acos(cosI);
  const sumHalf = Math.atan2(1.01883 * Math.sin(halfN), Math.cos(halfN)); // ½(N − ξ + ν)
  const differenceHalf = Math.atan2(0.64412 * Math.sin(halfN), Math.cos(halfN)); // ½(N − ξ − ν)
  const nu = sumHalf - differenceHalf;
  const xi = wrapSigned(N - (sumHalf + differenceHalf) / DEGREES) * DEGREES;

  const sinI = Math.sin(I);
  const sin2I = Math.sin(2 * I);
  const cosHalfI = Math.cos(I / 2);
  const sinHalfI = Math.sin(I / 2);
  const tanHalfI = sinHalfI / cosHalfI;
  // ν′, formula (224), and 2ν″, formula (232).
  const nuPrime = Math.atan2(sin2I * Math.sin(nu), sin2I * Math.cos(nu) + 0.3347);
  const twoNuDoublePrime = Math.atan2(
    sinI * sinI * Math.sin(2 * nu),
    sinI * sinI * Math.cos(2 * nu) + 0.0727
  );
  // P: mean longitude of the lunar perigee reckoned from the lunar intersection, formula (191).
  const P = p * DEGREES - xi;
  const cos2P = Math.cos(2 * P);
  // R for L2, formula (214), and Q for M1, formula (203).
  const R = Math.atan2(Math.sin(2 * P), cosHalfI ** 2 / (6 * sinHalfI ** 2) - cos2P);
  const Q = Math.atan2(0.483 * Math.sin(P), Math.cos(P));

  const fO1 = (sinI * cosHalfI ** 2) / 0.38; // (75)
  const fM2 = cosHalfI ** 4 / 0.9154; // (78)
  return {
    u: [xi, nu, nuPrime, twoNuDoublePrime, R, Q].map(value => value / DEGREES) as NodalTerms['u'],
    f: {
      Mm: (2 / 3 - sinI * sinI) / 0.5021, // (73)
      Mf: (sinI * sinI) / 0.1578, // (74)
      O1: fO1,
      J1: sin2I / 0.7214, // (76)
      OO1: (sinI * sinHalfI ** 2) / 0.0164, // (77)
      M2: fM2,
      M3: cosHalfI ** 6 / 0.8758, // (149)
      // (227)
      K1: Math.sqrt(0.8965 * sin2I * sin2I + 0.6001 * sin2I * Math.cos(nu) + 0.1006),
      // (235)
      K2: Math.sqrt(19.0444 * sinI ** 4 + 2.7702 * sinI * sinI * Math.cos(2 * nu) + 0.0981),
      // (207) with 1/Qa from (197)
      M1: fO1 * Math.sqrt(2.31 + 1.435 * cos2P),
      // (215) with 1/Ra from (213)
      L2: fM2 * Math.sqrt(1 - 12 * tanHalfI ** 2 * cos2P + 36 * tanHalfI ** 4)
    }
  };
}

/** Julian date of 0 h on 1 January of a Gregorian year. */
function getYearStart(year: number): number {
  // Julian day number of 1 January (Fliegel and Van Flandern 1968, with month = 1, day = 1),
  // minus half a day because Julian days start at noon.
  const y = year + 4799;
  const dayNumber = 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 31738;
  return dayNumber - 0.5;
}

function getDefinition(name: TidalConstituentName): ConstituentDefinition {
  const definition = Object.prototype.hasOwnProperty.call(TIDAL_CONSTITUENTS, name)
    ? TIDAL_CONSTITUENTS[name]
    : undefined;
  if (!definition) {
    throw new RangeError(`Unsupported tidal constituent ${String(name)}`);
  }
  return definition;
}

function checkYear(year: number): number {
  if (!Number.isInteger(year)) {
    throw new RangeError(`year must be an integer, got ${year}`);
  }
  return checkRange('year', year, MIN_YEAR, MAX_YEAR);
}

function getNodeFactor(definition: ConstituentDefinition, nodal: NodalTerms): number {
  let f = 1;
  for (const [factor, power] of definition.f) {
    f *= nodal.f[factor] ** power;
  }
  return f;
}

function getArgument(
  definition: ConstituentDefinition,
  longitudes: Longitudes,
  nodal: NodalTerms
): number {
  const {v, u} = definition;
  // At 0 h mean solar time the hour angle of the mean sun, T, is 180°.
  const V =
    v[0] * 180 +
    v[1] * longitudes.s +
    v[2] * longitudes.h +
    v[3] * longitudes.p +
    v[4] * longitudes.p1 +
    v[5];
  let U = 0;
  for (let i = 0; i < u.length; i++) {
    U += u[i] * nodal.u[i];
  }
  return wrapPositive(V + U);
}

/**
 * Node factor f of a constituent for a calendar year, at the middle of the year.
 *
 * NOAA uses one value of f for each year and constituent, the value for the middle of the year
 * (Parker 2007, p. 41). The formulas are those of Schureman (1958): (73) to (78) and (149) for the
 * lunar constituents, (207) for M1, (215) for L2, (227) for K1 and (235) for K2. Solar
 * constituents have f = 1. Shallow-water constituents multiply the factors of their components
 * (table 2a).
 * @param name - Constituent name.
 * @param year - Gregorian calendar year, from 1800 to 2200.
 * @returns The node factor, dimensionless.
 */
export function getTidalNodeFactor(name: TidalConstituentName, year: number): number {
  const definition = getDefinition(name);
  checkYear(year);
  const middle = (getYearStart(year) + getYearStart(year + 1)) / 2;
  return getNodeFactor(definition, getNodalTerms(middle));
}

/**
 * Equilibrium argument V0 + u of a constituent for a calendar year, degrees.
 *
 * V0 is the uniformly changing part of the argument at 0 h Greenwich mean time on 1 January.
 * u is the nodal part at the middle of the year (Parker 2007, p. 41). The arguments are those of
 * Schureman (1958), tables 2 and 2a.
 *
 * M1 uses the form of formula (201): V = T − s + h − 90° and u = ξ − ν + Q, with Q from formula
 * (203). The element p is then part of u, not of V. Schureman's tables 13 and 15 use this form,
 * and NOAA CO-OPS predictions agree with it. With the form of formula (194), which keeps p in V,
 * a u frozen for a whole year gives a different phase.
 * @param name - Constituent name.
 * @param year - Gregorian calendar year, from 1800 to 2200.
 * @returns V0 + u, degrees from 0 to 360.
 */
export function getTidalEquilibriumArgument(name: TidalConstituentName, year: number): number {
  const definition = getDefinition(name);
  checkYear(year);
  const start = getYearStart(year);
  const middle = (start + getYearStart(year + 1)) / 2;
  return getArgument(definition, getMeanLongitudes(start), getNodalTerms(middle));
}

/**
 * Tide height at one instant from harmonic constants:
 *
 * h(t) = Z0 + Σ f·H·cos(a·t + (V0 + u) − κ)
 *
 * t is the time in hours from 0 h on 1 January of the calendar year of the instant. f and V0 + u
 * are those of that year ({@link getTidalNodeFactor}, {@link getTidalEquilibriumArgument}). This is
 * the convention of NOAA CO-OPS predictions. The phases κ must be Greenwich phases.
 *
 * The instant is in UT1. One second of time moves the M2 phase by about 0.008°, so a caller
 * without a UT1 model can use UTC with an offset of zero.
 * @param constituents - Harmonic constants of the station.
 * @param date - Instant, in the UT1 time scale. The calendar year must be from 1800 to 2200.
 * @param options - Datum offset.
 * @returns Height in the unit of the amplitudes, above the datum of `datumOffset`.
 */
export function getTideHeight(
  constituents: readonly TidalConstituent[],
  date: JulianDate,
  options: TideHeightOptions = {}
): number {
  if (date.timeScale !== 'UT1') {
    throw new RangeError(`date must be in the UT1 time scale, got ${date.timeScale}`);
  }
  const datumOffset = checkFinite('datumOffset', options.datumOffset ?? 0);
  const julianDate = date.dayNumber + date.secondsOfDay / 86400;
  // Calendar year of the instant: estimate, then correct across the year boundary.
  let year = Math.floor((julianDate - 1721059) / 365.2425);
  if (getYearStart(year + 1) <= julianDate) year++;
  if (getYearStart(year) > julianDate) year--;
  checkYear(year);

  const start = getYearStart(year);
  const longitudes = getMeanLongitudes(start);
  const nodal = getNodalTerms((start + getYearStart(year + 1)) / 2);
  // Hours from the start of the year. The integer day difference keeps full precision.
  // `start + 0.5` is the integral Julian day that begins at noon on 1 January.
  const hours = (date.dayNumber - (start + 0.5)) * 24 + 12 + date.secondsOfDay / 3600;

  let height = datumOffset;
  for (const constituent of constituents) {
    const definition = getDefinition(constituent.name);
    const amplitude = checkRange('amplitude', constituent.amplitude, 0, Infinity);
    const phase = checkFinite('phase', constituent.phase);
    const speed = checkRange('speed', constituent.speed, 0, Infinity);
    const argument = speed * hours + getArgument(definition, longitudes, nodal) - phase;
    height +=
      getNodeFactor(definition, nodal) * amplitude * Math.cos(wrapPositive(argument) * DEGREES);
  }
  return height;
}
