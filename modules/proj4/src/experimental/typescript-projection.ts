// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import type {TypeScriptCRSInput} from './crs/spatial-reference';
import type {ProjectionImplementation, ProjectionPlugin, ProjectionPoint} from './types';
import {projectionOperation} from './mutable-projection';
import {CORE_FLAGS, CORE_PARAMETERS, normalizeCRS} from './crs/normalize';
import {TypeScriptCRSError, unsupportedStage} from './crs/types';
import type {CRSCompatibilityReason, CRSNormalizationOptions, NormalizedCRS} from './crs/types';
import {createDatumTransform} from './datum';
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
export type ProjectionArray = Float32Array | Float64Array;
type CoordinateTransform = {
  run(point: ProjectionPoint): void;
  requiresInputZ: boolean;
  geocentricOutput: boolean;
};
type CompiledCRS = NormalizedCRS & {implementation?: ProjectionImplementation};
/** Experimental independent CRS engine. Third ordinates are ellipsoidal height or geocentric Z. */
export class TypeScriptProjection {
  private readonly from: CompiledCRS;
  private readonly to: CompiledCRS;
  private readonly forwardTransform: CoordinateTransform;
  private readonly inverseTransform: CoordinateTransform;
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
    this.forwardTransform = compileTransform(this.from, this.to, Boolean(options.enforceAxis));
    this.inverseTransform = compileTransform(this.to, this.from, Boolean(options.enforceAxis));
    this.project = this.project.bind(this);
    this.unproject = this.unproject.bind(this);
    this.projectFlat = this.projectFlat.bind(this);
    this.unprojectFlat = this.unprojectFlat.bind(this);
  }
  /** Returns a new array. Missing geographic/projected height defaults to zero internally. */
  project(coordinate: readonly number[]): number[] {
    return transformScalar(coordinate, this.forwardTransform);
  }
  unproject(coordinate: readonly number[]): number[] {
    return transformScalar(coordinate, this.inverseTransform);
  }
  /** Project a flat interleaved buffer in place. Earlier records remain changed on failure. */
  projectFlat<T extends ProjectionArray>(coordinates: T, dimension = 2): T {
    return transformInPlace(coordinates, dimension, this.forwardTransform);
  }
  /** Unproject a flat interleaved buffer in place; returns the same typed-array view. */
  unprojectFlat<T extends ProjectionArray>(coordinates: T, dimension = 2): T {
    return transformInPlace(coordinates, dimension, this.inverseTransform);
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

function finite(point: ProjectionPoint): boolean {
  return Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z);
}
function compileAxis(
  axis: string,
  inverse: boolean
): ((point: ProjectionPoint) => void) | undefined {
  if (axis === 'enu') return undefined;
  const indexes = [0, 0, 0],
    signs = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    const char = axis[i],
      component = 'ew'.includes(char) ? 0 : 'ns'.includes(char) ? 1 : 2;
    indexes[inverse ? i : component] = inverse ? component : i;
    signs[inverse ? i : component] = 'wsd'.includes(char) ? -1 : 1;
  }
  return point => {
    const x = point.x,
      y = point.y,
      z = point.z;
    point.x = signs[0] * (indexes[0] === 0 ? x : indexes[0] === 1 ? y : z);
    point.y = signs[1] * (indexes[1] === 0 ? x : indexes[1] === 1 ? y : z);
    point.z = signs[2] * (indexes[2] === 0 ? x : indexes[2] === 1 ? y : z);
  };
}
function compileTransform(
  from: CompiledCRS,
  to: CompiledCRS,
  enforceAxis: boolean
): CoordinateTransform {
  const fromAxis = from.storedAxis || (enforceAxis ? from.axis : 'enu');
  const toAxis = to.storedAxis || (enforceAxis ? to.axis : 'enu');
  const inputAxis = compileAxis(fromAxis, false),
    outputAxis = compileAxis(toAxis, true);
  const source =
    from.implementation &&
    projectionOperation(from.implementation, true, from.kind === 'geocentric');
  const target =
    to.implementation && projectionOperation(to.implementation, false, to.kind === 'geocentric');
  const datum = createDatumTransform(from.datum, to.datum);
  const horizontalOnly = from.lossy || to.lossy;
  return {
    requiresInputZ:
      from.kind === 'geocentric' ||
      /[ud]/.test(fromAxis.slice(0, 2)) ||
      /[ud]/.test(toAxis.slice(0, 2)),
    geocentricOutput: to.kind === 'geocentric',
    run(point) {
      if (!finite(point))
        throw new Error('Coordinates must contain finite x, y and optional z values');
      inputAxis?.(point);
      const preservedHeight = point.z;
      if (horizontalOnly) point.z = 0;
      if (from.kind === 'geocentric') {
        point.x *= from.toMeter;
        point.y *= from.toMeter;
        point.z *= from.toMeter;
        source(point);
      } else {
        if (from.kind === 'geographic') {
          point.x *= from.angularUnit;
          point.y *= from.angularUnit;
        } else {
          point.x *= from.toMeter;
          point.y *= from.toMeter;
          if (from.kind !== 'identity') source(point);
        }
        point.z *= from.verticalUnit;
      }
      if (Math.abs(point.y) > Math.PI / 2 || !finite(point))
        throw new Error('Coordinate is outside the geographic domain');
      point.x += from.primeMeridian;
      datum?.(point);
      point.x -= to.primeMeridian;
      if (to.kind === 'geocentric') {
        target(point);
        point.x /= to.toMeter;
        point.y /= to.toMeter;
        point.z /= to.toMeter;
      } else {
        if (to.kind === 'geographic') {
          if (to.longitudeWrap !== undefined)
            point.x = to.longitudeWrap + wrapLongitude(point.x - to.longitudeWrap);
          point.x /= to.angularUnit;
          point.y /= to.angularUnit;
        } else {
          if (to.kind !== 'identity') target(point);
          point.x /= to.toMeter;
          point.y /= to.toMeter;
        }
        point.z /= to.verticalUnit;
      }
      if (horizontalOnly) point.z = preservedHeight;
      outputAxis?.(point);
      if (!finite(point)) throw new Error('Projection produced non-finite coordinates');
    }
  };
}
function transformScalar(coordinate: readonly number[], operation: CoordinateTransform): number[] {
  if (coordinate.length < 2)
    throw new Error('Coordinates must contain finite x, y and optional z values');
  if (coordinate.length < 3 && operation.requiresInputZ)
    throw new Error('This transform requires three ordinates');
  const point = {x: coordinate[0], y: coordinate[1], z: coordinate.length >= 3 ? coordinate[2] : 0};
  operation.run(point);
  const output = coordinate.slice();
  output[0] = point.x;
  output[1] = point.y;
  if (coordinate.length >= 3 || operation.geocentricOutput) output[2] = point.z;
  return output;
}
function transformInPlace<T extends ProjectionArray>(
  coordinates: T,
  dimension: number,
  operation: CoordinateTransform
): T {
  if (!(coordinates instanceof Float32Array || coordinates instanceof Float64Array))
    throw new Error('In-place projection requires a Float32Array or Float64Array');
  if (!Number.isSafeInteger(dimension) || dimension < 2 || coordinates.length % dimension !== 0)
    throw new Error('Dimension must be an integer >= 2 and divide the typed array length');
  if (dimension < 3 && (operation.requiresInputZ || operation.geocentricOutput))
    throw new Error('This transform requires a dimension of at least 3');
  const point = {x: 0, y: 0, z: 0};
  const float32 = coordinates instanceof Float32Array;
  for (let offset = 0; offset < coordinates.length; offset += dimension) {
    point.x = coordinates[offset];
    point.y = coordinates[offset + 1];
    point.z = dimension >= 3 ? coordinates[offset + 2] : 0;
    operation.run(point);
    // Commit only a complete finite record; do not silently overflow Float32 storage.
    if (
      float32 &&
      (Math.abs(point.x) > 3.4028234663852886e38 ||
        Math.abs(point.y) > 3.4028234663852886e38 ||
        (dimension >= 3 && Math.abs(point.z) > 3.4028234663852886e38))
    )
      throw new Error('Projected coordinate exceeds Float32 range');
    coordinates[offset] = point.x;
    coordinates[offset + 1] = point.y;
    if (dimension >= 3) coordinates[offset + 2] = point.z;
  }
  return coordinates;
}
