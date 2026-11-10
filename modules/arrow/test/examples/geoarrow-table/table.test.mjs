// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';

test('GeoArrow table example preserves rows and maps coordinates', () => {
  const result = JSON.parse(execFileSync(process.execPath, [
    new URL('../../../../../examples/arrow/geoarrow-table/src/main.mjs', import.meta.url).pathname
  ], {encoding: 'utf8'}));
  assert.equal(result.encoding, 'geoarrow.point');
  assert.deepEqual(result.bounds, [1, 2, 3, 4]);
  assert.deepEqual(result.movedBounds, [11, 22, 13, 24]);
  assert.equal(result.roundTripRows, 3);
  assert.equal(result.rows[1], null);
});
