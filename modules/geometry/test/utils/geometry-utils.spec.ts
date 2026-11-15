// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Vector2, Vector3, Vector4} from '@math.gl/core';
import {
  type GeometryInput,
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
  octDecodeFloat,
  octDecodeFromVector4,
  octDecodeInRange,
  octEncode,
  octEncodeFloat,
  octEncodeInRange,
  octEncodeToVector4,
  octPack,
  octUnpack,
  zigZagDeltaDecode
} from '@math.gl/geometry';
import {expect, test} from 'vitest';
import {
  getAttributeValues,
  getPositionAttribute,
  isGeometry
} from '@math.gl/geometry/utils/geometry';

test('makeAttributeIterator iterates fixed-size elements', () => {
  const iterator = makeAttributeIterator(new Float32Array([1, 2, 3, 4]), 2);
  expect(Array.from(iterator, value => Array.from(value))).toEqual([
    [1, 2],
    [3, 4]
  ]);
});

test.each([
  ['triangle-list', [0, 1, 2, 0, 2, 3]],
  ['triangle-strip', [0, 1, 3, 2]],
  ['triangle-fan', [0, 1, 2, 3]]
] as const)('computeVertexNormals supports indexed %s geometry', (topology, indices) => {
  const normals = computeVertexNormals({
    topology,
    indices: new Uint16Array(indices),
    attributes: {
      POSITION: {
        value: new Float32Array([0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0]),
        size: 3
      }
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

  const heights = [new Uint16Array([0, 2, 1]), new Uint16Array([0, 2, 3]), [0, 2, 1]] as const;
  zigZagDeltaDecode(heights[0], heights[1], heights[2]);
  expect(heights[2]).toEqual([0, 1, 0]);
});

test('emod wraps positive and negative values', () => {
  expect(emod(1.25)).toBe(0.25);
  expect(emod(-0.25)).toBe(0.75);
});

test('octahedral compression handles lower hemisphere and packed vectors', () => {
  const first = new Vector3(1, 1, -1).normalize();
  const second = new Vector3(-1, 1, 1).normalize();
  const third = new Vector3(0, -1, 0);
  const encoded = octEncodeInRange(first, 1023, new Vector2());
  const decoded = octDecodeInRange(encoded.x, encoded.y, 1023, new Vector3());
  expect(decoded.distance(first)).toBeLessThan(0.01);
  expect(octDecodeInRange(0, 0, 255, new Vector3()).magnitude()).toBeCloseTo(1);

  const packed = octPack(first, second, third, new Vector2());
  const unpackedFirst = new Vector3();
  const unpackedSecond = new Vector3();
  const unpackedThird = new Vector3();
  octUnpack(packed, unpackedFirst, unpackedSecond, unpackedThird);
  expect(unpackedFirst.distance(first)).toBeLessThan(0.02);
  expect(unpackedSecond.distance(second)).toBeLessThan(0.01);
  expect(unpackedThird.distance(third)).toBeLessThan(0.01);
  expect(octDecodeFloat(octEncodeFloat(first), new Vector3()).distance(first)).toBeLessThan(0.02);
  expect(() => octDecodeInRange(-1, 0, 255, new Vector3())).toThrow(/unsigned normalized/);
  expect(() => octDecodeFromVector4({x: 256, y: 0, z: 0, w: 0}, new Vector3())).toThrow(
    /unsigned normalized/
  );
  expect(
    decompressTextureCoordinates(compressTextureCoordinates(new Vector2(0, 1)), new Vector2())
  ).toEqual(new Vector2(0, 1));
});

test('primitive iterator expands each topology into independent primitives', () => {
  const attributes = {POSITION: {value: new Float32Array(12), size: 3}};
  const cases: [GeometryInput['topology'], string, number[][]][] = [
    ['point-list', 'point-list', [[0], [1], [2], [3]]],
    [
      'line-list',
      'line-list',
      [
        [0, 1],
        [2, 3]
      ]
    ],
    [
      'line-strip',
      'line-list',
      [
        [0, 1],
        [1, 2],
        [2, 3]
      ]
    ],
    [
      'line-loop',
      'line-list',
      [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 0]
      ]
    ],
    ['triangle-list', 'triangle-list', [[0, 1, 2]]],
    [
      'triangle-strip',
      'triangle-list',
      [
        [0, 1, 2],
        [2, 1, 3]
      ]
    ],
    [
      'triangle-fan',
      'triangle-list',
      [
        [0, 1, 2],
        [0, 2, 3]
      ]
    ]
  ];
  for (const [topology, type, indices] of cases) {
    const primitives = [...makePrimitiveIterator({topology, attributes})];
    expect(primitives).toEqual(
      indices.map(([i1, i2, i3], primitiveIndex) => ({
        attributes,
        type,
        i1,
        ...(i2 === undefined ? {} : {i2}),
        ...(i3 === undefined ? {} : {i3}),
        primitiveIndex
      }))
    );
  }
});

test('primitive iterator uses zero-based, end-exclusive ranges', () => {
  const indices = {value: new Uint16Array([8, 3, 1, 4, 6])};
  const loop = [
    ...makePrimitiveIterator({topology: 'line-loop', indices, attributes: {}}, {start: 1, end: 4})
  ];
  expect(loop.map(p => [p.i1, p.i2])).toEqual([
    [3, 1],
    [1, 4],
    [4, 3]
  ]);
  const points = [
    ...makePrimitiveIterator({topology: 'point-list', indices, attributes: {}}, {start: 3})
  ];
  expect(points.map(p => p.i1)).toEqual([4, 6]);
  const fan = [
    ...makePrimitiveIterator({topology: 'triangle-fan', attributes: {}}, {start: 2, end: 6})
  ];
  expect(fan.map(p => [p.i1, p.i2, p.i3])).toEqual([
    [2, 3, 4],
    [2, 4, 5]
  ]);
});

test('primitive iterator rejects missing, numeric, and unknown topologies', () => {
  for (const input of [
    {attributes: {}},
    {topology: 4, attributes: {}},
    {topology: 'constructor', attributes: {}}
  ]) {
    expect(isGeometry(input)).toBe(false);
    expect(() => [...makePrimitiveIterator(input as GeometryInput)]).toThrow(/topology/);
  }
});

test('geometry utility validation covers non-indexed normals and iterator guards', () => {
  const geometry = {
    topology: 'triangle-list' as const,
    attributes: {
      positions: {
        values: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
        size: 3
      }
    }
  };
  expect(Array.from(computeVertexNormals(geometry))).toEqual([0, 0, 1, 0, 0, 1, 0, 0, 1]);
  expect(() => computeVertexNormals({...geometry, topology: 'line-list'})).toThrow(
    /Triangle geometry/
  );
  expect(() =>
    computeVertexNormals({
      topology: 'triangle-list',
      attributes: {POSITION: {value: new Float32Array(3), size: 2}}
    })
  ).toThrow(/at least three/);
  expect(() => [...makeAttributeIterator(new Float32Array([1]), 0)]).toThrow(/positive integer/);
  expect(() => [...makeAttributeIterator(new Float32Array([1, 2, 3]), 2)]).toThrow(/divisible/);
});

test('geometry attribute helpers distinguish supported legacy shapes', () => {
  expect(isGeometry(null)).toBe(false);
  expect(isGeometry({topology: 'triangle-fan', attributes: {}})).toBe(true);
  expect(isGeometry({topology: 'line-loop', attributes: []})).toBe(false);
  expect(isGeometry({topology: 'point-list', attributes: 'positions'})).toBe(false);
  const values = new Float32Array([1, 2]);
  expect(getAttributeValues(values)).toBe(values);
  expect(getAttributeValues({value: values})).toBe(values);
  expect(getAttributeValues({values})).toBe(values);
  expect(() => getAttributeValues({})).toThrow(/typed-array/);
  expect(
    getPositionAttribute({
      topology: 'point-list',
      attributes: {POSITION: {value: values}}
    })
  ).toEqual({
    value: values
  });
  expect(
    getPositionAttribute({
      topology: 'point-list',
      attributes: {positions: {value: values}}
    })
  ).toEqual({
    value: values
  });
  expect(() => getPositionAttribute({topology: 'point-list', attributes: {}})).toThrow(/position/);
});
