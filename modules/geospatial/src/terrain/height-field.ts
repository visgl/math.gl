// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  TerrainSampleStatus as Status,
  type HeightFieldProps,
  type TerrainArray,
  type TerrainDiagonal,
  type TerrainRegistration,
  type TerrainSample,
  type TerrainSampleBatch,
  type TerrainSampleOptions
} from './types';

/** A copied, finite height grid with an explicit validity mask and affine metric frame. */
export class HeightField {
  readonly width: number;
  readonly height: number;
  readonly origin: readonly [number, number];
  readonly columnStep: readonly [number, number];
  readonly rowStep: readonly [number, number];
  readonly registration: TerrainRegistration;
  readonly diagonal: TerrainDiagonal;
  readonly heightReference: string;
  readonly heightRange: readonly [number, number] | undefined;
  readonly validCount: number;

  private readonly heights: TerrainArray;
  private readonly validity: Uint8Array;
  private readonly inverse: readonly [number, number, number, number];
  private readonly batchSample = createSample();

  constructor(props: HeightFieldProps) {
    const {width, height, heights, validity, offset = 0, stride = width} = props;
    if (!Number.isSafeInteger(width) || width < 2 || !Number.isSafeInteger(height) || height < 2) {
      throw new Error('HeightField width and height must be integers >= 2');
    }
    if (!isTerrainArray(heights) || (validity !== undefined && !(validity instanceof Uint8Array))) {
      throw new Error(
        'HeightField requires Float32/Float64 heights and an optional Uint8 validity mask'
      );
    }
    if (
      !Number.isSafeInteger(offset) ||
      offset < 0 ||
      !Number.isSafeInteger(stride) ||
      stride < width
    ) {
      throw new Error('HeightField offset must be nonnegative and stride must be >= width');
    }
    const end = offset + (height - 1) * stride + width;
    if (!Number.isSafeInteger(end) || end > heights.length || (validity && end > validity.length)) {
      throw new Error('HeightField input buffers are too small');
    }
    this.width = width;
    this.height = height;
    this.origin = copyVector(props.origin ?? [0, 0]);
    this.columnStep = copyVector(props.columnStep ?? [1, 0]);
    this.rowStep = copyVector(props.rowStep ?? [0, 1]);
    this.registration = props.registration ?? 'vertex';
    this.diagonal = props.diagonal ?? '00-11';
    this.heightReference = props.heightReference ?? 'unknown';
    if (this.registration !== 'vertex' && this.registration !== 'cell') {
      throw new Error('HeightField registration must be vertex or cell');
    }
    if (this.diagonal !== '00-11' && this.diagonal !== '10-01') {
      throw new Error('HeightField diagonal must be 00-11 or 10-01');
    }
    if (typeof this.heightReference !== 'string') {
      throw new Error('HeightField heightReference must be a string');
    }
    const [a, c] = this.columnStep;
    const [b, d] = this.rowStep;
    const determinant = a * d - b * c;
    const scale = Math.hypot(a, c) * Math.hypot(b, d);
    if (!Number.isFinite(determinant) || Math.abs(determinant) <= Number.EPSILON * scale) {
      throw new Error('HeightField grid transform must be finite and nonsingular');
    }
    this.inverse = [d / determinant, -b / determinant, -c / determinant, a / determinant];
    if (!this.inverse.every(Number.isFinite)) {
      throw new Error('HeightField inverse transform must be finite');
    }

    this.heights =
      heights instanceof Float64Array
        ? new Float64Array(width * height)
        : new Float32Array(width * height);
    this.validity = new Uint8Array(width * height);
    let min = Infinity;
    let max = -Infinity;
    let validCount = 0;
    for (let row = 0; row < height; row++) {
      for (let column = 0; column < width; column++) {
        const input = offset + row * stride + column;
        const output = row * width + column;
        const value = heights[input];
        if (Number.isFinite(value) && (!validity || validity[input] !== 0)) {
          this.heights[output] = value;
          this.validity[output] = 1;
          min = Math.min(min, value);
          max = Math.max(max, value);
          validCount++;
        }
      }
    }
    this.validCount = validCount;
    this.heightRange = validCount ? Object.freeze([min, max] as [number, number]) : undefined;
  }

  /** Reads an original grid sample, independently of interpolation footprints. */
  getHeight(column: number, row: number): number | undefined {
    if (
      !Number.isInteger(column) ||
      !Number.isInteger(row) ||
      column < 0 ||
      row < 0 ||
      column >= this.width ||
      row >= this.height
    )
      return undefined;
    const index = row * this.width + column;
    return this.validity[index] ? this.heights[index] : undefined;
  }

  /** Independent, tightly packed copies, suitable for worker transfer or GPU preparation. */
  copyData(): {heights: TerrainArray; validity: Uint8Array} {
    return {heights: this.heights.slice(), validity: this.validity.slice()};
  }

  /** Samples world XY in meters. Supply result to avoid allocating a result object. */
  sample(
    x: number,
    y: number,
    options?: TerrainSampleOptions,
    result = createSample()
  ): TerrainSample {
    resetSample(result, Status.INVALID_INPUT);
    const interpolation = options?.interpolation ?? 'bilinear';
    if (
      interpolation !== 'nearest' &&
      interpolation !== 'bilinear' &&
      interpolation !== 'triangle'
    ) {
      throw new Error('Unknown terrain interpolation');
    }
    if (!Number.isFinite(x) || !Number.isFinite(y)) return result;
    const dx = x - this.origin[0];
    const dy = y - this.origin[1];
    const offset = this.registration === 'cell' ? 0.5 : 0;
    let u = this.inverse[0] * dx + this.inverse[1] * dy - offset;
    let v = this.inverse[2] * dx + this.inverse[3] * dy - offset;
    if (!Number.isFinite(u) || !Number.isFinite(v))
      return resetSample(result, Status.NUMERIC_ERROR);
    // Admit only roundoff-sized excursions at the outer sample endpoints.
    const tolerance = 8 * Number.EPSILON * Math.max(this.width, this.height);
    if (
      u < -tolerance ||
      v < -tolerance ||
      u > this.width - 1 + tolerance ||
      v > this.height - 1 + tolerance
    ) {
      return resetSample(result, Status.OUTSIDE_DOMAIN);
    }
    u = Math.max(0, Math.min(this.width - 1, u));
    v = Math.max(0, Math.min(this.height - 1, v));
    if (interpolation === 'nearest') {
      const value = this.getHeight(Math.floor(u + 0.5), Math.floor(v + 0.5));
      if (value === undefined) return resetSample(result, Status.NO_DATA);
      result.status = Status.VALID;
      result.height = value;
      result.gradientStatus = Status.UNAVAILABLE;
      return result;
    }

    const column = Math.min(Math.floor(u), this.width - 2);
    const row = Math.min(Math.floor(v), this.height - 2);
    u -= column;
    v -= row;
    const a = row * this.width + column;
    const b = a + 1;
    const c = a + this.width;
    const d = c + 1;
    const za = this.heights[a];
    const zb = this.heights[b];
    const zc = this.heights[c];
    const zd = this.heights[d];
    let du: number;
    let dv: number;
    if (interpolation === 'bilinear') {
      if (!this.validity[a] || !this.validity[b] || !this.validity[c] || !this.validity[d]) {
        return resetSample(result, Status.NO_DATA);
      }
      result.height = (1 - v) * ((1 - u) * za + u * zb) + v * ((1 - u) * zc + u * zd);
      du = (1 - v) * (zb - za) + v * (zd - zc);
      dv = (1 - u) * (zc - za) + u * (zd - zb);
    } else if (this.diagonal === '00-11' ? v <= u : u + v <= 1) {
      const last = this.diagonal === '00-11' ? d : c;
      if (!this.validity[a] || !this.validity[b] || !this.validity[last]) {
        return resetSample(result, Status.NO_DATA);
      }
      du = zb - za;
      dv = this.diagonal === '00-11' ? zd - zb : zc - za;
      result.height =
        this.diagonal === '00-11'
          ? (1 - u) * za + (u - v) * zb + v * zd
          : (1 - u - v) * za + u * zb + v * zc;
    } else {
      const first = this.diagonal === '00-11' ? a : b;
      if (!this.validity[first] || !this.validity[c] || !this.validity[d]) {
        return resetSample(result, Status.NO_DATA);
      }
      du = zd - zc;
      dv = this.diagonal === '00-11' ? zc - za : zd - zb;
      result.height =
        this.diagonal === '00-11'
          ? (1 - v) * za + u * zd + (v - u) * zc
          : (1 - v) * zb + (1 - u) * zc + (u + v - 1) * zd;
    }
    if (!Number.isFinite(result.height)) return resetSample(result, Status.NUMERIC_ERROR);
    result.status = Status.VALID;
    const gx = du * this.inverse[0] + dv * this.inverse[2];
    const gy = du * this.inverse[1] + dv * this.inverse[3];
    if (!Number.isFinite(gx) || !Number.isFinite(gy)) {
      result.gradientStatus = Status.NUMERIC_ERROR;
      return result;
    }
    // Scale before normalizing so finite steep gradients cannot overflow the norm.
    const normalScale = Math.max(Math.abs(gx), Math.abs(gy), 1);
    const nx = -gx / normalScale;
    const ny = -gy / normalScale;
    const nz = 1 / normalScale;
    const length = Math.hypot(nx, ny, nz);
    result.gradientStatus = Status.VALID;
    result.gradientX = gx;
    result.gradientY = gy;
    result.normalX = nx / length;
    result.normalY = ny / length;
    result.normalZ = nz / length;
    return result;
  }

  /** Interleaved XY inputs and caller-owned outputs, with no per-sample allocation. */
  sampleBatch(
    positions: TerrainArray,
    output: TerrainSampleBatch,
    options?: TerrainSampleOptions
  ): TerrainSampleBatch {
    validateBatch(positions, output);
    for (let i = 0; i < positions.length / 2; i++) {
      const sample = this.sample(positions[2 * i], positions[2 * i + 1], options, this.batchSample);
      output.heights[i] = sample.height;
      if (!Number.isFinite(output.heights[i])) {
        resetSample(sample, Status.NUMERIC_ERROR);
        output.heights[i] = 0;
      }
      if (output.gradients) {
        output.gradients[2 * i] = sample.gradientX;
        output.gradients[2 * i + 1] = sample.gradientY;
        if (
          !Number.isFinite(output.gradients[2 * i]) ||
          !Number.isFinite(output.gradients[2 * i + 1])
        ) {
          output.gradients[2 * i] = output.gradients[2 * i + 1] = 0;
          sample.gradientStatus = Status.NUMERIC_ERROR;
          sample.normalX = sample.normalY = sample.normalZ = 0;
        }
      }
      if (output.normals) {
        output.normals[3 * i] = sample.normalX;
        output.normals[3 * i + 1] = sample.normalY;
        output.normals[3 * i + 2] = sample.normalZ;
      }
      output.statuses[i] = sample.status;
      if (output.gradientStatuses) output.gradientStatuses[i] = sample.gradientStatus;
    }
    return output;
  }
}

function copyVector(value: readonly [number, number]): readonly [number, number] {
  if (value.length !== 2 || !value.every(Number.isFinite))
    throw new Error('Grid vectors must be finite XY pairs');
  return Object.freeze([value[0], value[1]] as [number, number]);
}

function createSample(): TerrainSample {
  return {
    status: Status.NO_DATA,
    height: 0,
    gradientStatus: Status.NO_DATA,
    gradientX: 0,
    gradientY: 0,
    normalX: 0,
    normalY: 0,
    normalZ: 0
  };
}

function resetSample(result: TerrainSample, status: TerrainSample['status']): TerrainSample {
  result.status = status;
  result.gradientStatus = status;
  result.height =
    result.gradientX =
    result.gradientY =
    result.normalX =
    result.normalY =
    result.normalZ =
      0;
  return result;
}

function isTerrainArray(value: unknown): value is TerrainArray {
  return value instanceof Float32Array || value instanceof Float64Array;
}

function validateBatch(positions: TerrainArray, output: TerrainSampleBatch): void {
  if (!isTerrainArray(positions) || positions.length % 2 !== 0) {
    throw new Error('Terrain batch positions must contain Float32/Float64 XY pairs');
  }
  const count = positions.length / 2;
  const buffers: Array<TerrainArray | Uint8Array> = [positions];
  for (const [key, size] of [
    ['heights', 1],
    ['statuses', 1],
    ['gradients', 2],
    ['normals', 3],
    ['gradientStatuses', 1]
  ] as const) {
    const buffer = output[key];
    if (buffer === undefined && key !== 'heights' && key !== 'statuses') continue;
    const byte = key === 'statuses' || key === 'gradientStatuses';
    if (
      (byte ? !(buffer instanceof Uint8Array) : !isTerrainArray(buffer)) ||
      buffer.length < count * size
    ) {
      throw new Error(`Terrain batch ${key} has an invalid type or insufficient length`);
    }
    for (const other of buffers) {
      if (
        buffer.buffer === other.buffer &&
        buffer.byteOffset < other.byteOffset + other.byteLength &&
        other.byteOffset < buffer.byteOffset + buffer.byteLength
      ) {
        throw new Error('Terrain batch input and output buffers must not overlap');
      }
    }
    buffers.push(buffer);
  }
  if ((output.gradients || output.normals) && !output.gradientStatuses) {
    throw new Error('Terrain batch derivatives require gradientStatuses');
  }
}
