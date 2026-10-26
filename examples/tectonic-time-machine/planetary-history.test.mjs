// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import test from 'node:test';
import assert from 'node:assert/strict';
import {EARTH_FORMATION_MA, clampTimelineTime, isEarlyEarth, earlyEarthBlend, thermalPulse, earlyEarthMaterial, planetaryStage, validateGeologicalSeries, selectGeologicalSeries} from './planetary-history.js';

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

test('Theia flashes at impact then fades back to Hadean rather than warming beforehand', () => {
  assert.equal(earlyEarthMaterial(-4501).theia, 0);
  assert.equal(earlyEarthMaterial(-4500).theia, 1);
  assert.ok(earlyEarthMaterial(-4490).theia < 1);
  assert.ok(earlyEarthMaterial(-4470).theia < earlyEarthMaterial(-4490).theia);
  assert.equal(earlyEarthMaterial(-4400).theia, 0);
  assert.ok(earlyEarthMaterial(-4400).lava > 0);
});

test('seas emerge gradually and the plate-data handoff has a continuous visual blend', () => {
  assert.equal(earlyEarthMaterial(-4500).water, 0);
  const halfway=earlyEarthMaterial(-4400).water;
  assert.ok(halfway > .3 && halfway < .8);
  assert.equal(earlyEarthMaterial(-4320).water, .95);
  assert.ok(earlyEarthMaterial(-4399).water-halfway < .01);
  assert.equal(earlyEarthBlend(-1100,1000),1);
  assert.equal(earlyEarthBlend(-1000,1000),1);
  assert.equal(earlyEarthBlend(-940,1000),.5);
  assert.equal(earlyEarthBlend(-880,1000),0);
  assert.equal(earlyEarthBlend(0,1000),0);
  assert.ok(Math.abs(earlyEarthBlend(-999.99,1000)-1)<1e-6);
});

test('thermal breathing is subtle, smooth and periodic', () => {
  assert.equal(thermalPulse(0),1);
  assert.ok(Math.abs(thermalPulse(4.5)-1)<1e-12);
  assert.equal(thermalPulse(4.5/4),1.08);
  assert.equal(thermalPulse(4.5*3/4),.92);
});
