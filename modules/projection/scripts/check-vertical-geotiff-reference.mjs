// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
const read = name => readFileSync(new URL('../test/fixtures/' + name, import.meta.url));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const inputs = JSON.parse(read('vertical-geotiff-cases.json'));
const reference = JSON.parse(read('vertical-geotiff-reference.json'));
assert.equal(reference.pyproj, '3.7.2');
assert.equal(reference.proj, '9.5.1');
assert.equal(reference.source, 'vertical-geotiff-cases.json');
assert.equal(reference.sourceSHA256, sha(read(reference.source)));
assert.equal(
  reference.generatorSHA256,
  sha(readFileSync(new URL('./generate-vertical-geotiff-reference.py', import.meta.url)))
);
assert.deepEqual(
  reference.cases.map(row => row.id),
  inputs.cases.map(row => row.id)
);
let points = 0;
for (const [i, fixture] of reference.cases.entries()) {
  assert.equal(fixture.file, 'vertical-geotiff/' + fixture.id + '.tif');
  assert.equal(fixture.sha256, sha(read(fixture.file)));
  assert.deepEqual(
    fixture.results.map(row => row.input),
    inputs.cases[i].points
  );
  for (const row of fixture.results) {
    for (const point of [row.input, row.forward, row.inverse]) {
      assert(point.length === 4 && point.every(Number.isFinite));
      assert.equal(point[3], row.input[3]);
    }
    points++;
  }
}
console.log(
  `PROJ vertical GeoTIFF references verified: ${reference.cases.length} files, ${points} XYZM points.`
);
