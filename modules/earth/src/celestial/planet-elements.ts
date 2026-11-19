// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original evaluation of the Keplerian elements of Standish and Williams (JPL, "Approximate Positions of the Planets"). The elements are published data.

import type {JulianDate} from './julian-date';
import {getDaysSinceJ2000TT} from './solar-system-body';

/** A planet that the JPL approximate elements describe. The Earth is the Earth-Moon barycenter. */
export type ApproximatePlanet =
  | 'mercury'
  | 'venus'
  | 'earth-moon-barycenter'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune';

/** Options of {@link getApproximatePlanetPosition}. */
export type ApproximatePlanetPositionOptions = {
  /**
   * The axes of the result. `'equatorial'` (the default) is the ICRF / J2000 equator; `'ecliptic'`
   * is the mean ecliptic and equinox of J2000.
   */
  frame?: 'equatorial' | 'ecliptic';
};

/** a, e, I, L, ϖ, Ω and their rates per Julian century: au, 1, degrees. */
type Elements = readonly [
  a: number,
  e: number,
  i: number,
  l: number,
  perihelion: number,
  node: number,
  aRate: number,
  eRate: number,
  iRate: number,
  lRate: number,
  perihelionRate: number,
  nodeRate: number
];

// Table 1: 1800 AD to 2050 AD.
// biome-ignore format: keep one planet per row, elements then rates
const TABLE_1: Readonly<Record<ApproximatePlanet, Elements>> = {
  mercury: [0.38709927, 0.20563593, 7.00497902, 252.2503235, 77.45779628, 48.33076593, 0.00000037, 0.00001906, -0.00594749, 149472.67411175, 0.16047689, -0.12534081],
  venus: [0.72333566, 0.00677672, 3.39467605, 181.9790995, 131.60246718, 76.67984255, 0.0000039, -0.00004107, -0.0007889, 58517.81538729, 0.00268329, -0.27769418],
  'earth-moon-barycenter': [1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0, 0.00000562, -0.00004392, -0.01294668, 35999.37244981, 0.32327364, 0],
  mars: [1.52371034, 0.0933941, 1.84969142, -4.55343205, -23.94362959, 49.55953891, 0.00001847, 0.00007882, -0.00813131, 19140.30268499, 0.44441088, -0.29257343],
  jupiter: [5.202887, 0.04838624, 1.30439695, 34.39644051, 14.72847983, 100.47390909, -0.00011607, -0.00013253, -0.00183714, 3034.74612775, 0.21252668, 0.20469106],
  saturn: [9.53667594, 0.05386179, 2.48599187, 49.95424423, 92.59887831, 113.66242448, -0.0012506, -0.00050991, 0.00193609, 1222.49362201, -0.41897216, -0.28867794],
  uranus: [19.18916464, 0.04725744, 0.77263783, 313.23810451, 170.9542763, 74.01692503, -0.00196176, -0.00004397, -0.00242939, 428.48202785, 0.40805281, 0.04240589],
  neptune: [30.06992276, 0.00859048, 1.77004347, -55.12002969, 44.96476227, 131.78422574, 0.00026291, 0.00005105, 0.00035372, 218.45945325, -0.32241464, -0.00508664]
};

// Table 2a: 3000 BC to 3000 AD.
// biome-ignore format: keep one planet per row, elements then rates
const TABLE_2A: Readonly<Record<ApproximatePlanet, Elements>> = {
  mercury: [0.38709843, 0.20563661, 7.00559432, 252.25166724, 77.45771895, 48.33961819, 0, 0.00002123, -0.00590158, 149472.67486623, 0.15940013, -0.12214182],
  venus: [0.72332102, 0.00676399, 3.39777545, 181.9797085, 131.76755713, 76.67261496, -0.00000026, -0.00005107, 0.00043494, 58517.8156026, 0.05679648, -0.27274174],
  'earth-moon-barycenter': [1.00000018, 0.01673163, -0.00054346, 100.46691572, 102.93005885, -5.11260389, -0.00000003, -0.00003661, -0.01337178, 35999.37306329, 0.3179526, -0.24123856],
  mars: [1.52371243, 0.09336511, 1.85181869, -4.56813164, -23.91744784, 49.71320984, 0.00000097, 0.00009149, -0.00724757, 19140.29934243, 0.45223625, -0.26852431],
  jupiter: [5.20248019, 0.0485359, 1.29861416, 34.33479152, 14.27495244, 100.29282654, -0.00002864, 0.00018026, -0.00322699, 3034.90371757, 0.18199196, 0.13024619],
  saturn: [9.54149883, 0.05550825, 2.49424102, 50.07571329, 92.86136063, 113.63998702, -0.00003065, -0.00032044, 0.00451969, 1222.11494724, 0.54179478, -0.25015002],
  uranus: [19.18797948, 0.0468574, 0.77298127, 314.20276625, 172.43404441, 73.96250215, -0.00020455, -0.0000155, -0.00180155, 428.49512595, 0.09266985, 0.05739699],
  neptune: [30.06952752, 0.00895439, 1.7700552, 304.22289287, 46.68158724, 131.78635853, 0.00006447, 0.00000818, 0.000224, 218.46515314, 0.01009938, -0.00606302]
};

// Table 2b: b, c, s, f for the mean anomaly of Jupiter to Neptune, 3000 BC to 3000 AD.
const TABLE_2B: Readonly<
  Partial<Record<ApproximatePlanet, readonly [number, number, number, number]>>
> = {
  jupiter: [-0.00012452, 0.0606406, -0.35635438, 38.35125],
  saturn: [0.00025899, -0.13434469, 0.87320147, 38.35125],
  uranus: [0.00058331, -0.97731848, 0.17689245, 7.67025],
  neptune: [-0.00041348, 0.68346318, -0.10162547, 7.67025]
};

/** 1800-01-01T12:00 TT and 2050-01-01T12:00 TT, days from J2000.0: the range of Table 1. */
const TABLE_1_DAYS: readonly [number, number] = [-73048, 18263];
/** 3000-01-01T12:00 BC (year −2999, Julian calendar) and 3000-01-01T12:00 AD TT, days from J2000.0: the range of Table 2. */
const TABLE_2_DAYS: readonly [number, number] = [-1825871, 365243];
/** The obliquity of the J2000 ecliptic that the elements use, 23.43928 degrees. */
const OBLIQUITY = 23.43928 * (Math.PI / 180);
const RADIANS = Math.PI / 180;

/**
 * Returns the approximate heliocentric position of a planet from the Keplerian elements of
 * E. M. Standish and J. G. Williams (JPL Solar System Dynamics, "Approximate Positions of the
 * Planets", https://ssd.jpl.nasa.gov/planets/approx_pos.html).
 *
 * Inside 1800 AD to 2050 AD the function uses Table 1. Outside it, it uses Tables 2a and 2b (3000 BC
 * to 3000 AD). The position is geometric: it has no light time and no aberration. JPL states these
 * nominal errors in heliocentric longitude (arcseconds), latitude (arcseconds) and distance
 * (1000 km), Table 1 / Table 2: Mercury 15, 1, 1 / 20, 15, 1; Venus 20, 1, 4 / 40, 30, 8;
 * Earth-Moon barycenter 20, 8, 6 / 40, 15, 15; Mars 40, 2, 25 / 100, 40, 30; Jupiter 400, 10, 600 /
 * 600, 100, 1000; Saturn 600, 25, 1500 / 1000, 100, 4000; Uranus 50, 2, 1000 / 2000, 30, 8000;
 * Neptune 10, 1, 200 / 400, 15, 4000.
 *
 * The elements use T_eph (TDB). TT is used in place of TDB: the two differ by less than 2 ms.
 * @param planet - The planet. The Earth is `'earth-moon-barycenter'`.
 * @param tt - The date, a `JulianDate` in the TT scale, from 3000 BC to 3000 AD.
 * @param options - The axes of the result.
 * @returns The position of the planet relative to the Sun, au.
 * @throws {RangeError} When `planet` or `options.frame` is not supported, `tt` is not TT, or `tt`
 * is outside the range.
 */
export function getApproximatePlanetPosition(
  planet: ApproximatePlanet,
  tt: JulianDate,
  options: ApproximatePlanetPositionOptions = {}
): [number, number, number] {
  if (!Object.prototype.hasOwnProperty.call(TABLE_1, planet)) {
    throw new RangeError(`Unsupported planet ${String(planet)}`);
  }
  const {frame = 'equatorial'} = options;
  if (frame !== 'equatorial' && frame !== 'ecliptic') {
    throw new RangeError(`Unsupported frame ${String(frame)}`);
  }
  const days = getDaysSinceJ2000TT(tt, TABLE_2_DAYS[0], TABLE_2_DAYS[1]);
  const table1 = days >= TABLE_1_DAYS[0] && days <= TABLE_1_DAYS[1];
  const elements = (table1 ? TABLE_1 : TABLE_2A)[planet];
  const t = days / 36525;
  const [a, e, inclination, meanLongitude, perihelion, node] = elements
    .slice(0, 6)
    .map((value, i) => value + elements[i + 6] * t);
  let meanAnomaly = meanLongitude - perihelion;
  const extra = TABLE_2B[planet];
  if (!table1 && extra) {
    const [b, c, s, f] = extra;
    meanAnomaly += b * t * t + c * Math.cos(f * t * RADIANS) + s * Math.sin(f * t * RADIANS);
  }
  const eccentricAnomaly = solveKepler(meanAnomaly * RADIANS, e);

  const x = a * (Math.cos(eccentricAnomaly) - e);
  const y = a * Math.sqrt(1 - e * e) * Math.sin(eccentricAnomaly);
  const omega = (perihelion - node) * RADIANS;
  const [co, so] = [Math.cos(omega), Math.sin(omega)];
  const [cn, sn] = [Math.cos(node * RADIANS), Math.sin(node * RADIANS)];
  const [ci, si] = [Math.cos(inclination * RADIANS), Math.sin(inclination * RADIANS)];
  const xEcliptic = (co * cn - so * sn * ci) * x + (-so * cn - co * sn * ci) * y;
  const yEcliptic = (co * sn + so * cn * ci) * x + (-so * sn + co * cn * ci) * y;
  const zEcliptic = so * si * x + co * si * y;
  if (frame === 'ecliptic') {
    return [xEcliptic, yEcliptic, zEcliptic];
  }
  const [ce, se] = [Math.cos(OBLIQUITY), Math.sin(OBLIQUITY)];
  return [xEcliptic, ce * yEcliptic - se * zEcliptic, se * yEcliptic + ce * zEcliptic];
}

/**
 * Solves Kepler's equation M = E − e sin E by Newton's method.
 * @param meanAnomaly - M, radians.
 * @param eccentricity - e, from 0 to 0.3 for these planets.
 * @returns E, radians.
 */
function solveKepler(meanAnomaly: number, eccentricity: number): number {
  // Reduce M to [-π, π], as the JPL procedure does.
  const m = meanAnomaly - 2 * Math.PI * Math.round(meanAnomaly / (2 * Math.PI));
  let eccentricAnomaly = m + eccentricity * Math.sin(m);
  for (let i = 0; i < 20; i++) {
    const step =
      (m - (eccentricAnomaly - eccentricity * Math.sin(eccentricAnomaly))) /
      (1 - eccentricity * Math.cos(eccentricAnomaly));
    eccentricAnomaly += step;
    if (Math.abs(step) <= 1e-15) break;
  }
  return eccentricAnomaly;
}
