// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {PreparedProjection} from '@math.gl/geospatial/projection/types';

type Buffer = Float32Array | Float64Array;
type Coordinate = readonly number[] | Buffer;
type Output = number[] | Buffer;
type PointOperation = (point: [number, number]) => readonly number[] | null;

export function pointProjection(
  forward: PointOperation,
  inverse: PointOperation
): PreparedProjection {
  function convert(input: Coordinate, operation: PointOperation): number[] {
    if (input.length !== 2 || !Array.from(input).every(Number.isFinite)) {
      throw new Error('Expected two finite coordinates');
    }
    const result = operation([input[0], input[1]]);
    if (!result || result.length !== 2 ||
        !Number.isFinite(result[0]) || !Number.isFinite(result[1])) {
      throw new Error('Point is outside the supported projection domain');
    }
    return [result[0], result[1]];
  }

  function write<T extends Output>(
    input: Coordinate, output: T, operation: PointOperation
  ): T {
    if (output.length < 2) throw new Error('Output needs space for two coordinates');
    const result = convert(input, operation);
    if (output instanceof Float32Array && !result.every(x => Number.isFinite(Math.fround(x)))) {
      throw new Error('Projected coordinate exceeds Float32 range');
    }
    output[0] = result[0];
    output[1] = result[1];
    return output;
  }

  function flat<T extends Buffer>(
    buffer: T, dimension: number, operation: PointOperation
  ): T {
    if (dimension !== 2 || buffer.length % 2 !== 0) {
      throw new Error('Expected a packed XY buffer with dimension 2');
    }
    // Stage all results so an invalid point leaves the input buffer unchanged.
    const result = (buffer instanceof Float32Array
      ? new Float32Array(buffer.length)
      : new Float64Array(buffer.length)) as T;
    for (let i = 0; i < buffer.length; i += 2) {
      const point = convert([buffer[i], buffer[i + 1]], operation);
      result[i] = point[0];
      result[i + 1] = point[1];
      if (!Number.isFinite(result[i]) || !Number.isFinite(result[i + 1])) {
        throw new Error('Projected coordinate exceeds buffer range');
      }
    }
    buffer.set(result);
    return buffer;
  }

  const project = (input: readonly number[]) => convert(input, forward);
  const unproject = (input: readonly number[]) => convert(input, inverse);
  const projectTo = <T extends Output>(input: Coordinate, output: T): T =>
    write(input, output, forward);
  const unprojectTo = <T extends Output>(input: Coordinate, output: T): T =>
    write(input, output, inverse);
  const projectFlat = <T extends Buffer>(buffer: T, dimension = 2): T =>
    flat(buffer, dimension, forward);
  const unprojectFlat = <T extends Buffer>(buffer: T, dimension = 2): T =>
    flat(buffer, dimension, inverse);

  return {
    lossy: false, // No dimensions or CRS components are silently discarded.
    preload: async () => {},
    project, unproject, projectTo, unprojectTo, projectFlat, unprojectFlat,
    projectSync: project, unprojectSync: unproject,
    projectToSync: projectTo, unprojectToSync: unprojectTo,
    projectFlatSync: projectFlat, unprojectFlatSync: unprojectFlat
  };
}
