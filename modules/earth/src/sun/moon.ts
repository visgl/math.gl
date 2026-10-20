// math.gl
// SPDX-License-Identifier: BSD-2-Clause
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileCopyrightText: 2011-2015 Vladimir Agafonkin
// SPDX-FileCopyrightText: 2014 Vladimir Agafonkin
// SPDX-FileComment: Adapted from SunCalc 1.9.0 with topocentric parallax and USNO sidereal time; full copyright, conditions and disclaimer in ../LICENSE-SUNCALC.
// Reference: https://github.com/mourner/suncalc/tree/v1.9.0
import {getAzimuth, getDeclination, getRightAscension, getSunCoords, toDays} from './suncalc';
import {getLocalSiderealTime} from './starfield';
import {validateObserver} from './celestial';

export type MoonPosition = {
  /** Geometric topocentric altitude in radians, without atmospheric refraction. */
  altitude: number;
  /** Azimuth in radians, measured from south towards west (same as getSunPosition). */
  azimuth: number;
  /** Observer-to-Moon distance in kilometers, with spherical-Earth parallax correction. */
  distance: number;
  /** Approximate parallactic angle in radians. */
  parallacticAngle: number;
};

export type MoonIllumination = {
  /** Illuminated fraction of the lunar disk, in [0, 1]. Not relative light intensity. */
  fraction: number;
  /** Cycle position: 0 = new, 0.25 = first quarter, 0.5 = full, 0.75 = last quarter. */
  phase: number;
  /** Bright-limb position angle in radians. */
  angle: number;
  /** Sun-Moon-Earth phase angle in radians: 0 = full, PI = new. */
  phaseAngle: number;
};

/** Low-order lunar ephemeris with spherical-Earth observer parallax. */
export function getMoonPosition(
  timestamp: number | Date,
  latitude: number,
  longitude: number
): MoonPosition {
  validateObserver(timestamp, latitude, longitude);
  const phi = (latitude * Math.PI) / 180;
  const moon = getMoonCoords(toDays(timestamp));
  const hourAngle = getLocalSiderealTime(timestamp, longitude) - moon.rightAscension;
  const altitudeSine =
    Math.sin(phi) * Math.sin(moon.declination) +
    Math.cos(phi) * Math.cos(moon.declination) * Math.cos(hourAngle);
  const geocentricAltitude = Math.asin(Math.max(-1, Math.min(1, altitudeSine)));
  const horizontal = moon.distance * Math.cos(geocentricAltitude);
  const vertical = moon.distance * Math.sin(geocentricAltitude) - 6378.14;
  return {
    azimuth: getAzimuth(hourAngle, phi, moon.declination),
    altitude: Math.atan2(vertical, horizontal),
    distance: Math.hypot(horizontal, vertical),
    parallacticAngle: Math.atan2(
      Math.sin(hourAngle),
      Math.tan(phi) * Math.cos(moon.declination) - Math.sin(moon.declination) * Math.cos(hourAngle)
    )
  };
}

/** Incoming light direction in east/north/up coordinates, matching getSunDirection. */
export function getMoonDirection(
  timestamp: number | Date,
  latitude: number,
  longitude: number
): number[] {
  const {azimuth, altitude} = getMoonPosition(timestamp, latitude, longitude);
  return [
    Math.sin(azimuth) * Math.cos(altitude),
    Math.cos(azimuth) * Math.cos(altitude),
    -Math.sin(altitude)
  ];
}

export function getMoonIllumination(timestamp: number | Date): MoonIllumination {
  validateObserver(timestamp, 0, 0);
  const days = toDays(timestamp);
  const sun = getSunCoords(days);
  const moon = getMoonCoords(days);
  const separationCosine =
    Math.sin(sun.declination) * Math.sin(moon.declination) +
    Math.cos(sun.declination) *
      Math.cos(moon.declination) *
      Math.cos(sun.rightAscension - moon.rightAscension);
  const separation = Math.acos(Math.max(-1, Math.min(1, separationCosine)));
  const sunDistance = 149598000;
  const phaseAngle = Math.atan2(
    sunDistance * Math.sin(separation),
    moon.distance - sunDistance * Math.cos(separation)
  );
  const angle = Math.atan2(
    Math.cos(sun.declination) * Math.sin(sun.rightAscension - moon.rightAscension),
    Math.sin(sun.declination) * Math.cos(moon.declination) -
      Math.cos(sun.declination) *
        Math.sin(moon.declination) *
        Math.cos(sun.rightAscension - moon.rightAscension)
  );
  return {
    fraction: (1 + Math.cos(phaseAngle)) / 2,
    phase: 0.5 + (0.5 * phaseAngle * (angle < 0 ? -1 : 1)) / Math.PI,
    angle,
    phaseAngle
  };
}

function getMoonCoords(days: number): {
  rightAscension: number;
  declination: number;
  distance: number;
} {
  const radians = Math.PI / 180;
  const meanLongitude = radians * (218.316 + 13.176396 * days);
  const anomaly = radians * (134.963 + 13.064993 * days);
  const argumentOfLatitude = radians * (93.272 + 13.22935 * days);
  const longitude = meanLongitude + radians * 6.289 * Math.sin(anomaly);
  const latitude = radians * 5.128 * Math.sin(argumentOfLatitude);
  return {
    rightAscension: getRightAscension(longitude, latitude),
    declination: getDeclination(longitude, latitude),
    distance: 385001 - 20905 * Math.cos(anomaly)
  };
}
