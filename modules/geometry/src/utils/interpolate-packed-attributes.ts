// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Scalar storage formats supported by packed attribute interpolation. */
export type PackedAttributeType =
  | 'int8'
  | 'uint8'
  | 'int16'
  | 'uint16'
  | 'int32'
  | 'uint32'
  | 'float32'
  | 'float64';

/** Interpolate numeric values, or require identical values at every contributing vertex. */
export type PackedAttributeInterpolation = 'linear' | 'flat';

/** One explicitly described attribute inside an interleaved vertex record. */
export type PackedAttribute = {
  /** Scalar storage format; values are interpolated in the encoded domain. */
  type: PackedAttributeType;
  /** Number of scalar components. */
  size: number;
  /** Byte offset within each record; unaligned offsets are supported. */
  byteOffset: number;
  /** Policy for the whole attribute, or one explicit policy per component. */
  interpolation: PackedAttributeInterpolation | readonly PackedAttributeInterpolation[];
};

/** Three original source indices and corresponding weights per output vertex. */
export type AttributeInterpolationProvenance = {
  /** Indices into the original source records, matching polygon subdivision provenance. */
  sourceVertexIndices: ArrayLike<number>;
  /** Nonnegative finite weights summing to one per triplet; zero-weight indices are ignored. */
  sourceVertexWeights: ArrayLike<number>;
};

/** Byte layout, interpolation policies and output allocation limit. */
export type PackedAttributeInterpolationOptions = {
  /** Positive byte length of a source and output vertex record. */
  byteStride: number;
  /** Nonoverlapping attribute ranges. Unlisted bytes are copied from the first contributor. */
  attributes: readonly PackedAttribute[];
  /** Byte order for multibyte components. Default true. */
  littleEndian?: boolean;
  /** Maximum allocated output byte length. Default 64 MiB; zero permits empty output only. */
  maxOutputBytes?: number;
};

const BYTE_SIZES: Record<PackedAttributeType, number> = {
  int8: 1,
  uint8: 1,
  int16: 2,
  uint16: 2,
  int32: 4,
  uint32: 4,
  float32: 4,
  float64: 8
};

/** Reconstruct interleaved attributes from subdivision's original-vertex provenance.
 * Inputs are never modified. Linear integer components use Math.round once at final output;
 * this is deliberately not repeated midpoint quantization. Flat components reject differing
 * contributing values instead of guessing categorical semantics. Padding and unlisted bytes
 * come from the first positive-weight contributor. Normals are not renormalized, and normalized
 * GPU formats are not decoded. Duplicate source records at attribute seams before subdivision.
 * @throws RangeError For invalid layout, provenance, nonfinite values or allocation limits.
 */
export function interpolatePackedAttributes(
  source: Uint8Array,
  provenance: AttributeInterpolationProvenance,
  options: PackedAttributeInterpolationOptions
): Uint8Array {
  const {byteStride, attributes, littleEndian = true, maxOutputBytes = 64 * 1024 * 1024} = options;
  const {sourceVertexIndices, sourceVertexWeights} = provenance;
  if (
    !Number.isSafeInteger(byteStride) ||
    byteStride <= 0 ||
    source.byteLength % byteStride ||
    !Array.isArray(options.attributes) ||
    typeof littleEndian !== 'boolean' ||
    !Number.isSafeInteger(maxOutputBytes) ||
    maxOutputBytes < 0 ||
    !Number.isSafeInteger(sourceVertexIndices.length) ||
    sourceVertexIndices.length < 0 ||
    sourceVertexIndices.length % 3 ||
    sourceVertexIndices.length !== sourceVertexWeights.length
  ) {
    throw new RangeError('Invalid packed attribute layout or provenance lengths');
  }
  const outputCount = sourceVertexIndices.length / 3;
  const outputBytes = outputCount * byteStride;
  if (!Number.isSafeInteger(outputBytes) || outputBytes > maxOutputBytes) {
    throw new RangeError('Packed attribute interpolation exceeded maxOutputBytes');
  }
  const ranges: [number, number][] = [];
  for (const attribute of attributes) {
    if (
      !attribute ||
      typeof attribute !== 'object' ||
      !Object.prototype.hasOwnProperty.call(BYTE_SIZES, attribute.type) ||
      !Number.isSafeInteger(attribute.size) ||
      attribute.size <= 0 ||
      !Number.isSafeInteger(attribute.byteOffset) ||
      attribute.byteOffset < 0
    ) {
      throw new RangeError('Invalid packed attribute descriptor');
    }
    const end = attribute.byteOffset + attribute.size * BYTE_SIZES[attribute.type];
    if (
      !Number.isSafeInteger(end) ||
      end > byteStride ||
      ranges.some(([start, previousEnd]) => attribute.byteOffset < previousEnd && end > start)
    ) {
      throw new RangeError('Packed attribute ranges must fit the stride and not overlap');
    }
    ranges.push([attribute.byteOffset, end]);
    if (typeof attribute.interpolation === 'string') {
      validateInterpolation(attribute.interpolation);
    } else {
      if (
        !Array.isArray(attribute.interpolation) ||
        attribute.interpolation.length !== attribute.size
      ) {
        throw new RangeError('Expected one interpolation policy per component');
      }
      for (let component = 0; component < attribute.size; component++) {
        validateInterpolation(attribute.interpolation[component]);
      }
    }
  }
  const sourceCount = source.byteLength / byteStride;
  const input = new DataView(source.buffer, source.byteOffset, source.byteLength);
  const output = new Uint8Array(outputBytes);
  const result = new DataView(output.buffer);
  for (let vertex = 0; vertex < outputCount; vertex++) {
    let sum = 0;
    let firstSource = -1;
    let contributors = 0;
    for (let slot = 0; slot < 3; slot++) {
      const weight = sourceVertexWeights[vertex * 3 + slot];
      const index = sourceVertexIndices[vertex * 3 + slot];
      if (
        !Number.isFinite(weight) ||
        weight < 0 ||
        weight > 1 ||
        (weight > 0 && (!Number.isSafeInteger(index) || index < 0 || index >= sourceCount))
      ) {
        throw new RangeError('Invalid contributing source index or interpolation weight');
      }
      if (weight > 0) {
        contributors++;
        if (firstSource < 0) firstSource = index;
      }
      sum += weight;
    }
    if (firstSource < 0 || Math.abs(sum - 1) > 1e-10) {
      throw new RangeError('Interpolation weights must sum to one');
    }
    output.set(
      source.subarray(firstSource * byteStride, (firstSource + 1) * byteStride),
      vertex * byteStride
    );
    for (const attribute of attributes) {
      for (let component = 0; component < attribute.size; component++) {
        const offset = attribute.byteOffset + component * BYTE_SIZES[attribute.type];
        const policy =
          typeof attribute.interpolation === 'string'
            ? attribute.interpolation
            : attribute.interpolation[component];
        const firstValue = readComponent(
          input,
          firstSource * byteStride + offset,
          attribute.type,
          littleEndian
        );
        let value = 0;
        for (let slot = 0; slot < 3; slot++) {
          const weight = sourceVertexWeights[vertex * 3 + slot];
          if (weight === 0) continue;
          const sourceValue = readComponent(
            input,
            sourceVertexIndices[vertex * 3 + slot] * byteStride + offset,
            attribute.type,
            littleEndian
          );
          if (!Number.isFinite(sourceValue))
            throw new RangeError('Packed attributes must be finite');
          if (policy === 'flat' && sourceValue !== firstValue) {
            throw new RangeError('Flat attribute contributors must agree');
          }
          value += sourceValue * weight;
        }
        if (policy === 'linear') {
          if (!Number.isFinite(value))
            throw new RangeError('Interpolated attributes must be finite');
          // Identity provenance preserves every original encoded bit, including signed zero.
          if (contributors !== 1 || sum !== 1) {
            writeComponent(
              result,
              vertex * byteStride + offset,
              attribute.type,
              value,
              littleEndian
            );
          }
        }
      }
    }
  }
  return output;
}

/** Reject implicit or unknown interpolation semantics. */
function validateInterpolation(interpolation: unknown): void {
  if (interpolation !== 'linear' && interpolation !== 'flat') {
    throw new RangeError('Expected linear or flat interpolation');
  }
}

/** Read an encoded scalar relative to the source view, including its byte offset. */
function readComponent(
  view: DataView,
  offset: number,
  type: PackedAttributeType,
  littleEndian: boolean
): number {
  switch (type) {
    case 'int8':
      return view.getInt8(offset);
    case 'uint8':
      return view.getUint8(offset);
    case 'int16':
      return view.getInt16(offset, littleEndian);
    case 'uint16':
      return view.getUint16(offset, littleEndian);
    case 'int32':
      return view.getInt32(offset, littleEndian);
    case 'uint32':
      return view.getUint32(offset, littleEndian);
    case 'float32':
      return view.getFloat32(offset, littleEndian);
    case 'float64':
      return view.getFloat64(offset, littleEndian);
  }
}

/** Write one final interpolated scalar, rounding integer encodings consistently. */
function writeComponent(
  view: DataView,
  offset: number,
  type: PackedAttributeType,
  value: number,
  littleEndian: boolean
): void {
  const integer = Math.round(value);
  switch (type) {
    case 'int8':
      view.setInt8(offset, integer);
      break;
    case 'uint8':
      view.setUint8(offset, integer);
      break;
    case 'int16':
      view.setInt16(offset, integer, littleEndian);
      break;
    case 'uint16':
      view.setUint16(offset, integer, littleEndian);
      break;
    case 'int32':
      view.setInt32(offset, integer, littleEndian);
      break;
    case 'uint32':
      view.setUint32(offset, integer, littleEndian);
      break;
    case 'float32':
      view.setFloat32(offset, value, littleEndian);
      break;
    case 'float64':
      view.setFloat64(offset, value, littleEndian);
      break;
  }
}
