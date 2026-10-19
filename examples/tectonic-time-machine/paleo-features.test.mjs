// math.gl
// SPDX-License-Identifier: MIT
import test from 'node:test';
import assert from 'node:assert/strict';
import {PALEO_FEATURES, featuresAtAge, searchPaleoFeatures} from './paleo-features.js';

test('paleogeographic features are active only in their inclusive age intervals', () => {
  assert.ok(featuresAtAge(-550).some(feature => feature.id === 'transgondwanan'));
  assert.ok(featuresAtAge(-650).some(feature => feature.id === 'transgondwanan'));
  assert.ok(featuresAtAge(-500).some(feature => feature.id === 'transgondwanan'));
  assert.ok(!featuresAtAge(-400).some(feature => feature.id === 'transgondwanan'));
  assert.deepEqual(featuresAtAge(100), []);
});
test('feature search is case insensitive and searches type and notes', () => {
  assert.equal(searchPaleoFeatures(PALEO_FEATURES, 'IAPETUS')[0].id, 'iapetus');
  assert.ok(searchPaleoFeatures(PALEO_FEATURES, 'mountain belt').length >= 2);
  assert.deepEqual(searchPaleoFeatures(PALEO_FEATURES, 'not-a-feature'), []);
});
