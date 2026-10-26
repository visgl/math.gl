// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import test from 'node:test';
import assert from 'node:assert/strict';
import {EARTH_FORMATION_MA, clampTimelineTime, isEarlyEarth, earlyEarthMaterial, planetaryStage, validateGeologicalSeries, selectGeologicalSeries} from './planetary-history.js';

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


test('malformed samples and non-text provenance are rejected without throwing', () => {
  const valid = {kind: 'impact-flux', source: 'Reference', license: 'CC-BY-4.0', model: 'Published model', unit: 'impacts/Ma', method: 'Model output', samples: [{ageMa: 4000, value: 1}]};
  assert.deepEqual(validateGeologicalSeries(valid), []);
  for (const sample of [null, undefined, [], 1, 'sample']) {
    assert.ok(validateGeologicalSeries({...valid, samples: [sample]}).includes('Invalid sample'));
  }
  for (const key of ['source', 'license', 'model', 'unit', 'method']) {
    for (const value of [' ', 123, {}, []]) {
      assert.ok(validateGeologicalSeries({...valid, [key]: value}).length > 0);
    }
  }
  assert.deepEqual(selectGeologicalSeries([{...valid, samples: [null]}, valid], 'impact-flux'), [valid]);
});

test('one timeline spans formation through future without stretching plate coverage', () => {
  assert.equal(clampTimelineTime(-5000), -EARTH_FORMATION_MA);
  assert.equal(clampTimelineTime(500), 300);
  assert.equal(clampTimelineTime(-4400), -4400);
  assert.throws(() => clampTimelineTime(NaN));
  assert.equal(isEarlyEarth(-4400, 1000), true);
  assert.equal(isEarlyEarth(-1000, 1000), false);
  assert.equal(isEarlyEarth(-1500, 1800), false);
  assert.equal(isEarlyEarth(-5000, 1000), false);
});
test('Hadean lakes cool, bombardment is localized in age, and material poses repeat', () => {
  const hot = earlyEarthMaterial(-4500), cool = earlyEarthMaterial(-4050);
  assert.ok(hot.lava > cool.lava && cool.lava > 0);
  assert.equal(earlyEarthMaterial(-3500).lava, 0);
  assert.equal(earlyEarthMaterial(-3900).bombardment, 1);
  assert.equal(earlyEarthMaterial(-4200).bombardment, 0);
  assert.equal(earlyEarthMaterial(-3600).bombardment, 0);
  assert.deepEqual(earlyEarthMaterial(-3900), earlyEarthMaterial(-3900));
  assert.equal(earlyEarthMaterial(-3888).impactTime - earlyEarthMaterial(-3900).impactTime, 1);
  const scratch = {};
  assert.equal(earlyEarthMaterial(-4400, scratch), scratch);
  assert.ok(scratch.water < earlyEarthMaterial(-3000).water);
});
