// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {OrthographicView, WebMercatorViewport} from '@deck.gl/core';
import {getCutViewports, projectCutMap} from '../cut-maps.js';
import {createCutTileAdapter} from '../cut-tile-layer.js';
import {US_STATES} from '../us-state-mask.js';
const viewport = (target = [0, 0, 0], zoom = 3.2) =>
  new OrthographicView({flipY: false}).makeViewport({
    width: 1100,
    height: 800,
    viewState: {target, zoom}
  });
test('Albers USA exposes independent geographic sampling viewports for mainland and insets', () => {
  const views = getCutViewports('albers-usa', viewport());
  assert.equal(views.length, 3);
  assert.ok(views.every(v => v instanceof WebMercatorViewport));
  assert.equal(new Set(views.map(v => v.id)).size, 3);
  const hawaii = views.find(v => v.id.endsWith('-hawaii')),
    alaska = views.find(v => v.id.endsWith('-alaska'));
  assert.ok(hawaii.zoom > alaska.zoom + 1);
  const zoomed = getCutViewports(
    'albers-usa',
    viewport(projectCutMap('albers-usa', -157.82, 21.32), 8)
  );
  assert.ok(zoomed.find(v => v.id.endsWith('-hawaii')).zoom > hawaii.zoom);
  assert.ok(!zoomed.some(v => v.id.endsWith('-alaska')));
});
test('shared traversal deduplicates, wraps the dateline, and requests detailed Hawaiian tiles', () => {
  const adapter = createCutTileAdapter(() => 'albers-usa');
  const indices = adapter.getTileIndices({
    viewState: viewport(),
    tileSize: 256,
    minZoom: 0,
    maxZoom: 8
  });
  assert.equal(new Set(indices.map(i => i.z + '/' + i.x + '/' + i.y)).size, indices.length);
  assert.ok(indices.every(i => i.x >= 0 && i.x < 2 ** i.z && i.y >= 0 && i.y < 2 ** i.z));
  assert.ok(indices.some(i => i.z >= 5 && Math.floor(((-157.82 + 180) / 360) * 2 ** i.z) === i.x));
  assert.ok(indices.every(i => i.z >= 3));
});
test('Census boundary data includes fifty states and DC with separate Alaska and Hawaii polygons', () => {
  assert.equal(US_STATES.length, 51);
  for (const id of ['02', '15', '11'])
    assert.ok(US_STATES.some(s => s.id === id && s.polygons.length));
  assert.ok(!US_STATES.some(s => s.id === '72'));
  for (const state of US_STATES)
    for (const polygon of state.polygons)
      for (const ring of polygon) {
        assert.ok(ring.length >= 4);
        assert.ok(ring.every(([lon, lat]) => Math.abs(lon) <= 180 && Math.abs(lat) <= 90));
        assert.deepEqual(ring[0], ring.at(-1));
      }
});
