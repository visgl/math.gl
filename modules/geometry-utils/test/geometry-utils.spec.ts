// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Vector2, Vector3, Vector4} from '@math.gl/core';
import {
  GL,
  GLType,
  computeVertexNormals,
  compressTextureCoordinates,
  concatTypedArrays,
  decodeRGB565,
  decompressTextureCoordinates,
  emod,
  encodeRGB565,
  makeAttributeIterator,
  makePrimitiveIterator,
  octDecode,
  octDecodeFromVector4,
  octEncode,
  octEncodeToVector4,
  zigZagDeltaDecode
} from '@math.gl/geometry-utils';
import {expect, test} from 'vitest';

test('GLType converts component types and preserves view offsets', () => {
  expect(GLType.fromTypedArray(new Uint16Array(1))).toBe(GL.UNSIGNED_SHORT);
  expect(GLType.fromName('FLOAT')).toBe(GL.FLOAT);
  expect(GLType.getByteSize(GL.DOUBLE)).toBe(8);
  expect(GLType.validate(-1)).toBeFalsy();

  const source = new Uint8Array([10, 20, 30, 40]).subarray(1, 3);
  expect(Array.from(GLType.createTypedArray(GL.UNSIGNED_BYTE, source))).toEqual([20, 30]);
});

test('makeAttributeIterator iterates fixed-size elements', () => {
  const iterator = makeAttributeIterator(new Float32Array([1, 2, 3, 4]), 2);
  expect(Array.from(iterator, value => Array.from(value))).toEqual([
    [1, 2],
    [3, 4]
  ]);
});

test('makePrimitiveIterator expands indexed loops and preserves strip winding', () => {
  const loop = Array.from(
    makePrimitiveIterator(new Uint16Array([3, 1, 4]), {}, GL.LINE_LOOP),
    primitive => [primitive.i1, primitive.i2]
  );
  expect(loop).toEqual([
    [3, 1],
    [1, 4],
    [4, 3]
  ]);

  const strip = Array.from(
    makePrimitiveIterator(undefined, {}, GL.TRIANGLE_STRIP, 0, 4),
    primitive => [primitive.i1, primitive.i2, primitive.i3]
  );
  expect(strip).toEqual([
    [0, 1, 2],
    [2, 1, 3]
  ]);
});

test('computeVertexNormals supports indexed geometry', () => {
  const normals = computeVertexNormals({
    mode: GL.TRIANGLES,
    indices: new Uint16Array([0, 1, 2, 0, 2, 3]),
    attributes: {
      POSITION: {value: new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0]), size: 3}
    }
  });
  expect(Array.from(normals)).toEqual([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]);
});

test('RGB565 encodes and decodes canonical colors', () => {
  expect(encodeRGB565([255, 0, 0])).toBe(0xf800);
  expect(encodeRGB565([0, 255, 0])).toBe(0x07e0);
  expect(encodeRGB565([0, 0, 255])).toBe(0x001f);
  expect(decodeRGB565(0xffff)).toEqual([255, 255, 255]);
});

test('concatTypedArrays copies only visible view bytes', () => {
  const first = new Uint8Array([0, 1, 2, 3]).subarray(1, 3);
  const second = new Uint16Array([0x0504]);
  expect(Array.from(concatTypedArrays([first, second]))).toEqual([1, 2, 4, 5]);
});

test('octahedral encoding round-trips vectors', () => {
  const source = new Vector3(1, 1, 1).normalize();
  const encoded = octEncode(source, new Vector2());
  const decoded = octDecode(encoded.x, encoded.y, new Vector3());
  expect(decoded.distance(source)).toBeLessThan(0.01);

  const encoded4 = octEncodeToVector4(source, new Vector4());
  const decoded4 = octDecodeFromVector4(encoded4, new Vector3());
  expect(decoded4.distance(source)).toBeLessThan(0.0001);
});

test('texture coordinate and ZigZag delta compression round-trip', () => {
  const textureCoordinates = new Vector2(0.25, 0.75);
  const decompressed = decompressTextureCoordinates(
    compressTextureCoordinates(textureCoordinates),
    new Vector2()
  );
  expect(decompressed.distance(textureCoordinates)).toBeLessThan(0.001);

  const u = new Uint16Array([2, 2, 1]);
  const v = new Uint16Array([4, 0, 3]);
  zigZagDeltaDecode(u, v);
  expect(Array.from(u)).toEqual([1, 2, 1]);
  expect(Array.from(v)).toEqual([2, 2, 0]);
});

test('emod wraps positive and negative values', () => {
  expect(emod(1.25)).toBe(0.25);
  expect(emod(-0.25)).toBe(0.75);
});
