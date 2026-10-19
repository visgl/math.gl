// math.gl
// SPDX-License-Identifier: MIT
import test from 'node:test';
import assert from 'node:assert/strict';
import {validatePaleoGeometry, featuresForEpoch} from './paleo-geometry.js';

const valid = {
  id: 'example-orogen', name: 'Example orogen', type: 'mountain belt',
  olderMa: 350, youngerMa: 250, epochMa: 300,
  source: 'Example published source', license: 'CC-BY-4.0',
  reconstructionModel: 'EXAMPLE2026', plateId: 12,
  geometry: {type: 'LineString', coordinates: [[-60, 20], [-50, 30]]}
};
test('accepts sourced, epoch-specific geographic geometry', () => {
  assert.deepEqual(validatePaleoGeometry(valid), []);
  assert.deepEqual(featuresForEpoch([valid], 300, 'EXAMPLE2026'), [valid]);
});
test('does not mix epochs or reconstruction reference frames', () => {
  assert.deepEqual(featuresForEpoch([valid], 200, 'EXAMPLE2026'), []);
  assert.deepEqual(featuresForEpoch([valid], 300, 'OTHER'), []);
});
test('rejects out-of-range coordinates and missing provenance', () => {
  assert.ok(validatePaleoGeometry({...valid, geometry: {type: 'Point', coordinates: [181, 20]}}).length);
  assert.ok(validatePaleoGeometry({...valid, source: ''}).length);
  assert.ok(validatePaleoGeometry({...valid, epochMa: 400}).length);
  assert.ok(validatePaleoGeometry({...valid, plateId: -1}).length);
});
test('rejects malformed and unsupported geometry', () => {
  assert.ok(validatePaleoGeometry({...valid, geometry: {type: 'Circle', coordinates: [0, 0]}}).length);
  assert.ok(validatePaleoGeometry({...valid, geometry: {type: 'Polygon', coordinates: [[[0, 0], [1, NaN]]]}}).length);
  assert.ok(validatePaleoGeometry(null).length);
});
