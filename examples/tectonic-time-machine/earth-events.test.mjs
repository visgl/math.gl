// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import test from 'node:test';
import assert from 'node:assert/strict';
import {EARTH_EVENTS, EVENT_CATEGORIES, filterEarthEvents, eventIsReconstructable, vegetationCoverage, LAND_PLANTS_AGE_MA} from './earth-events.js';

test('chronology is sourced, unique and spans planetary formation through K-Pg', () => {
  assert.equal(new Set(EARTH_EVENTS.map(e => e.id)).size, EARTH_EVENTS.length);
  assert.ok(EARTH_EVENTS.some(e => e.id === 'theia' && e.ageMa > 4000));
  assert.ok(EARTH_EVENTS.some(e => e.id === 'chicxulub'));
  for (const event of EARTH_EVENTS) {
    assert.ok(event.name && event.source && event.url.startsWith('https://'));
    assert.ok(Number.isFinite(event.ageMa) && event.ageMa >= 0 && event.ageMa <= 4567);
    assert.ok(EVENT_CATEGORIES.includes(event.category));
    assert.ok(['high', 'debated', 'scenario'].includes(event.confidence));
  }
});
test('filter and search preserve reverse geological chronology', () => {
  const extinctions = filterEarthEvents(EARTH_EVENTS, 'extinction');
  assert.ok(extinctions.length >= 5);
  assert.ok(extinctions.every((event, i) => i === 0 || extinctions[i - 1].ageMa >= event.ageMa));
  assert.equal(filterEarthEvents(EARTH_EVENTS, 'all', 'THEIA')[0].id, 'theia');
  assert.deepEqual(filterEarthEvents(EARTH_EVENTS, 'climate', 'theia'), []);
});
test('events outside selected tectonic source cannot seek its rotation model', () => {
  const theia = EARTH_EVENTS.find(e => e.id === 'theia');
  const chicxulub = EARTH_EVENTS.find(e => e.id === 'chicxulub');
  assert.equal(eventIsReconstructable(theia, 1800), false);
  assert.equal(eventIsReconstructable(chicxulub, 1000), true);
});

test('land vegetation starts at the sourced event and fades in after emergence', () => {
  assert.equal(EARTH_EVENTS.find(event => event.id === 'land-plants').ageMa, LAND_PLANTS_AGE_MA);
  for (const time of [-1800, -700, -500, -470]) assert.equal(vegetationCoverage(time), 0);
  assert.equal(vegetationCoverage(-430), .5);
  for (const time of [-390, 0, 300]) assert.equal(vegetationCoverage(time), 1);
  assert.ok(vegetationCoverage(-469) < .001);
});
