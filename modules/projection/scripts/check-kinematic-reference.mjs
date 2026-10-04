// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
const read = name => readFileSync(new URL('../test/fixtures/' + name, import.meta.url));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const source = JSON.parse(read('kinematic-pipeline-cases.json'));
const reference = JSON.parse(read('kinematic-pipeline-reference.json'));
assert.equal(reference.pyproj, '3.7.2');
assert.equal(reference.proj, '9.5.1');
assert.equal(reference.source, 'kinematic-pipeline-cases.json');
assert.equal(reference.sourceSHA256, sha(read(reference.source)));
assert.equal(reference.generatorSHA256, sha(readFileSync(new URL('./generate-kinematic-reference.py', import.meta.url))));
assert.deepEqual(reference.cases.map(row => row.id), source.cases.map(row => row.id));
let points = 0;
for (const [i, fixture] of source.cases.entries()) {
  assert(fixture.pipeline.startsWith('+step '));
  assert(fixture.forwardTolerance > 0 && fixture.inverseTolerance > 0);
  assert.equal(fixture.epochs.length, fixture.points.length);
  assert.deepEqual(reference.cases[i].results.map(row => row.input), fixture.points);
  assert.deepEqual(reference.cases[i].results.map(row => row.epoch), fixture.epochs);
  for (const row of reference.cases[i].results) {
    assert(Number.isFinite(row.epoch));
    for (const point of [row.input, row.forward, row.inverse]) {
      assert(point.length === 4 && point.every(Number.isFinite));
      assert.equal(point[3], row.input[3]);
    }
    points++;
  }
}
console.log(`PROJ kinematic reference verified: ${source.cases.length} configurations, ${points} coordinate/epoch pairs.`);
