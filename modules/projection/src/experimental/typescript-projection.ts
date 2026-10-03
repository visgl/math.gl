// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {TypeScriptCRSInput} from './crs/spatial-reference';
import type {ProjectionDescriptor} from './projection-descriptor';
import {getLoadedProjection, preloadProjection} from './projection-descriptor';
import type {
  ProjectionImplementation,
  ProjectionPlugin,
  ProjectionPoint,
  ProjectionFlatOperation
} from './types';
import {projectionOperation} from './mutable-projection';
import {ProjectionScratch} from './projection-scratch';
import {validateScalarOutput, writeScalarOutput} from './scalar-output';
import type {ProjectionCoordinate, ProjectionOutput} from './scalar-output';
import {CORE_FLAGS, CORE_PARAMETERS, normalizeCRS} from './crs/normalize';
import {TypeScriptCRSError, unsupportedStage} from './crs/types';
import type {CRSCompatibilityReason, CRSNormalizationOptions, NormalizedCRS} from './crs/types';
import {createDatumTransform} from './datum';
import {wrapLongitude} from './parameters';
import {compileVerticalGrid} from './vertical-datum';
import type {DatumGridCollection, VerticalGridCollection} from './grids/types';

type ProjectionRegistration = ProjectionPlugin | ProjectionDescriptor;
type ProjectionResult<P, Result> =
  Extract<P, ProjectionDescriptor> extends never ? Result : Promise<Result>;
export type ProjectionEngineOptions<P extends ProjectionRegistration = ProjectionPlugin> =
  CRSNormalizationOptions & {
    from?: TypeScriptCRSInput;
    to?: TypeScriptCRSInput;
    /** Only these projection implementations are available to this instance. */
    projections?: readonly P[];
    /** Honor declared axis order/direction. Default false, matching proj4js. */
    enforceAxis?: boolean;
    /** Prepared horizontal grids keyed by the names used in +nadgrids. No global registry. */
    datumGrids?: DatumGridCollection;
    /** Prepared geoid undulations keyed by +geoidgrids names. No implicit fetching. */
    verticalGrids?: VerticalGridCollection;
  };
export type ProjectionEngineCreateOptions = ProjectionEngineOptions<ProjectionRegistration>;
export type ProjectionArray = Float32Array | Float64Array;
type CoordinateTransform = {
  flat?: ProjectionFlatOperation;
  run(point: ProjectionPoint): void;
  requiresInputZ: boolean;
  geocentricOutput: boolean;
};
type CompiledCRS = NormalizedCRS & {
  implementation?: ProjectionImplementation;
  verticalGrid?: (longitude: number, latitude: number) => number;
};
/** Configurable math.gl projection engine; see the documented supported subset and accuracy limits.
 * Third ordinates are height (gravity-related with +geoidgrids) or geocentric Z.
 */
export class ProjectionEngine<P extends ProjectionRegistration = ProjectionPlugin> {
  /** Resolve required descriptors once, then return an ordinary synchronous instance. */
  static async create(options: ProjectionEngineCreateOptions = {}): Promise<ProjectionEngine> {
    const projections = await Promise.all(requiredProjections(options).map(preloadProjection));
    return new ProjectionEngine({...options, projections});
  }

  private readonly coordinateScratch = new ProjectionScratch();
  private readonly forwardTransform?: CoordinateTransform;
  private readonly inverseTransform?: CoordinateTransform;
  private readonly deferred?: {
    options: ProjectionEngineCreateOptions;
    pending?: Promise<ProjectionEngine>;
    implementation?: ProjectionEngine;
  };
  readonly lossy: boolean;
  constructor(options: ProjectionEngineOptions<P> = {}) {
    const registrations = options.projections || [];
    const plugins = registry(registrations);
    if (registrations.some(projection => !('create' in projection))) {
      // Inspect definitions without fetching any algorithms. Importing descriptors
      // and constructing an instance never starts a dynamic import.
      const from = normalizeCRS(options.from ?? 'WGS84', options);
      const to = normalizeCRS(options.to ?? 'WGS84', options);
      this.lossy = from.lossy || to.lossy;
      this.deferred = {options: {...options, projections: [...registrations]}};
    } else {
      const eager = options as ProjectionEngineOptions;
      const eagerPlugins = plugins as ReadonlyMap<string, ProjectionPlugin>;
      const from = compileCRS(eager.from ?? 'WGS84', eagerPlugins, eager);
      const to = compileCRS(eager.to ?? 'WGS84', eagerPlugins, eager);
      this.lossy = from.lossy || to.lossy;
      if (this.lossy && (from.kind === 'geocentric' || to.kind === 'geocentric'))
        unsupportedStage(
          'Horizontal extraction cannot supply ellipsoidal height for geocentric coordinates'
        );
      if (this.lossy && (from.verticalGrid || to.verticalGrid))
        unsupportedStage('Horizontal extraction cannot be combined with vertical grids');
      this.forwardTransform = compileTransform(from, to, Boolean(options.enforceAxis));
      this.inverseTransform = compileTransform(to, from, Boolean(options.enforceAxis));
    }
    this.project = this.project.bind(this);
    this.unproject = this.unproject.bind(this);
    this.projectTo = this.projectTo.bind(this);
    this.unprojectTo = this.unprojectTo.bind(this);
    this.projectToSync = this.projectToSync.bind(this);
    this.unprojectToSync = this.unprojectToSync.bind(this);
    this.projectFlat = this.projectFlat.bind(this);
    this.unprojectFlat = this.unprojectFlat.bind(this);
    this.projectSync = this.projectSync.bind(this);
    this.unprojectSync = this.unprojectSync.bind(this);
    this.projectFlatSync = this.projectFlatSync.bind(this);
    this.unprojectFlatSync = this.unprojectFlatSync.bind(this);
  }
  private load(): Promise<ProjectionEngine> {
    const state = this.deferred;
    if (!state) return Promise.resolve(this as unknown as ProjectionEngine);
    if (state.implementation) return Promise.resolve(state.implementation);
    state.pending ||= ProjectionEngine.create(state.options)
      .then(projection => {
        state.implementation = projection;
        return projection;
      })
      .catch(error => {
        state.pending = undefined;
        throw error;
      });
    return state.pending;
  }
  private loadSync(): ProjectionEngine {
    const state = this.deferred;
    if (!state) return this as unknown as ProjectionEngine;
    if (!state.implementation) {
      const projections = requiredProjections(state.options).map(descriptor => {
        const plugin = getLoadedProjection(descriptor);
        if (!plugin)
          throw new Error(
            'Projection is not preloaded: ' + descriptor.name + '. Call preload() first.'
          );
        return plugin;
      });
      state.implementation = new ProjectionEngine({...state.options, projections});
    }
    return state.implementation;
  }
  /** Synchronous variants never import algorithms; descriptors must be preloaded. */
  projectSync(coordinate: readonly number[]): number[] {
    return this.deferred
      ? this.loadSync().project(coordinate)
      : transformScalar(coordinate, this.forwardTransform, this.coordinateScratch);
  }
  unprojectSync(coordinate: readonly number[]): number[] {
    return this.deferred
      ? this.loadSync().unproject(coordinate)
      : transformScalar(coordinate, this.inverseTransform, this.coordinateScratch);
  }
  projectFlatSync<T extends ProjectionArray>(coordinates: T, dimension = 2): T {
    return this.deferred
      ? this.loadSync().projectFlat(coordinates, dimension)
      : transformInPlace(coordinates, dimension, this.forwardTransform, this.coordinateScratch);
  }
  unprojectFlatSync<T extends ProjectionArray>(coordinates: T, dimension = 2): T {
    return this.deferred
      ? this.loadSync().unprojectFlat(coordinates, dimension)
      : transformInPlace(coordinates, dimension, this.inverseTransform, this.coordinateScratch);
  }
  /** Optional warm-up. Coordinate methods also load automatically on first use. */
  async preload(): Promise<void> {
    await this.load();
  }
  /** Eager plugins return arrays; descriptor-backed instances return promises. */
  project(coordinate: readonly number[]): ProjectionResult<P, number[]> {
    const result = this.deferred
      ? this.projectLoaded(coordinate, false)
      : transformScalar(coordinate, this.forwardTransform, this.coordinateScratch);
    return result as ProjectionResult<P, number[]>;
  }
  unproject(coordinate: readonly number[]): ProjectionResult<P, number[]> {
    const result = this.deferred
      ? this.projectLoaded(coordinate, true)
      : transformScalar(coordinate, this.inverseTransform, this.coordinateScratch);
    return result as ProjectionResult<P, number[]>;
  }
  /** Write one coordinate into caller-owned storage; return that same output. */
  projectTo<T extends ProjectionOutput>(
    coordinate: ProjectionCoordinate,
    output: T
  ): ProjectionResult<P, T> {
    return (
      this.deferred
        ? this.projectToLoaded(coordinate, output, false)
        : this.projectToSync(coordinate, output)
    ) as ProjectionResult<P, T>;
  }
  unprojectTo<T extends ProjectionOutput>(
    coordinate: ProjectionCoordinate,
    output: T
  ): ProjectionResult<P, T> {
    return (
      this.deferred
        ? this.projectToLoaded(coordinate, output, true)
        : this.unprojectToSync(coordinate, output)
    ) as ProjectionResult<P, T>;
  }
  projectToSync<T extends ProjectionOutput>(coordinate: ProjectionCoordinate, output: T): T {
    if (this.deferred) return this.loadSync().projectTo(coordinate, output);
    validateScalarOutput(
      coordinate,
      output,
      Math.max(coordinate.length, this.forwardTransform.geocentricOutput ? 3 : 2)
    );
    return transformScalar(coordinate, this.forwardTransform, this.coordinateScratch, output);
  }
  unprojectToSync<T extends ProjectionOutput>(coordinate: ProjectionCoordinate, output: T): T {
    if (this.deferred) return this.loadSync().unprojectTo(coordinate, output);
    validateScalarOutput(
      coordinate,
      output,
      Math.max(coordinate.length, this.inverseTransform.geocentricOutput ? 3 : 2)
    );
    return transformScalar(coordinate, this.inverseTransform, this.coordinateScratch, output);
  }
  private projectToLoaded<T extends ProjectionOutput>(
    coordinate: ProjectionCoordinate,
    output: T,
    inverse: boolean
  ): Promise<T> {
    validateScalarOutput(coordinate, output, coordinate.length);
    const input = coordinate.slice();
    return this.load().then(projection =>
      inverse ? projection.unprojectTo(input, output) : projection.projectTo(input, output)
    );
  }
  private projectLoaded(coordinate: readonly number[], inverse: boolean): Promise<number[]> {
    const input = coordinate.slice();
    return this.load().then(projection =>
      inverse ? projection.unproject(input) : projection.project(input)
    );
  }
  /** In-place; descriptor callers must await completion before reusing the buffer. */
  projectFlat<T extends ProjectionArray>(coordinates: T, dimension = 2): ProjectionResult<P, T> {
    const result = this.deferred
      ? this.load().then(projection => projection.projectFlat(coordinates, dimension))
      : transformInPlace(coordinates, dimension, this.forwardTransform, this.coordinateScratch);
    return result as ProjectionResult<P, T>;
  }
  unprojectFlat<T extends ProjectionArray>(coordinates: T, dimension = 2): ProjectionResult<P, T> {
    const result = this.deferred
      ? this.load().then(projection => projection.unprojectFlat(coordinates, dimension))
      : transformInPlace(coordinates, dimension, this.inverseTransform, this.coordinateScratch);
    return result as ProjectionResult<P, T>;
  }
}
function requiredProjections(options: ProjectionEngineCreateOptions): ProjectionRegistration[] {
  const available = registry(options.projections || []);
  const required = new Set<ProjectionPlugin | ProjectionDescriptor>();
  for (const definition of [options.from ?? 'WGS84', options.to ?? 'WGS84']) {
    const crs = normalizeCRS(definition, options);
    if (['geographic', 'identity'].includes(crs.kind)) continue;
    const projection = available.get(pluginKey(crs.projection));
    if (!projection)
      throw new TypeScriptCRSError(
        'missing-plugin',
        'Projection plugin is not registered: ' + crs.projection
      );
    required.add(projection);
  }
  return [...required];
}
export type ProjectionCompatibility = {
  status: 'supported' | 'unsupported' | 'unknown';
  lossy: boolean;
  reason?: CRSCompatibilityReason;
  message?: string;
};
/** Check construction with this backend and this exact set of registered plugins/readers. */
export function checkProjectionCompatibility(
  definition: TypeScriptCRSInput,
  options: ProjectionEngineOptions = {}
): ProjectionCompatibility {
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
function registry<T extends Pick<ProjectionPlugin, 'name' | 'aliases'>>(
  projections: readonly T[]
): Map<string, T> {
  const plugins = new Map<string, T>();
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
  options: ProjectionEngineOptions
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
  const verticalGrid = compileVerticalGrid(crs.parameters['geoidgrids'], options.verticalGrids);
  if (verticalGrid && (crs.kind === 'geocentric' || crs.kind === 'identity' || crs.lossy))
    unsupportedStage('Vertical grids require a non-lossy geographic or projected CRS');
  return {...crs, datum, implementation, verticalGrid};
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
  // Resolve CRS kinds and scalar constants once, outside the coordinate loop.
  const fromGeocentric = from.kind === 'geocentric';
  const inputScale = from.kind === 'geographic' ? from.angularUnit : from.toMeter;
  const outputScale = to.kind === 'geographic' ? to.angularUnit : to.toMeter;
  const inputVerticalScale = fromGeocentric ? 1 : from.verticalUnit,
    outputVerticalScale = to.kind === 'geocentric' ? outputScale : to.verticalUnit;
  const fromPrime = from.primeMeridian,
    toPrime = to.primeMeridian;
  const longitudeWrap = to.kind === 'geographic' ? to.longitudeWrap : undefined;
  let flat: ProjectionFlatOperation | undefined;
  if (
    !datum &&
    !from.verticalGrid &&
    !to.verticalGrid &&
    !horizontalOnly &&
    !inputAxis &&
    !outputAxis &&
    !fromPrime &&
    !toPrime &&
    from.verticalUnit === 1 &&
    to.verticalUnit === 1 &&
    longitudeWrap === undefined
  ) {
    const context = Object.freeze({inputScale, outputScale});
    if (from.kind === 'geographic' && to.kind === 'projected')
      flat = to.implementation?.createForwardFlat?.(context);
    if (from.kind === 'projected' && to.kind === 'geographic')
      flat = from.implementation?.createInverseFlat?.(context);
  }
  return {
    flat,
    requiresInputZ:
      Boolean(from.verticalGrid || to.verticalGrid) ||
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
      if (inputScale !== 1) {
        point.x *= inputScale;
        point.y *= inputScale;
        if (fromGeocentric) point.z *= inputScale;
      }
      source?.(point);
      if (inputVerticalScale !== 1) point.z *= inputVerticalScale;
      if (Math.abs(point.y) > Math.PI / 2 || !finite(point))
        throw new Error('Coordinate is outside the geographic domain');
      point.x += fromPrime;
      // Source H -> h before datum conversion; destination h -> H after it.
      // Sample Greenwich geographic coordinates in each grid's horizontal datum.
      if (from.verticalGrid) point.z += from.verticalGrid(point.x, point.y);
      datum?.(point);
      if (to.verticalGrid) point.z -= to.verticalGrid(point.x, point.y);
      point.x -= toPrime;
      if (longitudeWrap !== undefined)
        point.x = longitudeWrap + wrapLongitude(point.x - longitudeWrap);
      target?.(point);
      if (outputScale !== 1) {
        point.x /= outputScale;
        point.y /= outputScale;
      }
      if (outputVerticalScale !== 1) point.z /= outputVerticalScale;
      if (horizontalOnly) point.z = preservedHeight;
      outputAxis?.(point);
      if (!finite(point)) throw new Error('Projection produced non-finite coordinates');
    }
  };
}
function transformScalar<T extends ProjectionOutput = number[]>(
  coordinate: ProjectionCoordinate,
  operation: CoordinateTransform,
  scratch: ProjectionScratch,
  output?: T
): T {
  if (coordinate.length < 2)
    throw new Error('Coordinates must contain finite x, y and optional z values');
  if (coordinate.length < 3 && operation.requiresInputZ)
    throw new Error('This transform requires three ordinates');
  const length = Math.max(coordinate.length, operation.geocentricOutput ? 3 : 2);
  const point = scratch.acquire();
  try {
    point.x = coordinate[0];
    point.y = coordinate[1];
    point.z = coordinate.length >= 3 ? coordinate[2] : 0;
    operation.run(point);
    if (output) return writeScalarOutput(coordinate, output, point, length);
    // Only the legacy number-array methods omit output; retain their owned result contract.
    const result = (coordinate as readonly number[]).slice();
    result[0] = point.x;
    result[1] = point.y;
    if (coordinate.length >= 3 || operation.geocentricOutput) result[2] = point.z;
    return result as T;
  } finally {
    scratch.release(point);
  }
}
function transformInPlace<T extends ProjectionArray>(
  coordinates: T,
  dimension: number,
  operation: CoordinateTransform,
  scratch: ProjectionScratch
): T {
  if (!(coordinates instanceof Float32Array || coordinates instanceof Float64Array))
    throw new Error('In-place projection requires a Float32Array or Float64Array');
  if (!Number.isSafeInteger(dimension) || dimension < 2 || coordinates.length % dimension !== 0)
    throw new Error('Dimension must be an integer >= 2 and divide the typed array length');
  if (dimension < 3 && (operation.requiresInputZ || operation.geocentricOutput))
    throw new Error('This transform requires a dimension of at least 3');
  if (operation.flat) {
    operation.flat(coordinates, dimension);
    return coordinates;
  }
  const point = scratch.acquire();
  try {
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
  } finally {
    scratch.release(point);
  }
}
