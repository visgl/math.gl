// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import test from 'node:test';
import assert from 'node:assert/strict';
import {planetaryStage, validateGeologicalSeries, selectGeologicalSeries} from './planetary-history.js';

test('planetary stages distinguish the giant impact from known tectonic history', () => {
  assert.equal(planetaryStage(4567).id, 'accretion');
  assert.equal(planetaryStage(4500).id, 'giant-impact');
  assert.equal(planetaryStage(4400).id, 'cooling');
  assert.equal(planetaryStage(3000).id, 'pretectonic');
  assert.equal(planetaryStage(4568), null);
});
test('model and fossil data require units, provenance and monotonic ages', () => {
  const valid = {kind: 'impact-flux', source: 'example', license: 'CC-BY-4.0',
    model: 'model-A', method: 'modeled rate', unit: 'impacts/Ma',
    samples: [{ageMa: 4500, value: 10}, {ageMa: 4400, value: 5}]};
  assert.deepEqual(validateGeologicalSeries(valid), []);
  assert.equal(selectGeologicalSeries([valid], 'impact-flux').length, 1);
  assert.ok(validateGeologicalSeries({...valid, source: ''}).length);
  assert.ok(validateGeologicalSeries({...valid, samples: [...valid.samples].reverse()}).length);
  assert.ok(validateGeologicalSeries({...valid, samples: [{ageMa: 100, value: -1}]}).length);
});
