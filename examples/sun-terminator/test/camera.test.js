// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MapView, OrthographicView, _GlobeView as GlobeView} from '@deck.gl/core';
import {transferCamera, geographicCenter} from '../camera.js';
import {createEndpoint} from '../morph.js';

test('geographic center and apparent zoom survive projection/globe round trips', () => {
  for (const focus of [
    [12, 24],
    [-75, 45],
    [130, -35]
  ]) {
    let id = 'globe';
    let viewport = new GlobeView().makeViewport({
      width: 1000,
      height: 800,
      viewState: {longitude: focus[0], latitude: focus[1], zoom: 3}
    });
    const localScale = (id, vp) => {
      const p = createEndpoint(id, vp);
      const a = p(...focus, focus[0]).position;
      const b = p(focus[0] + 0.01, focus[1], focus[0]).position;
      const c = p(focus[0], focus[1] + 0.01, focus[0]).position;
      return Math.sqrt(Math.hypot(b[0] - a[0], b[1] - a[1]) * Math.hypot(c[0] - a[0], c[1] - a[1]));
    };
    const scale = localScale(id, viewport);
    for (const next of ['eqearth', 'robin', 'map', 'isinu', 'globe']) {
      const view =
        next === 'globe'
          ? new GlobeView()
          : next === 'map'
            ? new MapView()
            : new OrthographicView({flipY: false});
      const result = transferCamera(id, viewport, next, view);
      assert.equal(result.clamped, false);
      viewport = view.makeViewport({width: 1000, height: 800, viewState: result.camera});
      const center = geographicCenter(next, viewport);
      assert.ok(
        center.every((v, i) => Math.abs(v - focus[i]) < 1e-4),
        next + ' center'
      );
      assert.ok(Math.abs(localScale(next, viewport) / scale - 1) < 0.01, next + ' scale');
      id = next;
    }
  }
});

test('zoomed-in morphs retain triangles instead of treating screen size as a cut', async () => {
  const {createMorphMesh} = await import('../morph.js');
  const viewport = new MapView().makeViewport({
    width: 1000,
    height: 800,
    viewState: {longitude: 12, latitude: 24, zoom: 7}
  });
  const endpoint = createEndpoint('map', viewport);
  const mesh = createMorphMesh(endpoint, endpoint);
  assert.ok(mesh.vertexCount > 90000);
});

test('out-of-domain centers adjust into perspective coverage', () => {
  const source = new GlobeView().makeViewport({
    width: 1000,
    height: 800,
    viewState: {longitude: -100, latitude: 25, zoom: 3}
  });
  const result = transferCamera('globe', source, 'geos', new OrthographicView({flipY: false}));
  assert.equal(result.clamped, true);
  assert.ok(result.camera.target.every(Number.isFinite));
});

test('coverage-edge focus retains scale when leaving QSC', () => {
  const sourceView = new OrthographicView({flipY: false});
  const qsc = transferCamera(
    'globe',
    new GlobeView().makeViewport({
      width: 1000,
      height: 800,
      viewState: {longitude: -25, latitude: 38.7, zoom: 3}
    }),
    'qsc',
    sourceView
  );
  const source = sourceView.makeViewport({width: 1000, height: 800, viewState: qsc.camera});
  const result = transferCamera('qsc', source, 'lcc', sourceView);
  assert.ok(result.camera.zoom > 1, 'an inward derivative must not collapse the destination zoom');
});

test('failed source inversions recover when switching projections', () => {
  for (const sourceId of ['ortho', 'imoll']) {
    const view = new OrthographicView({flipY: false});
    const source = view.makeViewport({
      width: 1000,
      height: 800,
      viewState: {target: [10000, 10000, 0], zoom: 2}
    });
    for (const next of ['globe', 'map', 'eqearth']) {
      const target = next === 'globe' ? new GlobeView() : next === 'map' ? new MapView() : view;
      const result = transferCamera(sourceId, source, next, target);
      assert.ok(result.clamped);
      const viewport = target.makeViewport({width: 1000, height: 800, viewState: result.camera});
      assert.ok(geographicCenter(next, viewport).every(Number.isFinite));
    }
  }
});
