// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
const read = name => readFileSync(new URL('../test/fixtures/' + name, import.meta.url));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const inputs = JSON.parse(read('operation-pipeline-cases.json'));
const reference = JSON.parse(read('operation-pipeline-reference.json'));
assert.equal(reference.pyproj, '3.7.2');
assert.equal(reference.proj, '9.5.1');
assert.equal(reference.source, 'operation-pipeline-cases.json');
assert.equal(reference.sourceSHA256, sha(read(reference.source)));
assert.equal(
  reference.generatorSHA256,
  sha(readFileSync(new URL('./generate-pipeline-reference.py', import.meta.url)))
);
assert.equal(reference.additionalVerticalSHA256, sha(new Uint8Array(reference.additionalVerticalGridBytes)));
assert.equal(reference.horizontalSHA256, sha(read('real-grids/BETA2007.gsb')));
assert.equal(
  reference.verticalSHA256,
  sha(new Uint8Array(JSON.parse(read('vertical-grid-reference.json')).gridBytes))
);
assert.deepEqual(
  reference.cases.map(row => row.id),
  inputs.cases.map(row => row.id)
);
let points = 0;
for (const [i, fixture] of inputs.cases.entries()) {
  assert(fixture.forwardTolerance > 0 && fixture.inverseTolerance > 0);
  assert(fixture.pipeline.startsWith('+step '));
  assert.deepEqual(
    reference.cases[i].results.map(row => row.input),
    fixture.points
  );
  for (const row of reference.cases[i].results) {
    for (const point of [row.input, row.forward, row.inverse]) {
      assert(point.length === 4 && point.every(Number.isFinite));
      assert.equal(point[3], row.input[3]);
    }
    points++;
  }
}
console.log(
  `PROJ pipeline reference verified: ${inputs.cases.length} configurations, ${points} XYZM points.`
);
