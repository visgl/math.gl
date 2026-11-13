// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getMorphFocus,
  getMorphViewState
} from '../../../../../examples/geospatial/bathymetry/src/camera.js';
import {
  selectRefinement,
  mapLatitude
} from '../../../../../examples/geospatial/bathymetry/src/refinement.js';

test('partial morphs request the same geographic refinement region', () => {
  const focus = {longitude: -120, latitude: 40};
  const expected = selectRefinement(focus.longitude, focus.latitude, 3).key;
  for (const projection of ['equirectangular', 'mercator'])
    for (const morph of [0, 0.25, 0.49, 0.5, 0.75, 1]) {
      const view = getMorphViewState(focus, morph, projection, {zoom: 3});
      const restored = getMorphFocus(view, morph, projection);
      assert.ok(Math.abs(restored.longitude - focus.longitude) < 1e-10);
      assert.ok(Math.abs(restored.latitude - focus.latitude) < 1e-10);
      assert.equal(
        selectRefinement(restored.longitude, restored.latitude, view.zoom).key,
        expected
      );
    }
});

test('flat-map pans persist through morphs and projection changes', () => {
  const original = getMorphViewState({longitude: -160, latitude: 12}, 1, 'mercator', {zoom: 3});
  const panned = {...original, target: [-80, -180, mapLatitude(35, 'mercator')]};
  const focus = getMorphFocus(panned, 1, 'mercator');
  for (const projection of ['equirectangular', 'mercator'])
    for (const morph of [0, 0.25, 0.75, 1]) {
      const view = getMorphViewState(focus, morph, projection, panned);
      const restored = getMorphFocus(view, morph, projection);
      assert.equal(restored.longitude, -80);
      assert.ok(Math.abs(restored.latitude - 35) < 1e-10);
    }
});
