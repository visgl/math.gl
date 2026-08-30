// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// Derived from Cesium under the Apache 2.0 license.
// https://github.com/CesiumGS/cesium/blob/main/LICENSE.md

import {Vector2, Vector3, assert, clamp, _MathUtils} from '@math.gl/core';

type Vector4 = {x: number; y: number; z: number; w: number};

const RIGHT_SHIFT = 1 / 256;
const LEFT_SHIFT = 256;
const scratchVector2 = new Vector2();
const scratchVector3 = new Vector3();
const scratchEncodeVector2 = new Vector2();
const octEncodeScratch = new Vector2();
const uint8ForceArray = new Uint8Array(1);

function forceUint8(value: number): number {
  uint8ForceArray[0] = value;
  return uint8ForceArray[0];
}

function fromSNorm(value: number, rangeMaximum = 255): number {
  return (clamp(value, 0, rangeMaximum) / rangeMaximum) * 2 - 1;
}

function toSNorm(value: number, rangeMaximum = 255): number {
  return Math.round((clamp(value, -1, 1) * 0.5 + 0.5) * rangeMaximum);
}

function signNotZero(value: number): number {
  return value < 0 ? -1 : 1;
}

/**
 * Encodes a normalized vector into two SNORM values following octahedral encoding.
 *
 * @param vector Normalized vector to encode.
 * @param rangeMaximum Maximum value of the SNORM range.
 * @param result Target for the two encoded components.
 */
export function octEncodeInRange(vector: Vector3, rangeMaximum: number, result: Vector2): Vector2 {
  assert(vector);
  assert(result);
  scratchVector3.from(vector);
  assert(Math.abs(scratchVector3.magnitudeSquared() - 1) <= _MathUtils.EPSILON6);

  const denominator = Math.abs(vector.x) + Math.abs(vector.y) + Math.abs(vector.z);
  result.x = vector.x / denominator;
  result.y = vector.y / denominator;

  if (vector.z < 0) {
    const x = result.x;
    const y = result.y;
    result.x = (1 - Math.abs(y)) * signNotZero(x);
    result.y = (1 - Math.abs(x)) * signNotZero(y);
  }

  result.x = toSNorm(result.x, rangeMaximum);
  result.y = toSNorm(result.y, rangeMaximum);
  return result;
}

/** Encodes a normalized vector into two 8-bit octahedral components. */
export function octEncode(vector: Vector3, result: Vector2): Vector2 {
  return octEncodeInRange(vector, 255, result);
}

/** Encodes a normalized vector into four 8-bit octahedral components. */
export function octEncodeToVector4(vector: Vector3, result: Vector4): Vector4 {
  octEncodeInRange(vector, 65535, octEncodeScratch);
  result.x = forceUint8(octEncodeScratch.x * RIGHT_SHIFT);
  result.y = forceUint8(octEncodeScratch.x);
  result.z = forceUint8(octEncodeScratch.y * RIGHT_SHIFT);
  result.w = forceUint8(octEncodeScratch.y);
  return result;
}

/**
 * Decodes two SNORM octahedral components into a normalized vector.
 *
 * @param x First encoded component.
 * @param y Second encoded component.
 * @param rangeMaximum Maximum value of the SNORM range.
 * @param result Target for the decoded vector.
 */
export function octDecodeInRange(
  x: number,
  y: number,
  rangeMaximum: number,
  result: Vector3
): Vector3 {
  assert(result);
  if (x < 0 || x > rangeMaximum || y < 0 || y > rangeMaximum) {
    throw new Error(`x and y must be unsigned normalized integers between 0 and ${rangeMaximum}`);
  }

  result.x = fromSNorm(x, rangeMaximum);
  result.y = fromSNorm(y, rangeMaximum);
  result.z = 1 - (Math.abs(result.x) + Math.abs(result.y));

  if (result.z < 0) {
    const oldX = result.x;
    result.x = (1 - Math.abs(result.y)) * signNotZero(oldX);
    result.y = (1 - Math.abs(oldX)) * signNotZero(result.y);
  }
  return result.normalize();
}

/** Decodes two 8-bit octahedral components into a normalized vector. */
export function octDecode(x: number, y: number, result: Vector3): Vector3 {
  return octDecodeInRange(x, y, 255, result);
}

/** Decodes four 8-bit octahedral components into a normalized vector. */
export function octDecodeFromVector4(encoded: Vector4, result: Vector3): Vector3 {
  assert(encoded);
  assert(result);
  const {x, y, z, w} = encoded;
  if (x < 0 || x > 255 || y < 0 || y > 255 || z < 0 || z > 255 || w < 0 || w > 255) {
    throw new Error('x, y, z, and w must be unsigned normalized integers between 0 and 255');
  }
  return octDecodeInRange(x * LEFT_SHIFT + y, z * LEFT_SHIFT + w, 65535, result);
}

/** Packs an octahedrally encoded two-component vector into one number. */
export function octPackFloat(encoded: Vector2): number {
  scratchVector2.from(encoded);
  return 256 * scratchVector2.x + scratchVector2.y;
}

/** Encodes a normalized vector into an octahedral representation packed into one number. */
export function octEncodeFloat(vector: Vector3): number {
  octEncode(vector, scratchEncodeVector2);
  return octPackFloat(scratchEncodeVector2);
}

/** Decodes an octahedral representation packed into one number. */
export function octDecodeFloat(value: number, result: Vector3): Vector3 {
  assert(Number.isFinite(value));
  const temporary = value / 256;
  const x = Math.floor(temporary);
  const y = (temporary - x) * 256;
  return octDecode(x, y, result);
}

/** Packs three normalized vectors into two numeric octahedral values. */
export function octPack(
  vector1: Vector3,
  vector2: Vector3,
  vector3: Vector3,
  result: Vector2
): Vector2 {
  assert(vector1);
  assert(vector2);
  assert(vector3);
  assert(result);
  const encoded1 = octEncodeFloat(vector1);
  const encoded2 = octEncodeFloat(vector2);
  const encoded3 = octEncode(vector3, scratchEncodeVector2);
  result.x = 65536 * encoded3.x + encoded1;
  result.y = 65536 * encoded3.y + encoded2;
  return result;
}

/** Decodes three normalized vectors packed by {@link octPack}. */
export function octUnpack(
  packed: Vector2,
  vector1: Vector3,
  vector2: Vector3,
  vector3: Vector3
): void {
  let temporary = packed.x / 65536;
  const x = Math.floor(temporary);
  const encodedFloat1 = (temporary - x) * 65536;
  temporary = packed.y / 65536;
  const y = Math.floor(temporary);
  const encodedFloat2 = (temporary - y) * 65536;
  octDecodeFloat(encodedFloat1, vector1);
  octDecodeFloat(encodedFloat2, vector2);
  octDecode(x, y, vector3);
}

/** Packs two normalized texture coordinates into one number with 12 bits per component. */
export function compressTextureCoordinates(textureCoordinates: Vector2): number {
  const x = (textureCoordinates.x * 4095) | 0;
  const y = (textureCoordinates.y * 4095) | 0;
  return 4096 * x + y;
}

/** Decompresses texture coordinates packed by {@link compressTextureCoordinates}. */
export function decompressTextureCoordinates(compressed: number, result: Vector2): Vector2 {
  const temporary = compressed / 4096;
  const x = Math.floor(temporary);
  result.x = x / 4095;
  result.y = (compressed - x * 4096) / 4095;
  return result;
}

/** Decodes delta- and ZigZag-encoded vertex buffers in place. */
export function zigZagDeltaDecode(
  uBuffer: Uint16Array,
  vBuffer: Uint16Array,
  heightBuffer?: Uint16Array | number[]
): void {
  assert(uBuffer);
  assert(vBuffer);
  assert(uBuffer.length === vBuffer.length);
  if (heightBuffer) {
    assert(uBuffer.length === heightBuffer.length);
  }

  let u = 0;
  let v = 0;
  let height = 0;
  for (let index = 0; index < uBuffer.length; index++) {
    u += zigZagDecode(uBuffer[index]);
    v += zigZagDecode(vBuffer[index]);
    uBuffer[index] = u;
    vBuffer[index] = v;
    if (heightBuffer) {
      height += zigZagDecode(heightBuffer[index]);
      heightBuffer[index] = height;
    }
  }
}

function zigZagDecode(value: number): number {
  return (value >> 1) ^ -(value & 1);
}
