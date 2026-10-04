// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original rendering adapter for MIT-licensed Astronomy Engine 2.1.19.
// API/model provenance: https://github.com/cosinekitty/astronomy/tree/v2.1.19/source/js
// Physical mean radii: https://ssd.jpl.nasa.gov/planets/phys_par.html
// Galilean mean radii: https://ssd.jpl.nasa.gov/sats/phys_par/
// Galilean geometric albedos: https://nssdc.gsfc.nasa.gov/planetary/factsheet/joviansatfact.html
import {
  AstroTime,
  Body,
  CorrectLightTravel,
  HelioVector,
  Illumination,
  JupiterMoons,
  KM_PER_AU,
  Observer,
  ObserverVector,
  RotateVector,
  Rotation_EQJ_HOR,
  Vector
} from 'astronomy-engine';
import type {RotationMatrix} from 'astronomy-engine';
import {getPlanetVisibility} from './planet-visibility';
import type {PlanetVisibility, PlanetVisibilityOptions} from './planet-visibility';
import {createSkyTime} from './sky-time';
import type {SkyTimeScales} from './sky-time';

type Triple = [number, number, number];
export type PlanetName = 'Mercury' | 'Venus' | 'Mars' | 'Jupiter' | 'Saturn' | 'Uranus' | 'Neptune';
export type GalileanMoonName = 'Io' | 'Europa' | 'Ganymede' | 'Callisto';
export type PlanetSkyOptions = {
  timeScales?: SkyTimeScales;
  /** Local terrain horizon altitude in radians at south-to-west azimuth. */
  horizon?: (azimuth: number) => number;
  /** Observer elevation above sea level in meters. Default 0. */
  elevation?: number;
  /** Include Io, Europa, Ganymede and Callisto. Default true. */
  galileanMoons?: boolean;
  /** Conditions for the current twilight visibility estimate. */
  visibility?: PlanetVisibilityOptions;
};
export type PlanetSkyBody = {
  name: PlanetName | GalileanMoonName;
  parent: 'Jupiter' | null;
  /** Outward observer-to-body unit vector in east/north/up coordinates. */
  direction: Triple;
  /** Outward observer-to-body unit vector in J2000 equatorial coordinates. */
  equatorialDirection: Triple;
  /** Geometric altitude in radians; no atmospheric refraction. */
  altitude: number;
  /** Radians measured from south towards west, matching getSunPosition. */
  azimuth: number;
  /** Observer-to-body center distance, kilometers. */
  distance: number;
  /** Full angular disk diameter in radians, using a spherical mean radius. */
  angularDiameter: number;
  /** Sun/body/observer angle in radians; 0 is full phase. */
  phaseAngle: number;
  illuminatedFraction: number;
  /** Body-to-Sun unit vector in local ENU, for shading a sphere. */
  sunDirection: Triple;
  /** Visual magnitude before extinction/occultation; Lambert approximation for satellites. */
  magnitude: number | null;
  /** Approximate current naked-eye detectability; null for Galilean moons. */
  visibility: PlanetVisibility | null;
  /** Apparent offset from Jupiter's center in ENU kilometers; null for planets. */
  jupiterOffset: Triple | null;
  /** Approximate spherical-disk occultation by Jupiter; independent of horizon. */
  occultation: 'none' | 'partial' | 'total';
  /** Galilean moon overlaps Jupiter's disk in front of it. */
  transiting: boolean;
  /** Entire solar disk is obscured at the satellite center. */
  inJupiterShadow: boolean;
  /** Unblocked solar disk fraction at satellite center, including penumbra. */
  sunlitFraction: number;
  /** Approximate unocculted satellite disk fraction. */
  visibleDiskFraction: number;
  /** Satellite magnitude including eclipse/occultation; null when completely dark. */
  apparentMagnitude: number | null;
};

const PLANETS: [PlanetName, Body, number][] = [
  ['Mercury', Body.Mercury, 2439.4],
  ['Venus', Body.Venus, 6051.8],
  ['Mars', Body.Mars, 3389.5],
  ['Jupiter', Body.Jupiter, 69911],
  ['Saturn', Body.Saturn, 58232],
  ['Uranus', Body.Uranus, 25362],
  ['Neptune', Body.Neptune, 24622]
];
const MOONS: [GalileanMoonName, 'io' | 'europa' | 'ganymede' | 'callisto', number][] = [
  ['Io', 'io', 1821.49],
  ['Europa', 'europa', 1560.8],
  ['Ganymede', 'ganymede', 2631.2],
  ['Callisto', 'callisto', 2410.3]
];
const JUPITER_RADIUS = 69911;
// IAU nominal solar radius, km (2015 Resolution B3).
// https://www.iau.org/static/resolutions/IAU2015_English.pdf
const SUN_RADIUS = 695700;

/**
 * Positions and disk geometry for rendering seven planets and four Galilean moons.
 * Import from @math.gl/sun/planets; requires the optional astronomy-engine peer.
 * The ephemeris accounts for light travel, precession and nutation; not aberration.
 */
export function getPlanetSkyInfo(
  timestamp: number | Date,
  latitude: number,
  longitude: number,
  options: PlanetSkyOptions = {}
): PlanetSkyBody[] {
  const date = new Date(timestamp);
  const {elevation = 0, galileanMoons = true} = options;
  if (!Number.isFinite(date.getTime()))
    throw new RangeError('Timestamp must be a valid Date or Unix milliseconds');
  if (!Number.isFinite(latitude) || Math.abs(latitude) > 90)
    throw new RangeError('Latitude must be between -90 and 90');
  if (!Number.isFinite(longitude)) throw new RangeError('Longitude must be finite');
  if (!Number.isFinite(elevation) || elevation < -1000 || elevation > 100000)
    throw new RangeError('Elevation must be between -1000 and 100000 meters');
  if (typeof galileanMoons !== 'boolean') throw new RangeError('galileanMoons must be a boolean');
  const year = date.getUTCFullYear();
  // Deliberately restrict this rendering adapter to a documented modern range.
  if (year < 1900 || year > 2100) throw new RangeError('Planet sky dates must be within 1900–2100');
  const time = createSkyTime(date, options.timeScales);
  const observer = new Observer(latitude, longitude % 360, elevation);
  const rotation = Rotation_EQJ_HOR(time, observer);
  const earth = HelioVector(Body.Earth, time);
  const surface = ObserverVector(time, observer, false);
  const origin = [earth.x + surface.x, earth.y + surface.y, earth.z + surface.z];
  const sunView = normalized(enu(new Vector(-origin[0], -origin[1], -origin[2], time), rotation));
  const sunAltitude = Math.atan2(sunView[2], Math.hypot(sunView[0], sunView[1]));
  const states = PLANETS.map(([name, body, radius]) => {
    const relative = CorrectLightTravel(t => {
      const target = HelioVector(body, t);
      return new Vector(target.x - origin[0], target.y - origin[1], target.z - origin[2], t);
    }, time);
    const heliocentric = HelioVector(body, relative.t);
    const info = renderInfo(name, null, radius, relative, heliocentric, rotation, time);
    info.magnitude = Illumination(body, time).mag;
    info.apparentMagnitude = info.magnitude;
    const horizonAltitude = options.horizon?.(info.azimuth);
    info.visibility = getPlanetVisibility(
      info.magnitude,
      info.altitude,
      sunAltitude,
      angularSeparation(info.direction, sunView),
      horizonAltitude === undefined
        ? options.visibility
        : {
            ...options.visibility,
            minimumAltitude: Math.max(
              options.visibility?.minimumAltitude ?? (5 * Math.PI) / 180,
              horizonAltitude
            )
          }
    );
    return {relative, info};
  });
  const result = states.map(state => state.info);
  if (!galileanMoons) return result;
  const jupiter = states[3];
  for (const [name, key, radius] of MOONS) {
    // Evaluate the satellite at emission time: Jupiter's light delay is tens of
    // minutes, enough for Io to move noticeably. Solve each satellite separately.
    const relative = CorrectLightTravel(t => {
      const planet = HelioVector(Body.Jupiter, t);
      const moon = JupiterMoons(t)[key];
      return new Vector(
        planet.x + moon.x - origin[0],
        planet.y + moon.y - origin[1],
        planet.z + moon.z - origin[2],
        t
      );
    }, time);
    const planet = HelioVector(Body.Jupiter, relative.t);
    const offset = JupiterMoons(relative.t)[key];
    const heliocentric = new Vector(
      planet.x + offset.x,
      planet.y + offset.y,
      planet.z + offset.z,
      relative.t
    );
    const info = renderInfo(name, 'Jupiter', radius, relative, heliocentric, rotation, time);
    const difference = new Vector(
      relative.x - jupiter.relative.x,
      relative.y - jupiter.relative.y,
      relative.z - jupiter.relative.z,
      time
    );
    info.jupiterOffset = enu(difference, rotation).map(value => value * KM_PER_AU) as Triple;
    const separation = angularSeparation(
      info.equatorialDirection,
      jupiter.info.equatorialDirection
    );
    const moonRadius = info.angularDiameter / 2;
    const planetRadius = jupiter.info.angularDiameter / 2;
    const overlaps = separation < planetRadius + moonRadius;
    if (info.distance > jupiter.info.distance && overlaps) {
      info.occultation = separation + moonRadius < planetRadius ? 'total' : 'partial';
    }
    info.transiting = info.distance < jupiter.info.distance && overlaps;
    // Finite solar disk: spherical Jupiter obscures part or all of the Sun.
    // Original circle-overlap geometry; geometric center illumination, not a
    // resolved penumbra across the satellite surface.
    const moonToSun = normalized([-heliocentric.x, -heliocentric.y, -heliocentric.z]);
    const moonToPlanet = normalized([-offset.x, -offset.y, -offset.z]);
    const sunRadius = Math.asin(SUN_RADIUS / (heliocentric.Length() * KM_PER_AU));
    const jupiterRadius = Math.asin(
      JUPITER_RADIUS / (Math.hypot(offset.x, offset.y, offset.z) * KM_PER_AU)
    );
    info.sunlitFraction =
      1 - diskOverlapFraction(sunRadius, jupiterRadius, angularSeparation(moonToSun, moonToPlanet));
    info.inJupiterShadow = info.sunlitFraction === 0;
    info.visibleDiskFraction =
      info.distance > jupiter.info.distance
        ? 1 - diskOverlapFraction(moonRadius, planetRadius, separation)
        : 1;
    const albedo = {Io: 0.62, Europa: 0.68, Ganymede: 0.44, Callisto: 0.19}[name];
    const phase =
      (Math.sin(info.phaseAngle) + (Math.PI - info.phaseAngle) * Math.cos(info.phaseAngle)) /
      Math.PI;
    const flux =
      (albedo * (radius / KM_PER_AU) ** 2 * phase) /
      (heliocentric.Length() ** 2 * relative.Length() ** 2);
    info.magnitude = -26.74 - 2.5 * Math.log10(flux);
    const transmission = info.sunlitFraction * info.visibleDiskFraction;
    info.apparentMagnitude =
      transmission > 0 ? info.magnitude - 2.5 * Math.log10(transmission) : null;
    result.push(info);
  }
  return result;
}

function renderInfo(
  name: PlanetSkyBody['name'],
  parent: PlanetSkyBody['parent'],
  radius: number,
  relative: Vector,
  heliocentric: Vector,
  rotation: RotationMatrix,
  time: AstroTime
): PlanetSkyBody {
  const direction = normalized(enu(relative, rotation));
  const equatorialDirection = normalized([relative.x, relative.y, relative.z]);
  const towardSun = new Vector(-heliocentric.x, -heliocentric.y, -heliocentric.z, time);
  const sunDirection = normalized(enu(towardSun, rotation));
  const phaseAngle = Math.acos(Math.max(-1, Math.min(1, -dot(direction, sunDirection))));
  const distance = relative.Length() * KM_PER_AU;
  return {
    name,
    parent,
    direction,
    equatorialDirection,
    altitude: Math.atan2(direction[2], Math.hypot(direction[0], direction[1])),
    azimuth: Math.atan2(-direction[0], -direction[1]),
    distance,
    angularDiameter: 2 * Math.asin(radius / distance),
    phaseAngle,
    illuminatedFraction: (1 + Math.cos(phaseAngle)) / 2,
    sunDirection,
    magnitude: null,
    visibility: null,
    jupiterOffset: null,
    occultation: 'none',
    transiting: false,
    inJupiterShadow: false,
    sunlitFraction: 1,
    visibleDiskFraction: 1,
    apparentMagnitude: null
  };
}

/** Fraction of disk r covered by disk R separated by d (small-angle disk geometry). */
function diskOverlapFraction(r: number, R: number, d: number): number {
  if (d >= r + R) return 0;
  if (d <= Math.abs(R - r)) return R >= r ? 1 : (R / r) ** 2;
  const clamp = (x: number) => Math.max(-1, Math.min(1, x));
  const area =
    r * r * Math.acos(clamp((d * d + r * r - R * R) / (2 * d * r))) +
    R * R * Math.acos(clamp((d * d + R * R - r * r) / (2 * d * R))) -
    0.5 * Math.sqrt(Math.max(0, (-d + r + R) * (d + r - R) * (d - r + R) * (d + r + R)));
  return Math.max(0, Math.min(1, area / (Math.PI * r * r)));
}

function enu(vector: Vector, rotation: RotationMatrix): Triple {
  const v = RotateVector(rotation, vector);
  // Astronomy Engine's horizontal frame is north/west/up.
  return [-v.y, v.x, v.z];
}
function normalized(values: number[]): Triple {
  const length = Math.hypot(...values);
  return values.map(value => value / length) as Triple;
}
function dot(a: number[], b: number[]): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
function angularSeparation(a: Triple, b: Triple): number {
  return Math.atan2(
    Math.hypot(a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]),
    dot(a, b)
  );
}
