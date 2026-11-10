// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MeshBitmapLayer} from '@deck.gl/map-layers';

const mesh = () => ({positions: new Float64Array(9), texCoords: new Float32Array(6), indices: new Uint32Array([0, 1, 2]), vertexCount: 3});
test('workspace layer supports both caller geometry and ordinary bitmap bounds', () => {
  const geometry = mesh();
  const layer = new MeshBitmapLayer({id: 'test', mesh: geometry});
  assert.equal(layer._createMesh(), geometry);
  const fallback = MeshBitmapLayer.prototype._createMesh.call({
    props: {bounds: [0, 0, 1, 1]},
    context: {viewport: {}}
  });
  assert.equal(fallback.vertexCount, 6);
  assert.equal(fallback.positions.length, 12);
});
test('mesh replacement refreshes GPU attributes with stable bounds', () => {
  const bounds = [-180, -90, 180, 90];
  const oldMesh = mesh(), nextMesh = mesh();
  const calls = [];
  const context = {
    props: {mesh: nextMesh},
    state: {mesh: oldMesh, model: {setVertexCount: count => calls.push(count)}},
    _createMesh: () => nextMesh,
    getAttributeManager: () => ({invalidateAll: () => calls.push('invalidate')}),
    setState: value => Object.assign(context.state, value)
  };
  const params = {props: {mesh: nextMesh, bounds}, oldProps: {mesh: oldMesh, bounds}, changeFlags: {}};
  MeshBitmapLayer.prototype.updateState.call(context, params);
  assert.equal(context.state.mesh, nextMesh);
  assert.deepEqual(calls, [3, 'invalidate']);
  calls.length = 0;
  MeshBitmapLayer.prototype.updateState.call(context, {...params, oldProps: params.props});
  assert.deepEqual(calls, []);
});
