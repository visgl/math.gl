// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Original typed orchestration inspired by PROJ's explicit pipeline model.
// Projection, geocentric and static Helmert equations reuse the proj4js adaptations
// in this package; see datum.ts and ../../PROJ4-LICENSE.md. No PROJ code is copied.
import {CORE_PARAMETERS, normalizeCRS} from './crs/normalize';
import {unsupportedStage} from './crs/types';
import {
  applyDatumGrids,
  createHelmert,
  geocentricToGeodeticInPlace,
  geodeticToGeocentricInPlace
} from './datum';
import {projectionOperation} from './mutable-projection';
import {getLoadedProjection, preloadProjection} from './projection-descriptor';
import {compileVerticalGrid} from './vertical-datum';
import type {ProjectionDescriptor} from './projection-descriptor';
import type {ProjectionParameters, ProjectionPlugin, ProjectionPoint} from './types';
import type {ProjectionArray} from './typescript-projection';
import type {DatumGridCollection, VerticalGridCollection} from './grids/types';

export type PipelineUnit = 'deg' | 'rad' | 'm' | 'ft' | 'us-ft';
export type PipelineCoordinateSystem = {
  readonly space: 'geographic' | 'projected' | 'geocentric';
  /** Units in stored X/Y/Z order. Geographic steps require longitude/latitude order. */
  readonly units: readonly [PipelineUnit, PipelineUnit, PipelineUnit];
};
export type PipelineEllipsoid = Readonly<
  Partial<Record<'ellps' | 'a' | 'b' | 'rf' | 'f' | 'R', string>>
>;
type Direction = {readonly inverse?: boolean};
export type PipelineStep = Direction &
  (
    | {
        readonly type: 'unitconvert';
        readonly xy?: {readonly from: PipelineUnit; readonly to: PipelineUnit};
        readonly z?: {readonly from: PipelineUnit; readonly to: PipelineUnit};
      }
    | {
        readonly type: 'axisswap';
        readonly order: readonly [number, number] | readonly [number, number, number];
      }
    | {
        readonly type: 'projection';
        readonly name: string;
        readonly parameters?: ProjectionParameters;
      }
    | {readonly type: 'cart'; readonly ellipsoid?: PipelineEllipsoid}
    | {
        readonly type: 'helmert';
        readonly translation: readonly [number, number, number];
        readonly rotation?: readonly [number, number, number];
        readonly scalePPM?: number;
        readonly convention?: 'position_vector' | 'coordinate_frame';
      }
    | {readonly type: 'hgridshift'; readonly grids: string}
    | {readonly type: 'vgridshift'; readonly grids: string; readonly multiplier?: number}
  );
type Registration = ProjectionPlugin | ProjectionDescriptor;
type Result<P, T> = Extract<P, ProjectionDescriptor> extends never ? T : Promise<T>;
export type ProjectionPipelineOptions<P extends Registration = ProjectionPlugin> = {
  readonly input: PipelineCoordinateSystem;
  readonly steps: readonly PipelineStep[];
  readonly projections?: readonly P[];
  readonly datumGrids?: DatumGridCollection;
  readonly verticalGrids?: VerticalGridCollection;
};
type Operation = (point: ProjectionPoint) => void;
type Pair = {forward: Operation; inverse: Operation};
type Factory = () => Pair;
const factors: Record<PipelineUnit, number> = {
  deg: Math.PI / 180,
  rad: 1,
  m: 1,
  ft: 0.3048,
  'us-ft': 1200 / 3937
};
const geometryKeys = ['ellps', 'a', 'b', 'rf', 'f', 'R'];
const angular = (unit: PipelineUnit): boolean => unit === 'deg' || unit === 'rad';
const own = (value: object, name: string): boolean =>
  Object.prototype.hasOwnProperty.call(value, name);
function keys(value: object, allowed: readonly string[]): void {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Expected operation object');
  for (const name of Object.keys(value))
    if (!allowed.includes(name)) unsupportedStage('Unsupported pipeline parameter: ' + name);
}
function definition(name: string, parameters: ProjectionParameters = {}): string {
  if (!/^[a-z][a-z0-9_]*$/i.test(name)) throw new Error('Invalid projection name');
  return (
    '+proj=' +
    name +
    Object.entries(parameters)
      .map(([key, value]) => {
        if (
          !/^[a-z][a-z0-9_]*$/i.test(key) ||
          (value !== undefined &&
            (typeof value !== 'string' ||
              !value ||
              /[\s=]/.test(value) ||
              /\+/.test(value.slice(1).replace(/[eE]\+/g, ''))))
        )
          throw new Error('Invalid pipeline projection parameter: ' + key);
        return ' +' + key + (value === undefined ? '' : '=' + value);
      })
      .join('')
  );
}
function finite(point: ProjectionPoint): void {
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y) || !Number.isFinite(point.z))
    throw new Error('Pipeline coordinate must be finite');
}
function triple(values: readonly number[]): void {
  if (!Array.isArray(values) || values.length !== 3 || !values.every(Number.isFinite))
    throw new Error('Expected three finite Helmert parameters');
}

/** Explicit, reversible operations; no CRS/epoch inference or string pipeline parser.
 * Built-in steps use one scratch point per call and never allocate coordinate arrays
 * inside the flat loop. M and additional ordinates are preserved, never interpreted.
 */
export class ProjectionPipeline<P extends Registration = ProjectionPlugin> {
  readonly input: PipelineCoordinateSystem;
  readonly output: PipelineCoordinateSystem;
  private readonly factories: Factory[] = [];
  private readonly required: Registration[] = [];
  private readonly deferred: boolean;
  private requiresZ = false;
  private compiled?: {forward: Operation[]; inverse: Operation[]};
  private pending?: Promise<this>;

  constructor(options: ProjectionPipelineOptions<P>) {
    keys(options, ['input', 'steps', 'projections', 'datumGrids', 'verticalGrids']);
    keys(options.input, ['space', 'units']);
    const {space, units} = options.input;
    if (
      !['geographic', 'projected', 'geocentric'].includes(space) ||
      !Array.isArray(units) ||
      units.length !== 3 ||
      units.some(unit => !own(factors, unit)) ||
      angular(units[2]) ||
      (space === 'geographic'
        ? !angular(units[0]) || !angular(units[1])
        : angular(units[0]) || angular(units[1]))
    )
      throw new Error('Invalid pipeline input space/units');
    if (!Array.isArray(options.steps) || options.steps.length === 0)
      throw new Error('Pipeline requires at least one step');
    this.requiresZ = space === 'geocentric';
    this.input = Object.freeze({
      space,
      units: Object.freeze([...units]) as PipelineCoordinateSystem['units']
    });
    const state = {space, units: [...units] as [PipelineUnit, PipelineUnit, PipelineUnit]};
    const projections = [...(options.projections || [])];
    this.deferred = projections.some(projection => !('create' in projection));
    for (const step of options.steps)
      this.factories.push(this.prepare(step, state, {...options, projections}));
    this.output = Object.freeze({space: state.space, units: Object.freeze(state.units)});
    if (this.required.every(projection => getLoadedProjection(projection))) this.compile();
    this.project = this.project.bind(this);
    this.unproject = this.unproject.bind(this);
    this.projectSync = this.projectSync.bind(this);
    this.unprojectSync = this.unprojectSync.bind(this);
    this.projectFlat = this.projectFlat.bind(this);
    this.unprojectFlat = this.unprojectFlat.bind(this);
    this.projectFlatSync = this.projectFlatSync.bind(this);
    this.unprojectFlatSync = this.unprojectFlatSync.bind(this);
  }

  /** Load only implementations named by pipeline steps; failures can be retried. */
  preload(): Promise<this> {
    if (this.compiled) return Promise.resolve(this);
    this.pending ||= Promise.all(this.required.map(preloadProjection))
      .then(() => {
        this.compile();
        return this;
      })
      .catch(error => {
        this.pending = undefined;
        throw error;
      });
    return this.pending;
  }
  project(coordinate: readonly number[]): Result<P, number[]> {
    return (
      this.deferred
        ? this.preload().then(() => this.projectSync(coordinate))
        : this.projectSync(coordinate)
    ) as Result<P, number[]>;
  }
  unproject(coordinate: readonly number[]): Result<P, number[]> {
    return (
      this.deferred
        ? this.preload().then(() => this.unprojectSync(coordinate))
        : this.unprojectSync(coordinate)
    ) as Result<P, number[]>;
  }
  projectFlat<T extends ProjectionArray>(coordinates: T, dimension = 2): Result<P, T> {
    return (
      this.deferred
        ? this.preload().then(() => this.projectFlatSync(coordinates, dimension))
        : this.projectFlatSync(coordinates, dimension)
    ) as Result<P, T>;
  }
  unprojectFlat<T extends ProjectionArray>(coordinates: T, dimension = 2): Result<P, T> {
    return (
      this.deferred
        ? this.preload().then(() => this.unprojectFlatSync(coordinates, dimension))
        : this.unprojectFlatSync(coordinates, dimension)
    ) as Result<P, T>;
  }
  projectSync(coordinate: readonly number[]): number[] {
    return this.scalar(coordinate, false);
  }
  unprojectSync(coordinate: readonly number[]): number[] {
    return this.scalar(coordinate, true);
  }
  projectFlatSync<T extends ProjectionArray>(coordinates: T, dimension = 2): T {
    return this.flat(coordinates, dimension, false);
  }
  unprojectFlatSync<T extends ProjectionArray>(coordinates: T, dimension = 2): T {
    return this.flat(coordinates, dimension, true);
  }

  private compile(): void {
    if (this.compiled) return;
    for (const registration of this.required)
      if (!getLoadedProjection(registration))
        unsupportedStage('Pipeline projection requires preload(): ' + registration.name);
    const pairs = this.factories.map(factory => factory());
    this.compiled = {
      forward: pairs.map(pair => pair.forward),
      inverse: pairs.map(pair => pair.inverse).reverse()
    };
  }
  private operations(inverse: boolean): Operation[] {
    this.compile();
    return inverse ? this.compiled.inverse : this.compiled.forward;
  }
  private scalar(coordinate: readonly number[], inverse: boolean): number[] {
    if (coordinate.length < (this.requiresZ ? 3 : 2))
      throw new Error('Pipeline requires ' + (this.requiresZ ? 'XYZ' : 'XY') + ' coordinates');
    const operations = this.operations(inverse);
    const point = {
      x: coordinate[0],
      y: coordinate[1],
      z: coordinate.length >= 3 ? coordinate[2] : 0
    };
    this.run(point, operations);
    const output = [...coordinate];
    output[0] = point.x;
    output[1] = point.y;
    if (coordinate.length >= 3) output[2] = point.z;
    return output;
  }
  private flat<T extends ProjectionArray>(coordinates: T, dimension: number, inverse: boolean): T {
    if (
      !(coordinates instanceof Float32Array || coordinates instanceof Float64Array) ||
      !Number.isSafeInteger(dimension) ||
      dimension < (this.requiresZ ? 3 : 2) ||
      coordinates.length % dimension
    )
      throw new Error('Pipeline requires Float32Array/Float64Array and a valid XY/XYZ stride');
    const operations = this.operations(inverse),
      point = {x: 0, y: 0, z: 0};
    const float32 = coordinates instanceof Float32Array;
    for (let i = 0; i < coordinates.length; i += dimension) {
      point.x = coordinates[i];
      point.y = coordinates[i + 1];
      point.z = dimension >= 3 ? coordinates[i + 2] : 0;
      this.run(point, operations);
      if (
        float32 &&
        Math.max(Math.abs(point.x), Math.abs(point.y), Math.abs(point.z)) > 3.4028234663852886e38
      )
        throw new Error('Pipeline output exceeds Float32 range');
      coordinates[i] = point.x;
      coordinates[i + 1] = point.y;
      if (dimension >= 3) coordinates[i + 2] = point.z;
    }
    return coordinates;
  }
  private run(point: ProjectionPoint, operations: readonly Operation[]): void {
    finite(point);
    for (const operation of operations) {
      operation(point);
      finite(point);
    }
  }
  private prepare(
    step: PipelineStep,
    state: {
      space: PipelineCoordinateSystem['space'];
      units: [PipelineUnit, PipelineUnit, PipelineUnit];
    },
    options: ProjectionPipelineOptions<Registration>
  ): Factory {
    const allowed: Record<PipelineStep['type'], string[]> = {
      unitconvert: ['xy', 'z'],
      axisswap: ['order'],
      projection: ['name', 'parameters'],
      cart: ['ellipsoid'],
      helmert: ['translation', 'rotation', 'scalePPM', 'convention'],
      hgridshift: ['grids'],
      vgridshift: ['grids', 'multiplier']
    };
    if (!step || !own(allowed, step.type))
      unsupportedStage('Unsupported pipeline operation: ' + step?.type);
    keys(step, ['type', 'inverse', ...allowed[step.type]]);
    if (step.inverse !== undefined && typeof step.inverse !== 'boolean')
      throw new Error('Invalid pipeline inverse flag');
    const inverse = Boolean(step.inverse);
    const orient = (pair: Pair): Pair =>
      inverse ? {forward: pair.inverse, inverse: pair.forward} : pair;
    const pair =
      (forward: Operation, backward: Operation): Factory =>
      () =>
        orient({forward, inverse: backward});
    const requireState = (
      space: PipelineCoordinateSystem['space'],
      expected: readonly PipelineUnit[]
    ) => {
      if (state.space !== space || expected.some((unit, index) => state.units[index] !== unit))
        throw new Error(
          'Pipeline step ' + step.type + ' requires ' + space + ' ' + expected.join('/')
        );
    };
    switch (step.type) {
      case 'unitconvert': {
        if (!step.xy && !step.z) throw new Error('Empty unit conversion');
        const scale = [1, 1, 1];
        for (const [conversion, indices] of [
          [step.xy, [0, 1]],
          [step.z, [2]]
        ] as const) {
          if (!conversion) continue;
          keys(conversion, ['from', 'to']);
          const {from, to} = conversion;
          if (!own(factors, from) || !own(factors, to) || angular(from) !== angular(to))
            throw new Error('Incompatible pipeline units');
          for (const index of indices) {
            if (state.units[index] !== (inverse ? to : from))
              throw new Error('Pipeline unit mismatch');
            state.units[index] = inverse ? from : to;
            scale[index] = factors[from] / factors[to];
          }
        }
        this.requiresZ ||= Boolean(step.z);
        return pair(
          p => {
            p.x *= scale[0];
            p.y *= scale[1];
            p.z *= scale[2];
          },
          p => {
            p.x /= scale[0];
            p.y /= scale[1];
            p.z /= scale[2];
          }
        );
      }
      case 'axisswap': {
        const order = [...step.order];
        if (
          ![2, 3].includes(order.length) ||
          order.some(
            index =>
              !Number.isInteger(index) || Math.abs(index) < 1 || Math.abs(index) > order.length
          ) ||
          new Set(order.map(Math.abs)).size !== order.length
        )
          throw new Error('Axis order must be a signed permutation');
        if (order.length === 2) order.push(3);
        this.requiresZ ||= step.order.length === 3;
        const reverse = [0, 0, 0];
        order.forEach((index, target) => {
          reverse[Math.abs(index) - 1] = Math.sign(index) * (target + 1);
        });
        const selected = inverse ? reverse : order;
        state.units = selected.map(index => state.units[Math.abs(index) - 1]) as typeof state.units;
        const value = (index: number, x: number, y: number, z: number) =>
          Math.sign(index) * (Math.abs(index) === 1 ? x : Math.abs(index) === 2 ? y : z);
        const operation =
          (indices: number[]): Operation =>
          p => {
            const x = p.x,
              y = p.y,
              z = p.z;
            p.x = value(indices[0], x, y, z);
            p.y = value(indices[1], x, y, z);
            p.z = value(indices[2], x, y, z);
          };
        return pair(operation(order), operation(reverse));
      }
      case 'projection': {
        requireState(inverse ? 'projected' : 'geographic', inverse ? ['m', 'm'] : ['rad', 'rad']);
        state.space = inverse ? 'geographic' : 'projected';
        state.units[0] = state.units[1] = inverse ? 'rad' : 'm';
        const key = (name: string) => name.toLowerCase().replace(/[\s_-]/g, '');
        if (typeof step.name !== 'string') throw new Error('Invalid projection name');
        const registration = options.projections?.find(p =>
          [p.name, ...(p.aliases || [])].some(name => key(name) === key(step.name))
        );
        if (!registration) unsupportedStage('Pipeline projection is not registered: ' + step.name);
        if (!this.required.includes(registration)) this.required.push(registration);
        const parameters = {...step.parameters};
        for (const name of Object.keys(parameters))
          if (CORE_PARAMETERS.includes(name) && !geometryKeys.includes(name) && name !== 'over')
            unsupportedStage('Unsupported pipeline parameter: ' + name);
        if (key(registration.name) === 'obtran')
          unsupportedStage('Oblique helper pipelines require an explicit output-unit contract');
        const normalized = normalizeCRS(definition(registration.name, parameters));
        if (normalized.kind !== 'projected')
          unsupportedStage('Use a cart step for geocentric conversion');
        return () => {
          const plugin = getLoadedProjection(registration);
          if (!plugin)
            unsupportedStage('Pipeline projection requires preload(): ' + registration.name);
          if (
            [
              'geocent',
              'geocentric',
              'identity',
              'longlat',
              'latlong',
              'latlon',
              'lonlat',
              'obtran'
            ].includes(key(plugin.name))
          )
            unsupportedStage(
              'Pipeline projection requires a projected-metre output contract: ' + plugin.name
            );
          keys(parameters, [...geometryKeys, 'over', ...plugin.parameters]);
          for (const [name, value] of Object.entries(parameters)) {
            const flag = name === 'over' || plugin.flags?.includes(name);
            if (flag && value !== undefined)
              throw new Error('Expected a flag without a value: ' + name);
            if (!flag && value === undefined)
              throw new Error('Pipeline parameter requires a value: ' + name);
          }
          const implementation = plugin.create({
            parameters: {...normalized.parameters, proj: plugin.name},
            semiMajorAxis: normalized.ellipsoid.semiMajorAxis,
            eccentricitySquared: normalized.ellipsoid.eccentricitySquared
          });
          return orient({
            forward: projectionOperation(implementation, false),
            inverse: projectionOperation(implementation, true)
          });
        };
      }
      case 'cart': {
        requireState(
          inverse ? 'geocentric' : 'geographic',
          inverse ? ['m', 'm', 'm'] : ['rad', 'rad', 'm']
        );
        state.space = inverse ? 'geographic' : 'geocentric';
        state.units = inverse ? ['rad', 'rad', 'm'] : ['m', 'm', 'm'];
        this.requiresZ = true;
        keys(step.ellipsoid || {}, geometryKeys);
        const ellipsoid = normalizeCRS(definition('longlat', step.ellipsoid)).ellipsoid;
        return pair(
          p => geodeticToGeocentricInPlace(p, ellipsoid),
          p => geocentricToGeodeticInPlace(p, ellipsoid)
        );
      }
      case 'helmert': {
        requireState('geocentric', ['m', 'm', 'm']);
        this.requiresZ = true;
        triple(step.translation);
        if (step.rotation) triple(step.rotation);
        if (step.rotation && !step.convention)
          throw new Error('Helmert rotation requires a convention');
        if (
          step.convention !== undefined &&
          !['position_vector', 'coordinate_frame'].includes(step.convention)
        )
          throw new Error('Invalid Helmert convention');
        const scale = step.scalePPM ?? 0;
        if (!Number.isFinite(scale) || scale <= -1e6)
          throw new Error('Helmert requires positive finite scale');
        const sign = step.convention === 'coordinate_frame' ? -1 : 1;
        const values = [
          ...step.translation,
          ...(step.rotation || [0, 0, 0]).map(value => sign * value),
          scale
        ];
        return pair(createHelmert(values, false), createHelmert(values, true));
      }
      case 'hgridshift': {
        requireState('geographic', ['rad', 'rad']);
        if (typeof step.grids !== 'string') throw new Error('Horizontal grid names required');
        const crs = normalizeCRS(definition('longlat', {nadgrids: step.grids}));
        const grids = crs.datum.grids.map(reference => {
          const grid = own(options.datumGrids || {}, reference.name)
            ? options.datumGrids[reference.name]
            : undefined;
          if (reference.name !== 'null' && !grid && !reference.optional)
            unsupportedStage('Required datum grid is not registered: ' + reference.name);
          if (grid && typeof grid.shift !== 'function')
            throw new Error('Invalid datum grid: ' + reference.name);
          return {...reference, grid};
        });
        const datum = {...crs.datum, grids};
        return pair(
          p => applyDatumGrids(p, datum, false),
          p => applyDatumGrids(p, datum, true)
        );
      }
      case 'vgridshift': {
        requireState('geographic', ['rad', 'rad', 'm']);
        this.requiresZ = true;
        if (typeof step.grids !== 'string') throw new Error('Vertical grid names required');
        const offset = compileVerticalGrid(step.grids, options.verticalGrids);
        const multiplier = step.multiplier ?? -1;
        if (!Number.isFinite(multiplier))
          throw new Error('Vertical grid multiplier must be finite');
        return pair(
          p => {
            p.z += multiplier * offset(p.x, p.y);
          },
          p => {
            p.z -= multiplier * offset(p.x, p.y);
          }
        );
      }
      default:
        throw new Error('Unsupported pipeline step');
    }
  }
}
