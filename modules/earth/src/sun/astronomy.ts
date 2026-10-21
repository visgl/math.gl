// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original adapter to the MIT Astronomy Engine JavaScript API.
// https://github.com/cosinekitty/astronomy/tree/v2.1.19/source/js
// Ring dimensions: https://nssdc.gsfc.nasa.gov/planetary/factsheet/satringfact.html
import {
  Body,
  Equator,
  Observer,
  Rotation_EQJ_HOR,
  RotateVector,
  RotationAxis,
  Libration,
  Vector,
  Illumination
} from 'astronomy-engine';
import {createSkyObserver, reverseSkyDirection, getSkyHorizonAltitude} from './sky-observer';
import type {SkyObserver, SkyHorizonProfile} from './sky-observer';
import {validateObserver} from './celestial';
import {getPlanetSkyInfo} from './planet-position';
import {getMoonAppearance} from './moon-appearance';
import type {SkyAtmosphereOptions} from './sky-brightness';
import {skyDirectionToGlobe, skyRotationToGlobe, getSkyGlobePosition} from './sky-globe';
import {createSkyTime} from './sky-time';
import type {SkyTimeScales} from './sky-time';
import {getSkyLighting} from './sky-lighting';
import {getScatteredMoonLuminance} from './moon-sky-brightness';
import {getPlanetVisibility} from './planet-visibility';
export type {SkyTimeScales} from './sky-time';

export type SkySnapshotOptions = {
  galileanMoons?: boolean;
  atmosphere?: SkyAtmosphereOptions;
  timeScales?: SkyTimeScales;
  horizonProfile?: SkyHorizonProfile;
  /** Distance of render shell from observer, meters. Default 10000000. */
  renderingDistance?: number;
};
/** Consistent geometric, topocentric snapshot; all local vectors use outward ENU. */
export function getSkySnapshot(
  timestamp: number | Date,
  observerOptions: SkyObserver,
  options: SkySnapshotOptions = {}
) {
  const observer = createSkyObserver(observerOptions);
  validateObserver(timestamp, observer.latitude, observer.longitude);
  const date = new Date(timestamp);
  const time = createSkyTime(timestamp, options.timeScales);
  const location = new Observer(observer.latitude, observer.longitude, observer.elevation);
  const rotation = Rotation_EQJ_HOR(time, location);
  const localVector = (v: Vector): [number, number, number] => {
    const local = RotateVector(rotation, v);
    return [-local.y, local.x, local.z];
  };
  const geometry = (direction: [number, number, number]) => ({
    globeDirection: skyDirectionToGlobe(direction, observer),
    globePosition: getSkyGlobePosition(direction, observer, options.renderingDistance ?? 10000000)
  });
  const bodyInfo = (body: Body.Sun | Body.Moon) => {
    const position = Equator(body, time, location, false, false);
    const local = RotateVector(rotation, position.vec);
    const length = position.vec.Length();
    const direction: [number, number, number] = [
      -local.y / length,
      local.x / length,
      local.z / length
    ];
    return {
      direction,
      incomingDirection: reverseSkyDirection(direction),
      altitude: Math.atan2(direction[2], Math.hypot(direction[0], direction[1])),
      azimuth: Math.atan2(-direction[0], -direction[1]),
      distance: position.dist * 149597870.7,
      angularDiameter:
        2 * Math.asin((body === Body.Sun ? 695700 : 1737.4) / (position.dist * 149597870.7)),
      ...geometry(direction)
    };
  };
  const sun = bodyInfo(Body.Sun);
  const moon = bodyInfo(Body.Moon);
  const lunarPhotometry = Illumination(Body.Moon, time);
  const lightVector = localVector(
    new Vector(-lunarPhotometry.hc.x, -lunarPhotometry.hc.y, -lunarPhotometry.hc.z, time)
  );
  const sunDirection = lightVector.map(value => value / Math.hypot(...lightVector)) as [
    number,
    number,
    number
  ];
  const phaseAngle = Math.acos(
    Math.max(
      -1,
      Math.min(1, -sunDirection.reduce((sum, value, i) => sum + value * moon.direction[i], 0))
    )
  );
  const sunSeparation = Math.acos(
    Math.max(
      -1,
      Math.min(
        1,
        sun.direction.reduce((sum, value, i) => sum + value * moon.direction[i], 0)
      )
    )
  );
  const appearance = getMoonAppearance(moon.altitude, sun.altitude, {
    ...options.atmosphere,
    distance: moon.distance,
    phaseAngle,
    sunSeparation,
    horizonAltitude: getSkyHorizonAltitude(moon.azimuth, options.horizonProfile)
  });
  const orientation = (body: Body, distance: number) => {
    const axis = RotationAxis(body, time.AddDays(-distance / 299792.458 / 86400));
    const ra = (axis.ra * Math.PI) / 12;
    const dec = (axis.dec * Math.PI) / 180;
    const w = (axis.spin * Math.PI) / 180;
    const x = [-Math.sin(ra), Math.cos(ra), 0];
    const y = [-Math.sin(dec) * Math.cos(ra), -Math.sin(dec) * Math.sin(ra), Math.cos(dec)];
    const matrix = [
      localVector(
        new Vector(
          ...(x.map((value, i) => value * Math.cos(w) + y[i] * Math.sin(w)) as [
            number,
            number,
            number
          ]),
          axis.north.t
        )
      ),
      localVector(
        new Vector(
          ...(x.map((value, i) => -value * Math.sin(w) + y[i] * Math.cos(w)) as [
            number,
            number,
            number
          ]),
          axis.north.t
        )
      ),
      localVector(axis.north)
    ].flat();
    return {rotation: matrix, globeRotation: skyRotationToGlobe(matrix, observer)};
  };
  const starfieldRotation = rotation.rot.flatMap(column => [-column[1], column[0], column[2]]);
  const libration = Libration(time);
  const lighting = getSkyLighting(sun.altitude, moon.altitude, {
    ...options.atmosphere,
    moonPhaseAngle: phaseAngle,
    moonDistance: moon.distance,
    moonSunSeparation: sunSeparation
  });
  lighting.moon.illuminance = appearance.illuminance;
  lighting.moon.horizontalIlluminance = appearance.horizontalIlluminance;
  return {
    timestamp: date.getTime(),
    observer,
    frame: 'topocentric-ENU' as const,
    equatorialFrame: 'J2000' as const,
    angleUnits: 'radians' as const,
    distanceUnits: 'kilometers' as const,
    starfieldRotation,
    globeStarfieldRotation: skyRotationToGlobe(starfieldRotation, observer),
    sun,
    lighting,
    moon: {
      ...moon,
      phaseAngle,
      illuminatedFraction: (1 + Math.cos(phaseAngle)) / 2,
      sunDirection,
      globeSunDirection: skyDirectionToGlobe(sunDirection, observer),
      appearance,
      ...orientation(Body.Moon, moon.distance),
      libration: {
        longitude: (libration.elon * Math.PI) / 180,
        latitude: (libration.elat * Math.PI) / 180
      }
    },
    planets: getPlanetSkyInfo(date, observer.latitude, observer.longitude, {
      elevation: observer.elevation,
      galileanMoons: options.galileanMoons,
      timeScales: options.timeScales,
      horizon: azimuth => getSkyHorizonAltitude(azimuth, options.horizonProfile),
      visibility: {model: 'contrast', atmosphere: options.atmosphere}
    }).map(planet => {
      const angle = (direction: number[]) =>
        Math.acos(
          Math.max(
            -1,
            Math.min(
              1,
              direction.reduce((sum, value, i) => sum + value * planet.direction[i], 0)
            )
          )
        );
      if (!planet.parent)
        planet.visibility = getPlanetVisibility(
          planet.magnitude!,
          planet.altitude,
          sun.altitude,
          angle(sun.direction),
          {
            model: 'contrast',
            atmosphere: options.atmosphere,
            minimumAltitude: Math.max(
              (5 * Math.PI) / 180,
              getSkyHorizonAltitude(planet.azimuth, options.horizonProfile)
            ),
            additionalSkyLuminance: getScatteredMoonLuminance(
              phaseAngle,
              moon.altitude,
              planet.altitude,
              angle(moon.direction),
              {...options.atmosphere, distance: moon.distance}
            )
          }
        );
      const axes = planet.parent ? null : orientation(planet.name as Body, planet.distance);
      const normal = axes?.rotation.slice(6, 9) as [number, number, number] | undefined;
      return {
        ...planet,
        ...geometry(planet.direction),
        globeSunDirection: skyDirectionToGlobe(planet.sunDirection, observer),
        orientation: axes,
        rings:
          planet.name === 'Saturn' && normal
            ? {
                normal,
                globeNormal: skyDirectionToGlobe(normal, observer),
                innerRadius: 74658,
                outerRadius: 136780
              }
            : null
      };
    })
  };
}

/** Reusable observer and bounded snapshot cache. Returned values are independent copies. */
export function createSkyContext(
  observerOptions: SkyObserver,
  options: SkySnapshotOptions & {cacheSize?: number} = {}
) {
  const observer = createSkyObserver(observerOptions);
  const configuration = structuredClone(options);
  const capacity = options.cacheSize ?? 32;
  if (!Number.isInteger(capacity) || capacity < 0 || capacity > 10000)
    throw new RangeError('Cache size must be an integer from 0 to 10000');
  const cache = new Map<number, ReturnType<typeof getSkySnapshot>>();
  let calculations = 0;
  const getSnapshot = (timestamp: number | Date) => {
    const key = new Date(timestamp).getTime();
    let snapshot = cache.get(key);
    if (snapshot) cache.delete(key);
    else {
      snapshot = getSkySnapshot(timestamp, observer, configuration);
      calculations++;
    }
    if (capacity > 0) {
      cache.set(key, snapshot);
      if (cache.size > capacity) cache.delete(cache.keys().next().value!);
    }
    return structuredClone(snapshot);
  };
  return {
    observer,
    getSnapshot,
    getSnapshots: (timestamps: readonly (number | Date)[]) => timestamps.map(getSnapshot),
    clearCache: () => cache.clear(),
    getStatistics: () => ({calculations, cachedSnapshots: cache.size})
  };
}
