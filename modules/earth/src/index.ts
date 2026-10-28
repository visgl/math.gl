// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export * as geoid from './geoid/index';
export * as sun from './sun/index';
export * as timezone from './timezone/index';

// Public named exports. Implementations remain in independently tree-shakable files.
export {parsePGM, Geoid, createGeoidFromGrid} from './geoid/index';
export type {GeoidGridProps} from './geoid/index';
export {
  getMoonPosition,
  getMoonDirection,
  getMoonIllumination,
  getMoonLight,
  getStarfieldRotation,
  getSunPosition,
  getSunDirection,
  getSunLight,
  createSkyObserver,
  getSkyDirection,
  reverseSkyDirection,
  getSkyHorizonAltitude,
  createSkyAtmosphere,
  getSkyAirMass,
  getSkyTransmission,
  getSkyLuminance,
  getSkyContrastThreshold,
  getMoonAppearance,
  getSkyLighting,
  searchSkyVisibility,
  getScatteredMoonLuminance,
  SKY_GLOBE_EARTH_RADIUS,
  getSkyGlobeRotation,
  skyDirectionToGlobe,
  getSkyGlobePosition,
  skyRotationToGlobe,
  getCloudLighting
} from './sun/index';
export type {
  MoonPosition,
  MoonIllumination,
  MoonLight,
  MoonLightOptions,
  StarfieldOptions,
  LightColor,
  SunLight,
  SunLightOptions,
  SkyObserver,
  SkyHorizonProfile,
  SkyAtmosphereOptions,
  MoonAppearanceOptions,
  SkyLightingOptions,
  CloudLighting,
  CloudLightingOptions
} from './sun/index';
export {getPlanetSkyInfo, getPlanetVisibility, getPlanetVisibilityTimes} from './sun/planets';
export type {
  PlanetName,
  GalileanMoonName,
  PlanetSkyOptions,
  PlanetSkyBody,
  PlanetVisibility,
  PlanetVisibilityOptions,
  PlanetVisibilityTimes,
  PlanetVisibilityTimesOptions,
  PlanetVisibilityInterval
} from './sun/planets';
export {getSkySnapshot, createSkyContext} from './sun/astronomy';
export type {SkyTimeScales, SkySnapshotOptions} from './sun/astronomy';
export {
  getStarPosition,
  getStarPositions,
  getStarColor,
  getGalacticAcceleration,
  getGalacticPotential,
  integrateGalacticOrbit,
  createMilkyWayBackground,
  getStarLayerData
} from './sun/stars';
export type {
  StarRecord,
  StarPosition,
  StarPositionOptions,
  MilkyWayBackground,
  MilkyWaySample,
  StarLayerOptions,
  StarLayerDatum
} from './sun/stars';
export {
  getTimezoneOffset,
  lookupTimezoneAsync,
  getLocalDateTime,
  getTimezoneLabel,
  isTimezoneSupported
} from './timezone/index';
export type {LocalDateTime} from './timezone/index';
export {lookupTimezone} from './timezone/lookup';
export {getStartOfDay, localDateTimeToInstant, getTimezoneTransitions} from './timezone/temporal';
export type {
  LocalDateTimeInput,
  LocalDateTimeOptions,
  TimezoneTransition
} from './timezone/temporal';
export {getSunTerminator} from './sun/terminator';
export type {SunTerminator, SunTerminatorOptions} from './sun/terminator';
