// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Offline provenance/shape checks for authored grids and independent PROJ references.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
const read = name => readFileSync(new URL('../test/fixtures/' + name, import.meta.url));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const source = JSON.parse(read('deformation-cases.json'));
const reference = JSON.parse(read('deformation-reference.json'));
assert.equal(reference.pyproj, '3.7.2');
assert.equal(reference.proj, '9.5.1');
assert.equal(reference.source, 'deformation-cases.json');
assert.equal(reference.sourceSHA256, sha(read(reference.source)));
assert.equal(
  reference.generatorSHA256,
  sha(readFileSync(new URL('./generate-deformation-reference.py', import.meta.url)))
);
assert.equal(reference.gridSHA256, sha(read(source.model.file)));
assert(reference.inverseOracle.startsWith('Fixed-point inversion of native PROJ forward'));
assert.deepEqual(
  reference.cases.map(c => c.id),
  source.cases.map(c => c.id)
);
let points = 0;
for (const [i, fixture] of source.cases.entries()) {
  assert.equal(reference.cases[i].results.length, fixture.points.length);
  assert.equal(fixture.epochs.length, fixture.points.length);
  assert(fixture.forwardTolerance > 0 && fixture.inverseTolerance > 0);
  for (const [j, row] of reference.cases[i].results.entries()) {
    assert.equal(row.epoch, fixture.epochs[j]);
    if (fixture.input.space === 'geographic') assert.deepEqual(row.input, fixture.points[j]);
    for (const point of [row.input, row.forward, row.inverse, row.projForward, row.projInverse]) {
      assert(point.length === 4 && point.every(Number.isFinite));
      assert.equal(point[3], fixture.points[j][3]);
    }
    points++;
  }
}
console.log(
  `PROJ deformation reference verified: ${source.cases.length} configurations, ${points} coordinate/epoch pairs; authored MIT grid.`
);
