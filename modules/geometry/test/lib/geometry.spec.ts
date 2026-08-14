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
});
