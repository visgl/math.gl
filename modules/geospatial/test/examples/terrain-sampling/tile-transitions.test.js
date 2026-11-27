// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createTileTransitionScene} from '../../../../../examples/geospatial/terrain-sampling/src/tile-transition-model.js';

const defaults = {
  ratio: 2,
  surface: 'curved',
  factor: 0.5,
  independent: false,
  coarseFactor: 0,
  fineFactor: 1,
  coordinate: true,
  resident: true,
  missing: false,
  method: 'horn',
  sectionY: 3
};
const scene = options => createTileTransitionScene({...defaults, ...options});

test('coordination closes the same morph seam seen in the profile', () => {
  for (const ratio of [2, 4]) {
    const coordinated = scene({ratio});
    assert(coordinated.rawGap > 1e-6);
    assert(coordinated.gap < 1e-10);
    const independent = scene({ratio, coordinate: false});
    assert.equal(independent.gap, independent.rawGap);
    assert(independent.gap > 1e-6);
    assert(coordinated.adjustment > 0);
  }
});

test('native derivatives retain a plane across resolutions and derivative methods', () => {
  for (const ratio of [2, 4])
    for (const method of ['horn', 'zevenbergen-thorne']) {
      const result = scene({ratio, method, surface: 'plane'});
      for (const reading of result.seam) {
        assert(reading.fine);
        assert(Math.abs(reading.fine.x - 0.2) < 1e-10);
        assert(Math.abs(reading.fine.y - 0.1) < 1e-10);
        if (reading.coarseNode) {
          assert(reading.coarse);
          assert(Math.abs(reading.coarse.x - 0.2) < 1e-10);
        }
      }
    }
});

test('morph controls change the common surface and profile without changing the fine reference', () => {
  const first = scene({factor: 0}),
    last = scene({factor: 1});
  assert.deepEqual(
    first.section.map(t => t.samples.map(s => s.fine)),
    last.section.map(t => t.samples.map(s => s.fine))
  );
  assert.notDeepEqual(
    first.section.map(t => t.samples.map(s => s.raw)),
    last.section.map(t => t.samples.map(s => s.raw))
  );
  const independent = scene({independent: true, coarseFactor: 0.7, fineFactor: 0.2});
  assert(independent.gap < 1e-10);
  assert.notDeepEqual(independent.section, last.section);
});

test('missing support and eviction stay unavailable in the shared surface and derivatives', () => {
  for (const ratio of [2, 4]) {
    const missing = scene({ratio, missing: true});
    assert.equal(missing.gap, null);
    assert(missing.seam.some(r => !r.fine));
    const evicted = scene({ratio, resident: false});
    assert.equal(evicted.tiles.length, 1);
    assert.equal(evicted.gap, null);
    assert(evicted.seam.every(r => !r.fine));
  }
});
