// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import {Geometry, unpackIndexedGeometry} from '@math.gl/geometry';

test('Geometry normalizes typed arrays and calculates indexed draw counts', t => {
  const geometry = new Geometry({
    topology: 'triangle-list',
    indices: new Uint16Array([0, 1, 2]),
    attributes: {POSITION: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0])}
  });
  t.equal(geometry.attributes.POSITION.size, 3);
  t.equal(geometry.getVertexCount(), 3);
  t.equal(geometry.getAttributes().indices?.size, 1);
  const unpacked = unpackIndexedGeometry(geometry);
  t.equal(unpacked.indices, undefined);
  t.deepEqual(unpacked.attributes.POSITION?.value, geometry.attributes.POSITION.value);
  t.end();
});

test('Geometry validates attribute and index data', t => {
  t.throws(
    () =>
      new Geometry({
        topology: 'triangle-list',
        attributes: {bad: {size: 2, value: new Float32Array(3)}}
      })
  );
  t.throws(
    () =>
      new Geometry({
        topology: 'triangle-list',
        indices: new Uint8Array([0]),
        attributes: {POSITION: new Float32Array(3)}
      })
  );
  t.end();
});
