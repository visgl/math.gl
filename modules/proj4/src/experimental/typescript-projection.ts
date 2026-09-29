// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import type {TypeScriptCRSInput} from './crs/spatial-reference';
import type {ProjectionImplementation, ProjectionPlugin} from './types';
import {CORE_FLAGS, CORE_PARAMETERS, normalizeCRS} from './crs/normalize';
import {TypeScriptCRSError, unsupportedStage} from './crs/types';
import type {CRSCompatibilityReason, CRSNormalizationOptions, NormalizedCRS} from './crs/types';
import {transformDatum} from './datum';
import type {Coordinate3D} from './datum';
import {wrapLongitude} from './parameters';
import type {DatumGridCollection} from './grids/types';

export type TypeScriptProjectionOptions = CRSNormalizationOptions & {
  from?: TypeScriptCRSInput;
  to?: TypeScriptCRSInput;
  /** Only these projection implementations are available to this instance. */
  projections?: readonly ProjectionPlugin[];
  /** Honor declared axis order/direction. Default false, matching proj4js. */
  enforceAxis?: boolean;
  /** Prepared horizontal grids keyed by the names used in +nadgrids. No global registry. */
  datumGrids?: DatumGridCollection;
};
type CompiledCRS = NormalizedCRS & {implementation?: ProjectionImplementation};
/** Experimental independent CRS engine. Third ordinates are ellipsoidal height or geocentric Z. */
export class TypeScriptProjection {
  private readonly from: CompiledCRS;
  private readonly to: CompiledCRS;
  private readonly enforceAxis: boolean;
  readonly lossy: boolean;
  constructor(options: TypeScriptProjectionOptions = {}) {
    const plugins = registry(options.projections || []);
    this.from = compileCRS(options.from ?? 'WGS84', plugins, options);
    this.to = compileCRS(options.to ?? 'WGS84', plugins, options);
    this.lossy = this.from.lossy || this.to.lossy;
    if (this.lossy && (this.from.kind === 'geocentric' || this.to.kind === 'geocentric'))
      unsupportedStage(
        'Horizontal extraction cannot supply ellipsoidal height for geocentric coordinates'
      );
    this.enforceAxis = Boolean(options.enforceAxis);
    this.project = this.project.bind(this);
    this.unproject = this.unproject.bind(this);
  }
  /** Returns a new array. Missing geographic/projected height defaults to zero internally. */
  project(coordinate: readonly number[]): number[] {
    return transform(coordinate, this.from, this.to, this.enforceAxis);
  }
  unproject(coordinate: readonly number[]): number[] {
    return transform(coordinate, this.to, this.from, this.enforceAxis);
  }
}
export type TypeScriptCRSCompatibility = {
  status: 'supported' | 'unsupported' | 'unknown';
  lossy: boolean;
  reason?: CRSCompatibilityReason;
  message?: string;
};
/** Check construction with this backend and this exact set of registered plugins/readers. */
export function checkTypeScriptCRSCompatibility(
  definition: TypeScriptCRSInput,
  options: TypeScriptProjectionOptions = {}
): TypeScriptCRSCompatibility {
  try {
    const crs = compileCRS(definition, registry(options.projections || []), options);
    return {status: 'supported', lossy: crs.lossy};
  } catch (error) {
    const reason = error instanceof TypeScriptCRSError ? error.reason : 'invalid-definition';
    return {
      status: reason === 'unknown-syntax' ? 'unknown' : 'unsupported',
      lossy: false,
      reason,
      message: error instanceof Error ? error.message : String(error)
    };
  }
}
const pluginKey = (name: string): string => name.toLowerCase().replace(/[\s_-]/g, '');
function registry(projections: readonly ProjectionPlugin[]): Map<string, ProjectionPlugin> {
  const plugins = new Map<string, ProjectionPlugin>();
  for (const plugin of projections) {
    for (const name of new Set([plugin.name, ...(plugin.aliases || [])].map(pluginKey))) {
      if (
        !name ||
        ['longlat', 'latlong', 'latlon', 'lonlat', 'identity'].includes(name) ||
        plugins.has(name)
      )
        throw new Error('Duplicate or reserved projection plugin: ' + name);
      plugins.set(name, plugin);
    }
  }
  return plugins;
}
function compileCRS(
  definition: TypeScriptCRSInput,
  plugins: ReadonlyMap<string, ProjectionPlugin>,
  options: TypeScriptProjectionOptions
): CompiledCRS {
  const crs = normalizeCRS(definition, options);
  const plugin = plugins.get(pluginKey(crs.projection));
  if (!['geographic', 'identity'].includes(crs.kind) && !plugin)
    throw new TypeScriptCRSError(
      'missing-plugin',
      'Projection plugin is not registered: ' + crs.projection
    );
  const allowed = new Set([...CORE_PARAMETERS, ...(plugin?.parameters || [])]);
  for (const key of Object.keys(crs.parameters)) {
    if (!allowed.has(key))
      throw new TypeScriptCRSError(
        'missing-transform-stage',
        'Unsupported PROJ parameter: +' + key
      );
    const flag = CORE_FLAGS.includes(key) || plugin?.flags?.includes(key);
    if (flag && crs.parameters[key] !== undefined)
      throw new Error('Expected a flag without a value: +' + key);
    if (!flag && !crs.parameters[key]) throw new Error('PROJ parameter requires a value: +' + key);
  }
  if (crs.parameters['type'] && crs.parameters['type'] !== 'crs')
    throw new Error('Only +type=crs is supported');
  const parameters =
    pluginKey(crs.projection) === 'fasttransversemercator'
      ? Object.freeze({...crs.parameters, approx: undefined})
      : crs.parameters;
  const implementation = plugin?.create({...crs.ellipsoid, parameters});
  if (crs.kind === 'geocentric' && (!implementation?.forward3D || !implementation?.inverse3D))
    throw new Error('Geocentric plugin must implement 3D operations');
  const references = crs.datum.grids;
  const nullIndex = references?.findIndex(reference => reference.name === 'null') ?? -1;
  const grids = references?.slice(0, nullIndex < 0 ? undefined : nullIndex + 1).map(reference => {
    const grid = Object.prototype.hasOwnProperty.call(options.datumGrids || {}, reference.name)
      ? options.datumGrids[reference.name]
      : undefined;
    if (grid && typeof grid.shift !== 'function')
      throw new Error('Invalid prepared datum grid: ' + reference.name);
    return Object.freeze({...reference, grid});
  });
  // A null fallback terminates the list. Later entries can never be consulted.
  for (const reference of grids || []) {
    if (reference.name === 'null') break;
    if (!reference.optional && !reference.grid)
      unsupportedStage('Required datum grid is not registered: ' + reference.name);
  }
  const datum = grids ? Object.freeze({...crs.datum, grids: Object.freeze(grids)}) : crs.datum;
  return {...crs, datum, implementation};
}
function axisTransform(point: Coordinate3D, axis: string, inverse: boolean): Coordinate3D {
  const result: Coordinate3D = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    const char = axis[i],
      component = 'ew'.includes(char) ? 0 : 'ns'.includes(char) ? 1 : 2;
    const sign = 'wsd'.includes(char) ? -1 : 1;
    if (inverse) result[i] = sign * point[component];
    else result[component] = sign * point[i];
  }
  return result;
}
function transform(
  coordinate: readonly number[],
  from: CompiledCRS,
  to: CompiledCRS,
  enforceAxis: boolean
): number[] {
  if (coordinate.length < 2 || coordinate.slice(0, 3).some(value => !Number.isFinite(value)))
    throw new Error('Coordinates must contain finite x, y and optional z values');
  if (from.kind === 'geocentric' && coordinate.length < 3)
    throw new Error('Geocentric input requires x, y and z');
  const fromAxis = from.storedAxis || (enforceAxis ? from.axis : 'enu');
  const toAxis = to.storedAxis || (enforceAxis ? to.axis : 'enu');
  if (
    coordinate.length < 3 &&
    (/[ud]/.test(fromAxis.slice(0, 2)) || /[ud]/.test(toAxis.slice(0, 2)))
  )
    throw new Error('This axis permutation requires three ordinates');
  let point: Coordinate3D = [coordinate[0], coordinate[1], coordinate[2] ?? 0];
  point = axisTransform(point, fromAxis, false);
  const horizontalOnly = from.lossy || to.lossy;
  const preservedHeight = point[2];
  if (horizontalOnly) point[2] = 0;
  if (from.kind === 'geocentric') {
    point = from.implementation.inverse3D(point.map(value => value * from.toMeter) as Coordinate3D);
  } else {
    const xy =
      from.kind === 'geographic'
        ? [point[0] * from.angularUnit, point[1] * from.angularUnit]
        : from.kind === 'identity'
          ? [point[0] * from.toMeter, point[1] * from.toMeter]
          : from.implementation.inverse(point[0] * from.toMeter, point[1] * from.toMeter);
    point = [xy[0], xy[1], point[2] * from.verticalUnit];
  }
  if (Math.abs(point[1]) > Math.PI / 2 || point.some(value => !Number.isFinite(value)))
    throw new Error('Coordinate is outside the geographic domain');
  point[0] += from.primeMeridian;
  point = transformDatum(point, from.datum, to.datum);
  point[0] -= to.primeMeridian;
  if (to.kind === 'geocentric') {
    point = to.implementation.forward3D(point).map(value => value / to.toMeter) as Coordinate3D;
  } else {
    if (to.kind === 'geographic' && to.longitudeWrap !== undefined)
      point[0] = to.longitudeWrap + wrapLongitude(point[0] - to.longitudeWrap);
    const xy =
      to.kind === 'geographic'
        ? [point[0] / to.angularUnit, point[1] / to.angularUnit]
        : to.kind === 'identity'
          ? [point[0] / to.toMeter, point[1] / to.toMeter]
          : to.implementation.forward(point[0], point[1]).map(value => value / to.toMeter);
    point = [xy[0], xy[1], point[2] / to.verticalUnit];
  }
  if (horizontalOnly) point[2] = preservedHeight;
  point = axisTransform(point, toAxis, true);
  if (point.some(value => !Number.isFinite(value)))
    throw new Error('Projection produced non-finite coordinates');
  return coordinate.length >= 3 || to.kind === 'geocentric'
    ? [...point, ...coordinate.slice(3)]
    : point.slice(0, 2);
}
