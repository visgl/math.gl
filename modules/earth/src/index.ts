// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** @deprecated Import from `@math.gl/earth/geoid`. */
export * as geoid from './geoid';
/** @deprecated Import from `@math.gl/earth/sun`. */
export * as sun from './sun';
/** @deprecated Import from `@math.gl/earth/timezone`. */
export * as timezone from './timezone';

// Public named exports. Implementations remain in independently tree-shakable files.
/** @deprecated Import from `@math.gl/earth/geoid`. */
export {parsePGM, Geoid, createGeoidFromGrid} from './geoid';
/** @deprecated Import from `@math.gl/earth/geoid`. */
export type {GeoidGridProps} from './geoid';
/** @deprecated Import from `@math.gl/earth/sun`. */
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
  getCloudLighting,
  getRayleighPhaseFunction,
  getHenyeyGreensteinPhaseFunction,
  getCornetteShanksPhaseFunction,
  getApproximateErfcx,
  getChapmanGrazingIncidenceFunction
} from './sun';
/** @deprecated Import from `@math.gl/earth/sun`. */
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
} from './sun';
/** @deprecated Import from `@math.gl/earth/sun`. */
export {getPlanetSkyInfo, getPlanetVisibility, getPlanetVisibilityTimes} from './sun/planets';
/** @deprecated Import from `@math.gl/earth/sun`. */
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
/** @deprecated Import from `@math.gl/earth/sun`. */
export {getSkySnapshot, createSkyContext} from './sun/astronomy';
/** @deprecated Import from `@math.gl/earth/sun`. */
export type {SkyTimeScales, SkySnapshotOptions} from './sun/astronomy';
/** @deprecated Import from `@math.gl/earth/sun-stars`. */
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
/** @deprecated Import from `@math.gl/earth/sun-stars`. */
export type {
  StarRecord,
  StarPosition,
  StarPositionOptions,
  MilkyWayBackground,
  MilkyWaySample,
  StarLayerOptions,
  StarLayerDatum
} from './sun/stars';
/** @deprecated Import from `@math.gl/earth/timezone`. */
export {
  getTimezoneOffset,
  lookupTimezoneAsync,
  getLocalDateTime,
  getTimezoneLabel,
  isTimezoneSupported
} from './timezone';
/** @deprecated Import from `@math.gl/earth/timezone`. */
export type {LocalDateTime} from './timezone';
/** @deprecated Import from `@math.gl/earth/timezone`. */
export {lookupTimezone} from './timezone/lookup';
/** @deprecated Import from `@math.gl/earth/timezone`. */
export {getStartOfDay, localDateTimeToInstant, getTimezoneTransitions} from './timezone/temporal';
/** @deprecated Import from `@math.gl/earth/timezone`. */
export type {
  LocalDateTimeInput,
  LocalDateTimeOptions,
  TimezoneTransition
} from './timezone/temporal';
/** @deprecated Import from `@math.gl/earth/sun`. */
export {getSunTerminator} from './sun/terminator';
/** @deprecated Import from `@math.gl/earth/sun`. */
export type {SunTerminator, SunTerminatorOptions} from './sun/terminator';
