// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Geometry, unpackIndexedGeometry} from '@math.gl/geometry';

test('Geometry normalizes typed arrays and calculates indexed draw counts', () => {
  const geometry = new Geometry({
    topology: 'triangle-list',
    indices: new Uint16Array([0, 1, 2]),
    attributes: {POSITION: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0])}
  });
  expect(geometry.attributes.POSITION.size).toBe(3);
  expect(geometry.getVertexCount()).toBe(3);
  expect(geometry.getAttributes().indices?.size).toBe(1);
  const unpacked = unpackIndexedGeometry(geometry);
  expect(unpacked.indices).toBeUndefined();
  expect(unpacked.attributes.POSITION?.value).toEqual(geometry.attributes.POSITION.value);
});

test('Geometry validates attribute and index data', () => {
  expect(
    () =>
      new Geometry({
        topology: 'triangle-list',
        attributes: {bad: {size: 2, value: new Float32Array(3)}}
      })
  ).toThrow();
  expect(
    () =>
      new Geometry({
        topology: 'triangle-list',
        indices: new Uint8Array([0]),
        attributes: {POSITION: new Float32Array(3)}
      })
  ).toThrow();
  expect(
    () =>
      new Geometry({
        topology: 'triangle-list',
        indices: new Uint16Array([0, 2]),
        attributes: {
          POSITION: new Float32Array(9),
          NORMAL: {size: 3, value: new Float32Array(6)}
        }
      })
  ).toThrow(/index 2 exceeds NORMAL vertex count 2/);
});

test('unpackIndexedGeometry preserves constants and handles legacy attributes', () => {
  const source = {
    indices: {value: new Uint8Array([1, 0])},
    attributes: {
      POSITION: {size: 3, value: new Float32Array([1, 2, 3, 4, 5, 6])},
      COLOR: {constant: true, value: new Uint8Array([255, 0, 0])},
      ID: {value: new Uint8Array([7, 8])},
      MISSING: undefined
    }
  };
  const unpacked = unpackIndexedGeometry(source);
  expect(unpacked.attributes.POSITION?.value).toEqual(new Float32Array([4, 5, 6, 1, 2, 3]));
  expect(unpacked.attributes.COLOR).toBe(source.attributes.COLOR);
  expect(unpacked.attributes.ID).toBe(source.attributes.ID);
  expect(unpackIndexedGeometry({attributes: source.attributes})).toEqual({
    attributes: source.attributes
  });
});

test('Geometry validates constructor options and attribute edge cases', () => {
  const geometry = new Geometry({
    id: 'explicit-id',
    topology: 'point-list',
    vertexCount: 4,
    attributes: {
      positions: new Float32Array([0, 0, 0]),
      color: {value: new Uint8Array([255, 0, 0]), constant: true}
    }
  });
  expect(geometry.id).toBe('explicit-id');
  expect(geometry.getVertexCount()).toBe(4);
  expect(geometry.getAttributes().positions?.size).toBe(3);

  expect(
    () => new Geometry({topology: 'point-list', attributes: {POSITION: {value: [] as never}}})
  ).toThrow(/typed-array/);
  for (const size of [0, -1, 1.5]) {
    expect(
      () =>
        new Geometry({
          topology: 'point-list',
          attributes: {POSITION: {size, value: new Float32Array([0, 0, 0])}}
        })
    ).toThrow(/positive integer/);
  }
  expect(
    () =>
      new Geometry({
        topology: 'point-list',
        attributes: {POSITION: {size: 2, value: new Float32Array([0, 0, 0])}}
      })
  ).toThrow(/divisible/);
  expect(() => new Geometry({topology: 'point-list', vertexCount: -1, attributes: {}})).toThrow(
    /non-negative/
  );
  expect(() => new Geometry({topology: 'point-list', vertexCount: 1.5, attributes: {}})).toThrow(
    /non-negative/
  );
  expect(
    () =>
      new Geometry({
        topology: 'point-list',
        attributes: {COLOR: {constant: true, value: new Uint8Array([1])}}
      })
  ).toThrow(/no countable/);
  expect(
    () =>
      new Geometry({
        topology: 'point-list',
        indices: new Uint16Array([0]),
        attributes: {indices: new Uint16Array([0]), POSITION: new Float32Array([0, 0, 0])}
      })
  ).toThrow(/multiple index/);
});
