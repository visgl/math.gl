// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {NumericArray} from '@math.gl/core/types';
import type {GeodesicLine} from './ellipsoid-geodesic';
import type {RhumbLine} from './ellipsoid-rhumb';
export const GEODESIC_BUFFER_FIELDS = Object.freeze([
  'lat2',
  'lon2',
  'azi2',
  's12',
  'a12',
  'm12',
  'M12',
  'M21'
] as const);
export const RHUMB_BUFFER_FIELDS = Object.freeze(['lat2', 'lon2', 'azi12', 's12'] as const);
type Result = {[key: string]: number | undefined};
function shared(value: unknown): boolean {
  return (
    ArrayBuffer.isView(value) &&
    typeof SharedArrayBuffer !== 'undefined' &&
    value.buffer instanceof SharedArrayBuffer
  );
}
class LineBuffer {
  readonly capacity: number;
  readonly fields: readonly string[];
  readonly stride: number;
  private readonly stage: Float64Array;
  private readonly scratch: Result = {};
  private readonly control = {busy: false};
  constructor(
    private readonly evaluate: (distance: number, output: Result) => Result,
    capacity: number,
    fields: readonly string[]
  ) {
    if (!Number.isSafeInteger(capacity) || capacity < 0 || capacity > 1e6)
      throw new RangeError('Buffer capacity must be in [0,1000000]');
    this.capacity = capacity;
    this.fields = Object.freeze([...fields]);
    this.stride = fields.length;
    this.stage = new Float64Array(capacity * this.stride);
    Object.freeze(this);
  }
  /** Atomically write interleaved rows; input/output aliasing is supported. */
  positions(distances: Readonly<NumericArray>, output: Float64Array): Float64Array {
    if (this.control.busy) throw new RangeError('Packed line samplers are not reentrant');
    this.control.busy = true;
    try {
      return this.write(distances, output);
    } finally {
      this.control.busy = false;
    }
  }
  private write(distances: Readonly<NumericArray>, output: Float64Array): Float64Array {
    const count = distances.length;
    if (
      !Number.isSafeInteger(count) ||
      count < 0 ||
      count > this.capacity ||
      !(output instanceof Float64Array) ||
      output.length < count * this.stride ||
      shared(distances) ||
      shared(output)
    )
      throw new RangeError('Invalid packed line storage');
    for (let i = 0; i < count; i++)
      if (!Number.isFinite(distances[i])) throw new RangeError('Expected finite distances');
    for (let i = 0; i < count; i++) {
      const result = this.evaluate(distances[i], this.scratch);
      for (let field = 0; field < this.stride; field++) {
        const value = result[this.fields[field]];
        if (!Number.isFinite(value))
          throw new RangeError('Line result or requested field is not representable');
        this.stage[i * this.stride + field] = value!;
      }
    }
    for (let i = 0; i < count * this.stride; i++) output[i] = this.stage[i];
    return output;
  }
}
/** Fixed-capacity sampler; prepares staging once and reuses scalar result sinks when available. */
export class GeodesicLineBuffer extends LineBuffer {
  constructor(
    line: Pick<GeodesicLine, 'position'>,
    capacity: number,
    options: {area?: boolean} = {}
  ) {
    if (!line || typeof line.position !== 'function')
      throw new RangeError('Expected a geodesic line');
    const position = line.position.bind(line) as (
      distance: number,
      index?: undefined,
      array?: undefined,
      output?: Result
    ) => Result;
    super(
      (distance, result) => position(distance, undefined, undefined, result),
      capacity,
      options.area ? [...GEODESIC_BUFFER_FIELDS, 'S12'] : GEODESIC_BUFFER_FIELDS
    );
  }
}
export class RhumbLineBuffer extends LineBuffer {
  constructor(line: RhumbLine, capacity: number, options: {area?: boolean} = {}) {
    if (!line || typeof line.position !== 'function') throw new RangeError('Expected a rhumb line');
    const position = line.position.bind(line) as (
      distance: number,
      index?: undefined,
      array?: undefined,
      output?: Result
    ) => Result;
    super(
      (distance, result) => position(distance, undefined, undefined, result),
      capacity,
      options.area ? [...RHUMB_BUFFER_FIELDS, 'S12'] : RHUMB_BUFFER_FIELDS
    );
  }
}
