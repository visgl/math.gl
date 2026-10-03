// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
const read = name => readFileSync(new URL('../test/fixtures/' + name, import.meta.url));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const inputs = JSON.parse(read('vertical-grid-cases.json'));
const reference = JSON.parse(read('vertical-grid-reference.json'));
assert.equal(reference.pyproj, '3.7.2');
assert.equal(reference.proj, '9.5.1');
assert.equal(reference.source, 'vertical-grid-cases.json');
assert.equal(reference.sourceSHA256, sha(read(reference.source)));
assert.equal(
  reference.generatorSHA256,
  sha(readFileSync(new URL('./generate-vertical-reference.py', import.meta.url)))
);
assert.equal(reference.gridSHA256, sha(new Uint8Array(reference.gridBytes)));
assert.deepEqual(
  reference.cases.map(row => row.id),
  inputs.cases.map(row => row.id)
);
let points = 0;
for (const [i, fixture] of inputs.cases.entries()) {
  const rows = reference.cases[i].results;
  assert.deepEqual(
    rows.map(row => row.input),
    fixture.points
  );
  for (const row of rows) {
    for (const point of [row.input, row.forward, row.inverse]) {
      assert(point.length === 4 && point.every(Number.isFinite));
      assert.equal(point[3], row.input[3]);
    }
    points++;
  }
}
console.log(
  `PROJ vertical reference verified: ${inputs.cases.length} configurations, ${points} XYZM points.`
);
