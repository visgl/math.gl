// Classic web-mercator-project
export {WebMercatorViewport} from './web-mercator-viewport';

export {getBounds} from './get-bounds';
export {fitBounds} from './fit-bounds';
export {normalizeViewportProps} from './normalize-viewport-props';
export {flyToViewport, getFlyToDuration} from './fly-to-viewport';

export {
  MAX_LATITUDE,
  lngLatToWorld,
  worldToLngLat,
  worldToPixels,
  pixelsToWorld,
  zoomToScale,
  scaleToZoom,
  altitudeToFovy,
  fovyToAltitude,
  getMeterZoom,
  unitsPerMeter,
  getDistanceScales,
  addMetersToLngLat,
  getViewMatrix,
  getProjectionMatrix,
  getProjectionParameters
} from './web-mercator-utils';

export {
  EPSG3857_EARTH_RADIUS,
  EPSG3857_HALF_CIRCUMFERENCE,
  EPSG3857_MAX_LATITUDE,
  EPSG3857_UNITS_PER_METER,
  lngLatToEPSG3857,
  EPSG3857ToLngLat,
  EPSG4326ToEPSG3857,
  EPSG3857ToEPSG4326
} from './mercator-meters';

export type {EPSG3857Options} from './mercator-meters';

/** Types */
export type {FitBoundsOptions} from './fit-bounds';
export type {DistanceScales} from './web-mercator-utils';

/** @deprecated default export */
export {WebMercatorViewport as default} from './web-mercator-viewport';
