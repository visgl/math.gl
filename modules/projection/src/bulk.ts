// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original reusable interleaved/column buffer transforms with explicit storage contracts.
import type {ProjectionCoordinate, ProjectionOutput} from './experimental/scalar-output';
import type {ProjectionArray} from './experimental/typescript-projection';
import type {PipelineEpochs} from './experimental/projection-pipeline';

/** ProjectionEngine, Projection or ProjectionPipeline with synchronous reusable outputs.
 * Lazy projections must have been preloaded. Epochs are interpreted by the supplied transform.
 */
export type BulkProjection = {
  projectToSync<T extends ProjectionOutput>(
    coordinate: ProjectionCoordinate,
    result: T,
    epoch?: number
  ): T;
  unprojectToSync<T extends ProjectionOutput>(
    coordinate: ProjectionCoordinate,
    result: T,
    epoch?: number
  ): T;
};
export type ProjectionBufferOptions = {
  projection: BulkProjection;
  dimension?: number;
  /** Element offsets relative to the supplied typed-array views. Default zero. */
  inputOffset?: number;
  outputOffset?: number;
  /** Elements per record; defaults to dimension for interleaved, one for columns. */
  inputStride?: number;
  outputStride?: number;
};
type Scratch = {input: Float64Array; output: Float64Array};
function createScratch(dimension: number): Scratch {
  return {input: new Float64Array(dimension), output: new Float64Array(dimension)};
}
function isBuffer(value: unknown): value is ProjectionArray {
  return value instanceof Float32Array || value instanceof Float64Array;
}
function shared(buffer: ArrayBufferLike): boolean {
  return typeof SharedArrayBuffer !== 'undefined' && buffer instanceof SharedArrayBuffer;
}
function overlap(
  a: ProjectionArray,
  aStart: number,
  aEnd: number,
  b: ProjectionArray,
  bStart: number,
  bEnd: number
): boolean {
  return (
    (a.buffer === b.buffer || (shared(a.buffer) && shared(b.buffer))) &&
    aStart < bEnd &&
    bStart < aEnd
  );
}
function capacity(length: number, offset: number, stride: number, width: number): number {
  return length < offset + width ? 0 : Math.floor((length - offset - width) / stride) + 1;
}

/** Capture a layout once, reuse scratch and output buffers for each batch/chunk.
 * Validation errors write nothing. Coordinate failures preserve the failed record and
 * commit preceding records. Input/output storage must be disjoint or exactly mapped
 * in place; shifted overlap is rejected before transformation. All offsets/counts
 * refer to records/elements of the supplied views, never to the backing buffer.
 */
export class ProjectionBuffer {
  readonly dimension: number;
  private readonly projection: BulkProjection;
  private readonly inputOffset: number;
  private readonly outputOffset: number;
  private readonly inputStride?: number;
  private readonly outputStride?: number;
  private readonly scratch: Scratch[];
  private depth = 0;
  constructor(options: ProjectionBufferOptions) {
    const dimension = options.dimension ?? 2;
    const inputOffset = options.inputOffset ?? 0,
      outputOffset = options.outputOffset ?? 0;
    if (
      !Number.isSafeInteger(dimension) ||
      dimension < 2 ||
      !Number.isSafeInteger(inputOffset) ||
      inputOffset < 0 ||
      !Number.isSafeInteger(outputOffset) ||
      outputOffset < 0 ||
      (options.inputStride !== undefined &&
        (!Number.isSafeInteger(options.inputStride) || options.inputStride < 1)) ||
      (options.outputStride !== undefined &&
        (!Number.isSafeInteger(options.outputStride) || options.outputStride < 1)) ||
      typeof options.projection?.projectToSync !== 'function' ||
      typeof options.projection?.unprojectToSync !== 'function'
    ) {
      throw new Error('Invalid projection buffer transform or layout');
    }
    this.dimension = dimension;
    this.projection = options.projection;
    this.inputOffset = inputOffset;
    this.outputOffset = outputOffset;
    this.inputStride = options.inputStride;
    this.outputStride = options.outputStride;
    this.scratch = [createScratch(dimension)];
  }
  projectFlatTo<T extends ProjectionArray>(
    input: ProjectionArray,
    output: T,
    count?: number,
    start = 0,
    epochs?: PipelineEpochs
  ): T {
    return this.flat(input, output, count, start, false, epochs);
  }
  unprojectFlatTo<T extends ProjectionArray>(
    input: ProjectionArray,
    output: T,
    count?: number,
    start = 0,
    epochs?: PipelineEpochs
  ): T {
    return this.flat(input, output, count, start, true, epochs);
  }
  projectColumnsTo<T extends readonly ProjectionArray[]>(
    input: readonly ProjectionArray[],
    output: T,
    count?: number,
    start = 0,
    epochs?: PipelineEpochs
  ): T {
    return this.columns(input, output, count, start, false, epochs);
  }
  unprojectColumnsTo<T extends readonly ProjectionArray[]>(
    input: readonly ProjectionArray[],
    output: T,
    count?: number,
    start = 0,
    epochs?: PipelineEpochs
  ): T {
    return this.columns(input, output, count, start, true, epochs);
  }
  private range(available: number, count: number | undefined, start: number): number {
    const records = count ?? Math.max(0, available - start);
    if (
      !Number.isSafeInteger(start) ||
      start < 0 ||
      !Number.isSafeInteger(records) ||
      records < 0 ||
      !Number.isSafeInteger(start + records) ||
      start + records > available
    )
      throw new Error('Invalid projection buffer record range');
    return records;
  }
  private epochStorage(epochs: PipelineEpochs | undefined, start: number, count: number): void {
    if (epochs === undefined) return;
    if (typeof epochs === 'number') {
      if (!Number.isFinite(epochs)) throw new Error('Coordinate epoch must be finite');
    } else if (!isBuffer(epochs) || epochs.length < start + count)
      throw new Error('Epoch buffer requires one value per addressed record');
  }
  private aliases(
    input: ProjectionArray,
    output: ProjectionArray,
    start: number,
    count: number,
    inputStride: number,
    outputStride: number,
    width: number
  ): void {
    if (!count) return;
    const ia =
      input.byteOffset + (this.inputOffset + start * inputStride) * input.BYTES_PER_ELEMENT;
    const ib = ia + ((count - 1) * inputStride + width) * input.BYTES_PER_ELEMENT;
    const oa =
      output.byteOffset + (this.outputOffset + start * outputStride) * output.BYTES_PER_ELEMENT;
    const ob = oa + ((count - 1) * outputStride + width) * output.BYTES_PER_ELEMENT;
    const exact =
      input.buffer === output.buffer &&
      input.constructor === output.constructor &&
      ia === oa &&
      inputStride === outputStride;
    if (overlap(input, ia, ib, output, oa, ob) && !exact)
      throw new Error('Projection input/output ranges overlap without an exact in-place mapping');
  }
  private epochAlias(
    epochs: PipelineEpochs | undefined,
    output: ProjectionArray,
    start: number,
    count: number,
    stride: number,
    width: number
  ): void {
    if (typeof epochs !== 'object' || !epochs || !count) return;
    const a = epochs.byteOffset + start * epochs.BYTES_PER_ELEMENT;
    const b = a + count * epochs.BYTES_PER_ELEMENT;
    const c = output.byteOffset + (this.outputOffset + start * stride) * output.BYTES_PER_ELEMENT;
    const d = c + ((count - 1) * stride + width) * output.BYTES_PER_ELEMENT;
    if (overlap(epochs, a, b, output, c, d))
      throw new Error('Epoch and output buffers must not overlap');
  }
  private acquire(): Scratch {
    const depth = this.depth++;
    this.scratch[depth] ||= createScratch(this.dimension);
    return this.scratch[depth];
  }
  private transform(scratch: Scratch, inverse: boolean, epoch: number | undefined): void {
    if (epoch !== undefined && !Number.isFinite(epoch))
      throw new Error('Coordinate epoch must be finite');
    if (inverse) this.projection.unprojectToSync(scratch.input, scratch.output, epoch);
    else this.projection.projectToSync(scratch.input, scratch.output, epoch);
  }
  private floatRange(result: Float64Array, float32: boolean): void {
    // Nonfinite M/payload is allowed, but finite values must fit the output type.
    for (let i = 0; i < this.dimension; i++) {
      const value = result[i];
      if (
        (i < 3 && !Number.isFinite(value)) ||
        (float32 && Number.isFinite(value) && Math.abs(value) > 3.4028234663852886e38)
      )
        throw new Error('Projection output is nonfinite or exceeds Float32 range');
    }
  }
  private flat<T extends ProjectionArray>(
    input: ProjectionArray,
    output: T,
    count: number | undefined,
    start: number,
    inverse: boolean,
    epochs?: PipelineEpochs
  ): T {
    if (!isBuffer(input) || !isBuffer(output))
      throw new Error('Projection buffers require Float32Array or Float64Array');
    const inputStride = this.inputStride ?? this.dimension,
      outputStride = this.outputStride ?? this.dimension;
    if (inputStride < this.dimension || outputStride < this.dimension)
      throw new Error('Interleaved stride must contain every ordinate');
    const records = this.range(
      capacity(input.length, this.inputOffset, inputStride, this.dimension),
      count,
      start
    );
    if (start + records > capacity(output.length, this.outputOffset, outputStride, this.dimension))
      throw new Error('Projection output buffer is too short');
    this.epochStorage(epochs, start, records);
    this.aliases(input, output, start, records, inputStride, outputStride, this.dimension);
    this.epochAlias(epochs, output, start, records, outputStride, this.dimension);
    const scratch = this.acquire();
    try {
      const epochBuffer = typeof epochs === 'number' ? undefined : epochs;
      const float32 = output instanceof Float32Array;
      for (let record = start; record < start + records; record++) {
        const source = this.inputOffset + record * inputStride,
          target = this.outputOffset + record * outputStride;
        for (let i = 0; i < this.dimension; i++) scratch.input[i] = input[source + i];
        this.transform(
          scratch,
          inverse,
          epochBuffer ? epochBuffer[record] : (epochs as number | undefined)
        );
        this.floatRange(scratch.output, float32);
        for (let i = 0; i < this.dimension; i++) output[target + i] = scratch.output[i];
      }
      return output;
    } finally {
      this.depth--;
    }
  }
  private columns<T extends readonly ProjectionArray[]>(
    input: readonly ProjectionArray[],
    output: T,
    count: number | undefined,
    start: number,
    inverse: boolean,
    epochs?: PipelineEpochs
  ): T {
    if (input.length !== this.dimension || output.length !== this.dimension)
      throw new Error('Projection columns must match dimension');
    const inputStride = this.inputStride ?? 1,
      outputStride = this.outputStride ?? 1;
    let available = Number.MAX_SAFE_INTEGER;
    for (let i = 0; i < this.dimension; i++) {
      if (!isBuffer(input[i]) || !isBuffer(output[i]))
        throw new Error('Projection columns require floating typed arrays');
      available = Math.min(available, capacity(input[i].length, this.inputOffset, inputStride, 1));
    }
    const records = this.range(available, count, start);
    this.epochStorage(epochs, start, records);
    for (let i = 0; i < this.dimension; i++) {
      if (start + records > capacity(output[i].length, this.outputOffset, outputStride, 1))
        throw new Error('Projection output column is too short');
      this.epochAlias(epochs, output[i], start, records, outputStride, 1);
      for (let j = 0; j < this.dimension; j++)
        this.aliases(input[i], output[j], start, records, inputStride, outputStride, 1);
      for (let j = 0; j < i && records; j++) {
        const a =
          output[i].byteOffset +
          (this.outputOffset + start * outputStride) * output[i].BYTES_PER_ELEMENT;
        const b =
          output[j].byteOffset +
          (this.outputOffset + start * outputStride) * output[j].BYTES_PER_ELEMENT;
        if (
          overlap(
            output[i],
            a,
            a + ((records - 1) * outputStride + 1) * output[i].BYTES_PER_ELEMENT,
            output[j],
            b,
            b + ((records - 1) * outputStride + 1) * output[j].BYTES_PER_ELEMENT
          )
        )
          throw new Error('Projection output columns overlap');
      }
    }
    const scratch = this.acquire();
    try {
      const epochBuffer = typeof epochs === 'number' ? undefined : epochs;
      for (let record = start; record < start + records; record++) {
        const source = this.inputOffset + record * inputStride,
          target = this.outputOffset + record * outputStride;
        for (let i = 0; i < this.dimension; i++) scratch.input[i] = input[i][source];
        this.transform(
          scratch,
          inverse,
          epochBuffer ? epochBuffer[record] : (epochs as number | undefined)
        );
        for (let i = 0; i < this.dimension; i++) {
          const value = scratch.output[i];
          if (
            (i < 3 && !Number.isFinite(value)) ||
            (output[i] instanceof Float32Array &&
              Number.isFinite(value) &&
              Math.abs(value) > 3.4028234663852886e38)
          )
            throw new Error('Projection output is nonfinite or exceeds Float32 range');
        }
        for (let i = 0; i < this.dimension; i++) output[i][target] = scratch.output[i];
      }
      return output;
    } finally {
      this.depth--;
    }
  }
}
