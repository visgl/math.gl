// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original typed orchestration inspired by PROJ's explicit pipeline model. Projection, geocentric and static Helmert equations reuse the proj4js adaptations in this package; see datum.ts and ../../PROJ4-LICENSE.md. The separate exact Helmert matrix is adapted from PROJ; see exact-helmert.ts and ../../PROJ-LICENSE.txt.
import type {DeformationModel} from './deformation';
import {CORE_PARAMETERS, normalizeCRS} from './crs/normalize';
import {unsupportedStage} from './crs/types';
import {
  applyDatumGrids,
  createHelmert,
  geocentricToGeodeticInPlace,
  geodeticToGeocentricInPlace
} from './datum';
import {projectionOperation} from './mutable-projection';
import {ProjectionScratch} from './projection-scratch';
import {createNumericFlat} from './numeric-flat';
import type {NumericStep, NumericFlatOperation} from './numeric-flat';
import {validateScalarOutput, writeScalarOutput} from './scalar-output';
import type {ProjectionCoordinate, ProjectionOutput} from './scalar-output';
export type {ProjectionCoordinate, ProjectionOutput} from './scalar-output';
import {createHelmertFlat} from './helmert-flat';
import {createExactHelmert} from './exact-helmert';
import {createKinematicHelmert} from './kinematic-helmert';
import {getLoadedProjection, preloadProjection} from './projection-descriptor';
import {compileVerticalGrid} from './vertical-datum';
import type {ProjectionDescriptor} from './projection-descriptor';
import type {ProjectionParameters, ProjectionPlugin, ProjectionPoint} from './types';
import type {ProjectionArray} from './typescript-projection';
import type {DatumGridCollection, VerticalGridCollection} from './grids/types';

/** Decimal years; a flat call accepts one epoch or one per coordinate record. */
export type PipelineEpochs = number | Float32Array | Float64Array;
export type PipelineHelmertRates = {
  /** Metres per decimal year. */
  readonly translation?: readonly [number, number, number];
  /** Arcseconds per decimal year, using the step's rotation convention. */
  readonly rotation?: readonly [number, number, number];
  /** Parts per million per decimal year. */
  readonly scalePPM?: number;
};
export type PipelineUnit = 'deg' | 'rad' | 'm' | 'ft' | 'us-ft';
export type PipelineCoordinateSystem = {
  readonly space: 'geographic' | 'projected' | 'geocentric';
  /** Units in stored X/Y/Z order. Geographic steps require longitude/latitude order. */
  readonly units: readonly [PipelineUnit, PipelineUnit, PipelineUnit];
};
export type PipelineEllipsoid = Readonly<
  Partial<Record<'ellps' | 'a' | 'b' | 'rf' | 'f' | 'R', string>>
>;
export type PipelineProjectionOutput =
  | {readonly space: 'geographic'; readonly unit: 'deg' | 'rad'}
  | {readonly space: 'projected'; readonly unit: 'm'};
type Direction = {
  readonly inverse?: boolean;
  /** Omit this step when calling project/projectFlat. */
  readonly omitForward?: boolean;
  /** Omit this step when calling unproject/unprojectFlat. */
  readonly omitInverse?: boolean;
};
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
        /** Required for ob_tran; geographic helper output can be degrees or radians. */
        readonly output?: PipelineProjectionOutput;
      }
    | {readonly type: 'cart'; readonly ellipsoid?: PipelineEllipsoid}
    | {
        readonly type: 'helmert';
        readonly translation: readonly [number, number, number];
        readonly rotation?: readonly [number, number, number];
        readonly scalePPM?: number;
        readonly convention?: 'position_vector' | 'coordinate_frame';
        /** Use a full rotation matrix and its mathematical inverse. Default false. */
        readonly exact?: boolean;
        /** Decimal year at which the base parameters apply. Required with rates. */
        readonly referenceEpoch?: number;
        readonly rates?: PipelineHelmertRates;
      }
    | {
        readonly type: 'deformation';
        readonly model: DeformationModel;
        /** 'coordinate' uses the separate scalar/batch/per-record epoch argument. */
        readonly sourceEpoch: number | 'coordinate';
        readonly targetEpoch: number;
      }
    | {readonly type: 'push' | 'pop'; readonly components: readonly (1 | 2 | 3)[]}
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
type Operation = (point: ProjectionPoint, stack: Float64Array, epoch?: number) => void;
type StackEntry = {unit: PipelineUnit; space: PipelineCoordinateSystem['space']; slot: number};
type State = {
  space: PipelineCoordinateSystem['space'];
  units: [PipelineUnit, PipelineUnit, PipelineUnit];
  stacks: StackEntry[][];
};
const EMPTY_STACK = new Float64Array(0);
// Typed-array buffers are ordinary or shared. The intrinsic getter checks the
// backing-store brand across realms and cannot be fooled by Symbol.toStringTag.
const ordinaryByteLength = Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, 'byteLength').get;
function sharedBuffer(buffer: ArrayBufferLike): boolean {
  try {
    ordinaryByteLength.call(buffer);
    return false;
  } catch {
    return true;
  }
}

type Pair = {
  forward: Operation;
  inverse: Operation;
  forwardNumeric?: NumericStep;
  inverseNumeric?: NumericStep;
  forwardFlat?: NumericFlatOperation;
  inverseFlat?: NumericFlatOperation;
};
function compileFlat(pairs: readonly Pair[]): NumericFlatOperation | undefined {
  if (pairs.length === 1 && pairs[0].forwardFlat) return pairs[0].forwardFlat;
  // Pure axis measurements were inconsistent; retain general dispatch for that subset.
  return pairs.every(pair => pair.forwardNumeric) &&
    pairs.some(pair => pair.forwardNumeric[0] !== 2)
    ? createNumericFlat(pairs.map(pair => pair.forwardNumeric))
    : undefined;
}
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

/** Explicit forward/reverse operations; no CRS/epoch inference or string pipeline parser.
 * General execution reuses guarded scratch; specialized flat stages use numeric
 * locals and never allocate coordinate arrays inside the flat loop. M and additional ordinates are preserved, never interpreted.
 */
export class ProjectionPipeline<P extends Registration = ProjectionPlugin> {
  readonly input: PipelineCoordinateSystem;
  readonly output: PipelineCoordinateSystem;
  private readonly forwardFactories: Factory[] = [];
  private readonly inverseFactories: Factory[] = [];
  private stackSize = 0;
  private readonly coordinateScratch = new ProjectionScratch();
  private coordinateStack?: Float64Array;
  private readonly required: Registration[] = [];
  private readonly deferred: boolean;
  private requiresZ = false;
  private requiresEpoch = false;
  private compiled?: {
    forward: Operation[];
    inverse: Operation[];
    forwardFlat?: NumericFlatOperation;
    inverseFlat?: NumericFlatOperation;
  };
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
    const state: State = {space, units: [...units] as State['units'], stacks: [[], [], []]};
    const projections = [...(options.projections || [])];
    this.deferred = projections.some(projection => !('create' in projection));
    // Each direction has its own validated metadata and stack layout. Share equation
    // implementations by step so custom plugin factories still run once per step.
    const caches = options.steps.map(() => ({}) as {pair?: Pair});
    for (const [index, step] of options.steps.entries()) {
      for (const name of ['inverse', 'omitForward', 'omitInverse'] as const)
        if (step?.[name] !== undefined && typeof step[name] !== 'boolean')
          throw new Error('Invalid pipeline ' + name + ' flag');
      if (step?.omitForward && step.omitInverse)
        throw new Error('A pipeline step cannot omit both directions');
      if (!step?.omitForward)
        this.forwardFactories.push(
          this.prepare(step, state, {...options, projections}, caches[index])
        );
    }
    this.balanced(state);
    this.output = Object.freeze({
      space: state.space,
      units: Object.freeze([...state.units]) as PipelineCoordinateSystem['units']
    });
    const reverse: State = {space: state.space, units: [...state.units], stacks: [[], [], []]};
    for (let index = options.steps.length - 1; index >= 0; index--) {
      const step = options.steps[index];
      if (!step.omitInverse)
        this.inverseFactories.push(
          this.prepare(
            {...step, inverse: !step.inverse},
            reverse,
            {...options, projections},
            caches[index]
          )
        );
    }
    this.balanced(reverse);
    if (reverse.space !== space || reverse.units.some((unit, index) => unit !== units[index]))
      throw new Error('Inverse pipeline output does not match declared input space/units');
    if (this.required.every(projection => getLoadedProjection(projection))) this.compile();
    this.project = this.project.bind(this);
    this.unproject = this.unproject.bind(this);
    this.projectSync = this.projectSync.bind(this);
    this.unprojectSync = this.unprojectSync.bind(this);
    this.projectTo = this.projectTo.bind(this);
    this.unprojectTo = this.unprojectTo.bind(this);
    this.projectToSync = this.projectToSync.bind(this);
    this.unprojectToSync = this.unprojectToSync.bind(this);
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
  project(coordinate: readonly number[], epoch?: number): Result<P, number[]> {
    return (
      this.deferred
        ? this.preload().then(() => this.projectSync(coordinate, epoch))
        : this.projectSync(coordinate, epoch)
    ) as Result<P, number[]>;
  }
  unproject(coordinate: readonly number[], epoch?: number): Result<P, number[]> {
    return (
      this.deferred
        ? this.preload().then(() => this.unprojectSync(coordinate, epoch))
        : this.unprojectSync(coordinate, epoch)
    ) as Result<P, number[]>;
  }
  /** Reuse a scalar output; the epoch remains separate from all coordinate ordinates. */
  projectTo<T extends ProjectionOutput>(
    coordinate: ProjectionCoordinate,
    output: T,
    epoch?: number
  ): Result<P, T> {
    return (
      this.deferred
        ? this.scalarToLoaded(coordinate, output, false, epoch)
        : this.projectToSync(coordinate, output, epoch)
    ) as Result<P, T>;
  }
  unprojectTo<T extends ProjectionOutput>(
    coordinate: ProjectionCoordinate,
    output: T,
    epoch?: number
  ): Result<P, T> {
    return (
      this.deferred
        ? this.scalarToLoaded(coordinate, output, true, epoch)
        : this.unprojectToSync(coordinate, output, epoch)
    ) as Result<P, T>;
  }
  projectToSync<T extends ProjectionOutput>(
    coordinate: ProjectionCoordinate,
    output: T,
    epoch?: number
  ): T {
    validateScalarOutput(coordinate, output, coordinate.length);
    return this.scalar(coordinate, false, epoch, output);
  }
  unprojectToSync<T extends ProjectionOutput>(
    coordinate: ProjectionCoordinate,
    output: T,
    epoch?: number
  ): T {
    validateScalarOutput(coordinate, output, coordinate.length);
    return this.scalar(coordinate, true, epoch, output);
  }
  private scalarToLoaded<T extends ProjectionOutput>(
    coordinate: ProjectionCoordinate,
    output: T,
    inverse: boolean,
    epoch?: number
  ): Promise<T> {
    validateScalarOutput(coordinate, output, coordinate.length);
    const input = coordinate.slice();
    return this.preload().then(() =>
      inverse
        ? this.unprojectToSync(input, output, epoch)
        : this.projectToSync(input, output, epoch)
    );
  }
  projectFlat<T extends ProjectionArray>(
    coordinates: T,
    dimension = 2,
    epochs?: PipelineEpochs
  ): Result<P, T> {
    return (
      this.deferred
        ? this.preload().then(() => this.projectFlatSync(coordinates, dimension, epochs))
        : this.projectFlatSync(coordinates, dimension, epochs)
    ) as Result<P, T>;
  }
  unprojectFlat<T extends ProjectionArray>(
    coordinates: T,
    dimension = 2,
    epochs?: PipelineEpochs
  ): Result<P, T> {
    return (
      this.deferred
        ? this.preload().then(() => this.unprojectFlatSync(coordinates, dimension, epochs))
        : this.unprojectFlatSync(coordinates, dimension, epochs)
    ) as Result<P, T>;
  }
  projectSync(coordinate: readonly number[], epoch?: number): number[] {
    return this.scalar(coordinate, false, epoch);
  }
  unprojectSync(coordinate: readonly number[], epoch?: number): number[] {
    return this.scalar(coordinate, true, epoch);
  }
  projectFlatSync<T extends ProjectionArray>(
    coordinates: T,
    dimension = 2,
    epochs?: PipelineEpochs
  ): T {
    return this.flat(coordinates, dimension, false, epochs);
  }
  unprojectFlatSync<T extends ProjectionArray>(
    coordinates: T,
    dimension = 2,
    epochs?: PipelineEpochs
  ): T {
    return this.flat(coordinates, dimension, true, epochs);
  }

  private compile(): void {
    if (this.compiled) return;
    for (const registration of this.required)
      if (!getLoadedProjection(registration))
        unsupportedStage('Pipeline projection requires preload(): ' + registration.name);
    const forward = this.forwardFactories.map(factory => factory()),
      inverse = this.inverseFactories.map(factory => factory());
    this.compiled = {
      forward: forward.map(pair => pair.forward),
      inverse: inverse.map(pair => pair.forward),
      forwardFlat: compileFlat(forward),
      inverseFlat: compileFlat(inverse)
    };
  }
  private operations(inverse: boolean): Operation[] {
    this.compile();
    return inverse ? this.compiled.inverse : this.compiled.forward;
  }
  private scalar<T extends ProjectionOutput = number[]>(
    coordinate: ProjectionCoordinate,
    inverse: boolean,
    epoch?: number,
    output?: T
  ): T {
    this.coordinateEpoch(epoch);
    if (coordinate.length < (this.requiresZ ? 3 : 2))
      throw new Error('Pipeline requires ' + (this.requiresZ ? 'XYZ' : 'XY') + ' coordinates');
    const operations = this.operations(inverse);
    const point = this.coordinateScratch.acquire();
    try {
      point.x = coordinate[0];
      point.y = coordinate[1];
      point.z = coordinate.length >= 3 ? coordinate[2] : 0;
      let stack: Float64Array = EMPTY_STACK;
      if (this.stackSize) {
        if (point === this.coordinateScratch.point) {
          this.coordinateStack ||= new Float64Array(this.stackSize);
          stack = this.coordinateStack;
        } else {
          stack = new Float64Array(this.stackSize);
        }
      }
      this.run(point, operations, stack, epoch);
      if (output) return writeScalarOutput(coordinate, output, point, coordinate.length);
      const result = [...coordinate];
      result[0] = point.x;
      result[1] = point.y;
      if (coordinate.length >= 3) result[2] = point.z;
      return result as T;
    } finally {
      this.coordinateScratch.release(point);
    }
  }
  private flat<T extends ProjectionArray>(
    coordinates: T,
    dimension: number,
    inverse: boolean,
    epochs?: PipelineEpochs
  ): T {
    if (
      !(coordinates instanceof Float32Array || coordinates instanceof Float64Array) ||
      !Number.isSafeInteger(dimension) ||
      dimension < (this.requiresZ ? 3 : 2) ||
      coordinates.length % dimension
    )
      throw new Error('Pipeline requires Float32Array/Float64Array and a valid XY/XYZ stride');
    if (epochs === undefined) this.coordinateEpoch(undefined);
    else if (typeof epochs === 'number') this.coordinateEpoch(epochs);
    else {
      if (
        !(epochs instanceof Float32Array || epochs instanceof Float64Array) ||
        epochs.length !== coordinates.length / dimension
      )
        throw new Error('Epoch buffer requires one Float32/Float64 value per coordinate record');
      if (
        epochs.byteOffset < coordinates.byteOffset + coordinates.byteLength &&
        coordinates.byteOffset < epochs.byteOffset + epochs.byteLength &&
        (epochs.buffer === coordinates.buffer ||
          (sharedBuffer(epochs.buffer) && sharedBuffer(coordinates.buffer)))
      )
        throw new Error('Epoch and coordinate buffers must not overlap or alias shared storage');
    }
    const operations = this.operations(inverse);
    const specialized = inverse ? this.compiled.inverseFlat : this.compiled.forwardFlat;
    if (specialized) {
      specialized(coordinates, dimension, epochs);
      return coordinates;
    }
    const point = this.coordinateScratch.acquire();
    try {
      const float32 = coordinates instanceof Float32Array;
      let stack: Float64Array = EMPTY_STACK;
      if (this.stackSize) {
        if (point === this.coordinateScratch.point) {
          this.coordinateStack ||= new Float64Array(this.stackSize);
          stack = this.coordinateStack;
        } else stack = new Float64Array(this.stackSize);
      }
      const epochBuffer = typeof epochs === 'number' ? undefined : epochs;
      let epoch = typeof epochs === 'number' ? epochs : undefined;
      for (let i = 0; i < coordinates.length; i += dimension) {
        point.x = coordinates[i];
        point.y = coordinates[i + 1];
        point.z = dimension >= 3 ? coordinates[i + 2] : 0;
        if (epochBuffer) {
          epoch = epochBuffer[i / dimension];
          this.coordinateEpoch(epoch);
        }
        this.run(point, operations, stack, epoch);
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
    } finally {
      this.coordinateScratch.release(point);
    }
  }
  private coordinateEpoch(epoch: number | undefined): void {
    if (epoch === undefined) {
      if (this.requiresEpoch) throw new Error('Pipeline requires an explicit coordinate epoch');
    } else if (typeof epoch !== 'number' || !Number.isFinite(epoch))
      throw new Error('Coordinate epoch must be a finite decimal year');
  }
  private run(
    point: ProjectionPoint,
    operations: readonly Operation[],
    stack: Float64Array,
    epoch?: number
  ): void {
    finite(point);
    for (const operation of operations) {
      operation(point, stack, epoch);
      finite(point);
    }
  }
  private balanced(state: State): void {
    if (state.stacks.some(stack => stack.length))
      throw new Error('Pipeline stack has unbalanced push/pop operations');
  }
  private prepare(
    step: PipelineStep,
    state: State,
    options: ProjectionPipelineOptions<Registration>,
    cache: {pair?: Pair}
  ): Factory {
    const allowed: Record<PipelineStep['type'], string[]> = {
      unitconvert: ['xy', 'z'],
      axisswap: ['order'],
      projection: ['name', 'parameters', 'output'],
      cart: ['ellipsoid'],
      helmert: [
        'translation',
        'rotation',
        'scalePPM',
        'convention',
        'exact',
        'referenceEpoch',
        'rates'
      ],
      deformation: ['model', 'sourceEpoch', 'targetEpoch'],
      push: ['components'],
      pop: ['components'],
      hgridshift: ['grids'],
      vgridshift: ['grids', 'multiplier']
    };
    if (!step || !own(allowed, step.type))
      unsupportedStage('Unsupported pipeline operation: ' + step?.type);
    keys(step, ['type', 'inverse', 'omitForward', 'omitInverse', ...allowed[step.type]]);
    if (step.inverse !== undefined && typeof step.inverse !== 'boolean')
      throw new Error('Invalid pipeline inverse flag');
    const inverse = Boolean(step.inverse);
    const orient = (pair: Pair): Pair =>
      inverse
        ? {
            forward: pair.inverse,
            inverse: pair.forward,
            forwardNumeric: pair.inverseNumeric,
            inverseNumeric: pair.forwardNumeric,
            forwardFlat: pair.inverseFlat,
            inverseFlat: pair.forwardFlat
          }
        : pair;
    const pair =
      (
        forward: Operation,
        backward: Operation,
        forwardNumeric?: NumericStep,
        inverseNumeric?: NumericStep,
        forwardFlat?: NumericFlatOperation,
        inverseFlat?: NumericFlatOperation
      ): Factory =>
      () => {
        cache.pair ||= {
          forward,
          inverse: backward,
          forwardNumeric,
          inverseNumeric,
          forwardFlat,
          inverseFlat
        };
        return orient(cache.pair);
      };
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
        const [xScale, yScale, zScale] = scale;
        return pair(
          p => {
            p.x *= xScale;
            p.y *= yScale;
            p.z *= zScale;
          },
          p => {
            p.x /= xScale;
            p.y /= yScale;
            p.z /= zScale;
          },
          [0, xScale, yScale, zScale],
          [1, xScale, yScale, zScale]
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
        const operation = (indices: number[]): Operation => {
          const [a, b, c] = indices.map(Math.abs);
          const [sx, sy, sz] = indices.map(Math.sign);
          return p => {
            const {x, y, z} = p;
            p.x = sx * (a === 1 ? x : a === 2 ? y : z);
            p.y = sy * (b === 1 ? x : b === 2 ? y : z);
            p.z = sz * (c === 1 ? x : c === 2 ? y : z);
          };
        };
        return pair(
          operation(order),
          operation(reverse),
          [2, order[0], order[1], order[2]],
          [2, reverse[0], reverse[1], reverse[2]]
        );
      }
      case 'projection': {
        const output: PipelineProjectionOutput =
          step.output === undefined ? {space: 'projected', unit: 'm'} : {...step.output};
        keys(output, ['space', 'unit']);
        if (
          output.space === 'geographic'
            ? !['rad', 'deg'].includes(output.unit)
            : output.space !== 'projected' || output.unit !== 'm'
        )
          throw new Error('Invalid projection output space/unit contract');
        requireState(
          inverse ? output.space : 'geographic',
          inverse ? [output.unit, output.unit] : ['rad', 'rad']
        );
        state.space = inverse ? 'geographic' : output.space;
        state.units[0] = state.units[1] = inverse ? 'rad' : output.unit;
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
        const oblique = key(registration.name) === 'obtran';
        const geographicChild = ['longlat', 'latlong', 'latlon', 'lonlat', 'identity'].includes(
          key(parameters['o_proj'] || '')
        );
        if (oblique && (!step.output || !parameters['o_proj']))
          unsupportedStage(
            'Oblique helper pipelines require an explicit output-unit contract and o_proj'
          );
        if ((oblique && geographicChild) !== (output.space === 'geographic'))
          throw new Error('Projection output contract does not match its algorithm');
        const scale = geographicChild && output.unit === 'rad' ? Math.PI / 180 : 1;
        const normalized = normalizeCRS(definition(registration.name, parameters));
        if (normalized.kind !== 'projected')
          unsupportedStage('Use a cart step for geocentric conversion');
        return () => {
          if (cache.pair) return orient(cache.pair);
          const plugin = getLoadedProjection(registration);
          if (!plugin)
            unsupportedStage('Pipeline projection requires preload(): ' + registration.name);
          if ((key(plugin.name) === 'obtran') !== oblique)
            unsupportedStage(
              'Pipeline projection requires a matching projected-metre output contract: ' +
                plugin.name
            );
          if (
            [
              'geocent',
              'geocentric',
              'identity',
              'longlat',
              'latlong',
              'latlon',
              'lonlat'
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
            semiMinorAxis: normalized.ellipsoid.semiMinorAxis,
            eccentricitySquared: normalized.ellipsoid.eccentricitySquared
          });
          const forward = projectionOperation(implementation, false),
            backward = projectionOperation(implementation, true);
          cache.pair = oblique
            ? {
                forward: p => {
                  if (Math.abs(p.y) > Math.PI / 2) throw new Error('Invalid geographic latitude');
                  forward(p);
                  p.x *= scale;
                  p.y *= scale;
                },
                inverse: p => {
                  if (geographicChild && Math.abs(p.y) > (output.unit === 'deg' ? 90 : Math.PI / 2))
                    throw new Error('Invalid rotated geographic latitude');
                  p.x /= scale;
                  p.y /= scale;
                  backward(p);
                }
              }
            : {forward, inverse: backward};
          return orient(cache.pair);
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
        if ((step.rotation || step.rates?.rotation) && !step.convention)
          throw new Error('Helmert rotation requires a convention');
        if (
          step.convention !== undefined &&
          !['position_vector', 'coordinate_frame'].includes(step.convention)
        )
          throw new Error('Invalid Helmert convention');
        const scale = step.scalePPM ?? 0;
        if (!Number.isFinite(scale) || scale <= -1e6)
          throw new Error('Helmert requires positive finite scale');
        if (step.exact !== undefined && typeof step.exact !== 'boolean')
          throw new Error('Invalid exact Helmert flag');
        if (step.rates !== undefined) {
          keys(step.rates, ['translation', 'rotation', 'scalePPM']);
          if (
            step.rates.translation === undefined &&
            step.rates.rotation === undefined &&
            step.rates.scalePPM === undefined
          )
            throw new Error('Helmert rates require at least one parameter');
          if (step.rates.translation !== undefined) triple(step.rates.translation);
          if (step.rates.rotation !== undefined) triple(step.rates.rotation);
          if (step.rates.scalePPM !== undefined && !Number.isFinite(step.rates.scalePPM))
            throw new Error('Helmert scale rate must be finite');
          if (typeof step.referenceEpoch !== 'number' || !Number.isFinite(step.referenceEpoch))
            throw new Error('Helmert rates require a finite referenceEpoch');
          this.requiresEpoch = true;
          const operation = createKinematicHelmert(
            step.translation,
            step.rotation || [0, 0, 0],
            scale,
            step.rates,
            step.referenceEpoch,
            step.convention === 'coordinate_frame',
            Boolean(step.exact)
          );
          return pair(
            (p, _stack, epoch) => operation.forward(p, epoch),
            (p, _stack, epoch) => operation.inverse(p, epoch),
            undefined,
            undefined,
            operation.forwardFlat,
            operation.inverseFlat
          );
        }
        if (step.referenceEpoch !== undefined)
          throw new Error('Helmert referenceEpoch requires rates');
        if (step.exact) {
          const exact = createExactHelmert(
            step.translation,
            step.rotation || [0, 0, 0],
            scale,
            step.convention === 'coordinate_frame'
          );
          return pair(
            exact.forward,
            exact.inverse,
            undefined,
            undefined,
            createHelmertFlat(exact.coefficients, false, true),
            createHelmertFlat(exact.coefficients, true, true)
          );
        }
        const sign = step.convention === 'coordinate_frame' ? -1 : 1;
        const values = [
          ...step.translation,
          ...(step.rotation || [0, 0, 0]).map(value => sign * value),
          scale
        ];
        const radians = Math.PI / (180 * 3600);
        const coefficients = [
          (values[3] || 0) * radians,
          (values[4] || 0) * radians,
          (values[5] || 0) * radians,
          0,
          0,
          0,
          0,
          0,
          0,
          values[0],
          values[1],
          values[2],
          1 + (values[6] || 0) / 1e6
        ];
        return pair(
          createHelmert(values, false),
          createHelmert(values, true),
          undefined,
          undefined,
          createHelmertFlat(coefficients, false, false),
          createHelmertFlat(coefficients, true, false)
        );
      }
      case 'deformation': {
        requireState('geocentric', ['m', 'm', 'm']);
        this.requiresZ = true;
        const source = step.sourceEpoch,
          target = step.targetEpoch;
        if (
          (source !== 'coordinate' && (typeof source !== 'number' || !Number.isFinite(source))) ||
          typeof target !== 'number' ||
          !Number.isFinite(target)
        )
          throw new Error('Explicit finite deformation source/target epochs required');
        if (
          !step.model ||
          typeof step.model.forward !== 'function' ||
          typeof step.model.inverse !== 'function'
        )
          throw new Error('Prepared deformation model required');
        this.requiresEpoch ||= source === 'coordinate';
        const forward = step.model.forward.bind(step.model),
          backward = step.model.inverse.bind(step.model);
        return pair(
          (p, _stack, epoch) => forward(p, source === 'coordinate' ? epoch : source, target),
          (p, _stack, epoch) => backward(p, source === 'coordinate' ? epoch : source, target)
        );
      }
      case 'push':
      case 'pop': {
        if (
          !Array.isArray(step.components) ||
          !step.components.length ||
          step.components.some(
            component => !Number.isInteger(component) || component < 1 || component > 3
          ) ||
          new Set(step.components).size !== step.components.length
        )
          throw new Error('Stack components must be distinct ordinates 1, 2 or 3');
        const components = [...step.components];
        this.requiresZ ||= components.includes(3);
        const pushing = (step.type === 'push') !== inverse;
        const entries = components.map(component => {
          const index = component - 1;
          if (pushing) {
            const entry = {unit: state.units[index], space: state.space, slot: this.stackSize++};
            state.stacks[index].push(entry);
            return entry;
          }
          const entry = state.stacks[index].pop();
          if (!entry) throw new Error('Pipeline stack underflow for ordinate ' + component);
          return entry;
        });
        if (!pushing) {
          const horizontal = components
            .map((component, index) => ({component, entry: entries[index]}))
            .filter(({component}) => component < 3);
          const space = horizontal[0]?.entry.space || state.space;
          if (
            horizontal.some(({entry}) => entry.space !== space) ||
            (horizontal.length === 1 && space !== state.space)
          )
            throw new Error('Stack restore would mix horizontal coordinate spaces');
          state.space = space;
          components.forEach((component, index) => {
            state.units[component - 1] = entries[index].unit;
          });
        }
        const save: Operation = (p, stack) => {
          for (let index = 0; index < components.length; index++)
            stack[entries[index].slot] =
              components[index] === 1 ? p.x : components[index] === 2 ? p.y : p.z;
        };
        const restore: Operation = (p, stack) => {
          for (let index = 0; index < components.length; index++) {
            const value = stack[entries[index].slot];
            if (components[index] === 1) p.x = value;
            else if (components[index] === 2) p.y = value;
            else p.z = value;
          }
        };
        // Unlike equations, stack slots are direction-local and must not use the
        // shared pair cache. Their matching push is known at construction.
        return () =>
          pushing ? {forward: save, inverse: restore} : {forward: restore, inverse: save};
      }
      case 'hgridshift': {
        requireState('geographic', ['rad', 'rad']);
        if (typeof step.grids !== 'string') throw new Error('Horizontal grid names required');
        const crs = normalizeCRS(definition('longlat', {nadgrids: step.grids}));
        // Normalization collapses sole null/@null lists to no datum-grid metadata.
        if (!crs.datum.grids)
          return pair(
            () => {},
            () => {}
          );
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
