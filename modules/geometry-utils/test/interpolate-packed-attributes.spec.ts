// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {interpolatePackedAttributes} from '@math.gl/geometry-utils/interpolate-packed-attributes';
import type {
  PackedAttribute,
  PackedAttributeType
} from '@math.gl/geometry-utils/interpolate-packed-attributes';
import {interpolatePackedAttributes as rootInterpolation} from '@math.gl/geometry-utils';
import {subdivideTriangleMesh} from '@math.gl/polygon';

const midpoint = {sourceVertexIndices: [0, 1, 0], sourceVertexWeights: [0.5, 0.5, 0]};
const identity = {sourceVertexIndices: [0, 0, 0], sourceVertexWeights: [1, 0, 0]};

test('lightweight and root entrypoints expose the same helper', () => {
  expect(rootInterpolation).toBe(interpolatePackedAttributes);
});

/** Declare one scalar field for the typed-array encoding fixtures. */
function scalar(type: PackedAttributeType): PackedAttribute {
  return {type, size: 1, byteOffset: 0, interpolation: 'linear'};
}

test.each([
  {type: 'int8' as const, values: new Int8Array([-128, 127]), expected: 0},
  {type: 'uint8' as const, values: new Uint8Array([0, 255]), expected: 128},
  {type: 'int16' as const, values: new Int16Array([-32768, 32767]), expected: 0},
  {type: 'uint16' as const, values: new Uint16Array([0, 65535]), expected: 32768},
  {type: 'int32' as const, values: new Int32Array([-2147483648, 2147483647]), expected: 0},
  {type: 'uint32' as const, values: new Uint32Array([0, 4294967295]), expected: 2147483648},
  {type: 'float32' as const, values: new Float32Array([1.25, 3.75]), expected: 2.5},
  {type: 'float64' as const, values: new Float64Array([1.25, 3.75]), expected: 2.5}
])('interpolates $type without changing the encoding', ({type, values, expected}) => {
  const source = new Uint8Array(values.buffer);
  const before = source.slice();
  const result = interpolatePackedAttributes(source, midpoint, {
    byteStride: values.BYTES_PER_ELEMENT,
    attributes: [scalar(type)]
  });
  const view = new DataView(result.buffer);
  const read = {
    int8: () => view.getInt8(0),
    uint8: () => view.getUint8(0),
    int16: () => view.getInt16(0, true),
    uint16: () => view.getUint16(0, true),
    int32: () => view.getInt32(0, true),
    uint32: () => view.getUint32(0, true),
    float32: () => view.getFloat32(0, true),
    float64: () => view.getFloat64(0, true)
  };
  expect(read[type]()).toBe(expected);
  expect(source).toEqual(before);
});

test.each([true, false])(
  'handles unaligned offsets, view boundaries and byte order %s',
  littleEndian => {
    const backing = new Uint8Array(20).fill(0xab);
    const source = backing.subarray(3, 13);
    const view = new DataView(source.buffer, source.byteOffset, source.byteLength);
    view.setUint16(1, 1000, littleEndian);
    view.setUint16(6, 2001, littleEndian);
    source[0] = 7;
    source[5] = 8;
    const before = backing.slice();
    const result = interpolatePackedAttributes(source, midpoint, {
      byteStride: 5,
      littleEndian,
      attributes: [{type: 'uint16', size: 1, byteOffset: 1, interpolation: 'linear'}]
    });
    expect(new DataView(result.buffer).getUint16(1, littleEndian)).toBe(1501);
    expect(Array.from(result)).toEqual(
      littleEndian ? [7, 221, 5, 171, 171] : [7, 5, 221, 171, 171]
    );
    expect(backing).toEqual(before);
  }
);

test('Tangram-style packed midpoint keeps layer order and selection IDs flat', () => {
  const source = new Uint8Array(32);
  const view = new DataView(source.buffer);
  for (const offset of [0, 16]) {
    view.setInt16(offset + 6, 7, true);
    source.set([1, 2, 3, 4], offset + 12);
  }
  view.setInt16(16, 4096, true);
  view.setInt16(20, 100, true);
  view.setUint16(10, 65535, true);
  view.setUint16(24, 65535, true);
  const before = source.slice();
  const result = interpolatePackedAttributes(
    source,
    {
      sourceVertexIndices: [0, NaN, 999, 1, 0, 0, 0, 1, 0],
      sourceVertexWeights: [1, 0, 0, 1, 0, 0, 0.5, 0.5, 0]
    },
    {
      byteStride: 16,
      attributes: [
        {
          type: 'int16',
          size: 4,
          byteOffset: 0,
          interpolation: ['linear', 'linear', 'linear', 'flat']
        },
        {type: 'uint16', size: 2, byteOffset: 8, interpolation: 'linear'},
        {type: 'uint8', size: 4, byteOffset: 12, interpolation: 'flat'}
      ]
    }
  );
  expect(result.slice(0, 32)).toEqual(source);
  expect(Array.from(new Int16Array(result.buffer, 32, 4))).toEqual([2048, 0, 50, 7]);
  expect(Array.from(new Uint16Array(result.buffer, 40, 2))).toEqual([32768, 32768]);
  expect(Array.from(result.slice(44))).toEqual([1, 2, 3, 4]);
  expect(source).toEqual(before);
});

test('flat policies reject conflicting contributors and ignore zero-weight records', () => {
  const source = new Uint8Array([7, 8]);
  const options = {
    byteStride: 1,
    attributes: [{...scalar('uint8'), interpolation: 'flat' as const}]
  };
  expect(() => interpolatePackedAttributes(source, midpoint, options)).toThrow(/Flat/);
  expect(interpolatePackedAttributes(source, identity, options)).toEqual(new Uint8Array([7]));
  expect(
    interpolatePackedAttributes(
      source,
      {
        sourceVertexIndices: [1, 0, 0],
        sourceVertexWeights: [1, 0, 0]
      },
      options
    )
  ).toEqual(new Uint8Array([8]));
});

test('identity provenance preserves original floating-point bits and padding', () => {
  const source = new Uint8Array(12).fill(0xcd);
  new DataView(source.buffer).setFloat64(1, -0, true);
  const result = interpolatePackedAttributes(source, identity, {
    byteStride: 12,
    attributes: [{type: 'float64', size: 1, byteOffset: 1, interpolation: 'linear'}]
  });
  expect(result).toEqual(source);
  expect(Object.is(new DataView(result.buffer).getFloat64(1, true), -0)).toBe(true);
  expect(result.buffer).not.toBe(source.buffer);
});

test('rounds once from original provenance, not at every refinement midpoint', () => {
  const source = new Uint8Array([0, 1, 0]);
  const result = interpolatePackedAttributes(
    source,
    {
      sourceVertexIndices: [0, 1, 2],
      sourceVertexWeights: [0.25, 0.25, 0.5]
    },
    {byteStride: 1, attributes: [scalar('uint8')]}
  );
  expect(result[0]).toBe(0);
  expect(Math.round((Math.round((source[0] + source[1]) / 2) + source[2]) / 2)).toBe(1);
});

test('consumes public polygon provenance without a geometry-utils runtime dependency on polygon', () => {
  const mesh = {positions: [0, 0, 1, 0, 1, 1, 0, 1], indices: [0, 1, 2, 0, 2, 3]};
  const subdivision = subdivideTriangleMesh(mesh, {
    transform: position => [position[0], position[1], Math.sin(position[0])],
    targetSize: 3,
    tolerance: 0.1
  });
  const source = new Uint8Array(new Float32Array(mesh.positions).buffer);
  const result = interpolatePackedAttributes(source, subdivision, {
    byteStride: 8,
    attributes: [{type: 'float32', size: 2, byteOffset: 0, interpolation: 'linear'}]
  });
  const values = new Float32Array(result.buffer);
  expect(values.length).toBe(subdivision.sourcePositions.length);
  for (let index = 0; index < values.length; index++) {
    expect(values[index]).toBeCloseTo(subdivision.sourcePositions[index]);
  }
});

test.each([
  {sourceVertexIndices: [0, 1], sourceVertexWeights: [0.5, 0.5]},
  {sourceVertexIndices: [0, 1, 0], sourceVertexWeights: [1]},
  {sourceVertexIndices: [-1, 1, 0], sourceVertexWeights: [0.5, 0.5, 0]},
  {sourceVertexIndices: [2, 1, 0], sourceVertexWeights: [0.5, 0.5, 0]},
  {sourceVertexIndices: [0.5, 1, 0], sourceVertexWeights: [0.5, 0.5, 0]},
  {sourceVertexIndices: [0, 1, 0], sourceVertexWeights: [NaN, 0.5, 0]},
  {sourceVertexIndices: [0, 1, 0], sourceVertexWeights: [Infinity, 0.5, 0]},
  {sourceVertexIndices: [0, 1, 0], sourceVertexWeights: [-0.5, 1, 0.5]},
  {sourceVertexIndices: [0, 1, 0], sourceVertexWeights: [1.5, 0, 0]},
  {sourceVertexIndices: [0, 1, 0], sourceVertexWeights: [0, 0, 0]},
  {sourceVertexIndices: [0, 1, 0], sourceVertexWeights: [0.2, 0.2, 0]}
])('rejects invalid provenance %j', provenance => {
  expect(() =>
    interpolatePackedAttributes(new Uint8Array([1, 2]), provenance, {
      byteStride: 1,
      attributes: [scalar('uint8')]
    })
  ).toThrow(RangeError);
});

test.each([
  {byteStride: 0},
  {byteStride: 1.5},
  {byteStride: 3},
  {maxOutputBytes: 0},
  {maxOutputBytes: -1},
  {maxOutputBytes: Infinity},
  {attributes: [{...scalar('uint8'), byteOffset: -1}]},
  {attributes: [{...scalar('uint8'), size: 2}]},
  {attributes: [scalar('uint8'), scalar('uint8')]},
  {attributes: [{...scalar('uint8'), size: 0}]},
  {attributes: [{...scalar('uint8'), interpolation: []}]},
  {attributes: [{...scalar('uint8'), interpolation: new Array(1)}]},
  {attributes: [{...scalar('uint8'), interpolation: 'unknown'}]},
  {attributes: [{...scalar('uint8'), type: '__proto__'}]},
  {attributes: [null]},
  {attributes: new Array(1)},
  {littleEndian: 'true'}
])('rejects invalid layouts or budgets %j', overrides => {
  expect(() =>
    Reflect.apply(interpolatePackedAttributes, undefined, [
      new Uint8Array([1, 2]),
      midpoint,
      {
        byteStride: 1,
        attributes: [scalar('uint8')],
        ...overrides
      }
    ])
  ).toThrow(RangeError);
});

test.each(['linear', 'flat'] as const)('rejects nonfinite %s source attributes', interpolation => {
  for (const value of [NaN, Infinity, -Infinity]) {
    const source = new Uint8Array(new Float64Array([value, 0]).buffer);
    expect(() =>
      interpolatePackedAttributes(source, midpoint, {
        byteStride: 8,
        attributes: [{...scalar('float64'), interpolation}]
      })
    ).toThrow(/finite/);
  }
});

test('rejects floating-point overflow and supports bounded empty output', () => {
  const source = new Uint8Array(new Float64Array([Number.MAX_VALUE, Number.MAX_VALUE]).buffer);
  expect(() =>
    interpolatePackedAttributes(
      source,
      {
        sourceVertexIndices: [0, 1, 0],
        sourceVertexWeights: [0.5, 0.50000000001, 0]
      },
      {byteStride: 8, attributes: [scalar('float64')]}
    )
  ).toThrow(/finite/);
  expect(
    interpolatePackedAttributes(
      new Uint8Array(),
      {
        sourceVertexIndices: [],
        sourceVertexWeights: []
      },
      {byteStride: 1, attributes: [scalar('uint8')], maxOutputBytes: 0}
    )
  ).toEqual(new Uint8Array());
  expect(
    interpolatePackedAttributes(new Uint8Array([1, 2]), midpoint, {
      byteStride: 1,
      attributes: [],
      maxOutputBytes: 1
    })
  ).toEqual(new Uint8Array([1]));
});
