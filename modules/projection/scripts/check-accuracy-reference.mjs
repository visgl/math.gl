// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Original independent-reference integrity checks for the proj4js-inspired API.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
const read = name => readFileSync(new URL('../test/fixtures/' + name, import.meta.url));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const inputs = JSON.parse(read('accuracy-cases.json'));
const reference = JSON.parse(read('accuracy-reference.json'));
assert.equal(reference.pyproj, '3.7.2');
assert.equal(reference.proj, '9.5.1');
assert.equal(reference.epsgVersion, 'v11.022');
assert.equal(reference.source, 'accuracy-cases.json');
assert.equal(reference.sourceSHA256, sha(read(reference.source)), 'Regenerate accuracy inputs');
assert.equal(
  reference.generatorSHA256,
  sha(readFileSync(new URL('./generate-accuracy-reference.py', import.meta.url))),
  'Regenerate accuracy oracle'
);
assert(Number.isInteger(inputs.seed) && inputs.seed >= 0 && inputs.seed < 2 ** 32);
assert(Number.isInteger(inputs.randomPoints) && inputs.randomPoints >= 256);
assert.equal(new Set(inputs.cases.map(row => row.id)).size, inputs.cases.length);
assert.deepEqual(
  reference.cases.map(row => row.id),
  inputs.cases.map(row => row.id)
);
let points = 0;
for (const [index, fixture] of inputs.cases.entries()) {
  assert.equal(
    fixture.oracle,
    fixture.definition,
    'Document a separate oracle translation if needed'
  );
  assert(fixture.oracleNotes);
  for (const key of ['forwardTolerance', 'inverseTolerance', 'roundtripTolerance']) {
    assert(Number.isFinite(fixture[key]) && fixture[key] > 0);
  }
  const {west, east, south, north} = fixture.bounds;
  assert(
    west < east && south < north && west >= -180 && east <= 180 && south >= -90 && north <= 90
  );
  const authored = [west, (west + east) / 2, east]
    .flatMap(x => [south, (south + north) / 2, north].map(y => [x, y]))
    .concat(fixture.probes);
  const rows = reference.cases[index].results;
  assert.equal(rows.length, authored.length + inputs.randomPoints);
  assert.deepEqual(
    rows.slice(0, authored.length).map(row => row.input),
    authored
  );
  for (const row of rows) {
    for (const point of [row.input, row.forward, row.inverse])
      assert(point.length === 2 && point.every(Number.isFinite));
    assert(
      row.input[0] >= west && row.input[0] <= east && row.input[1] >= south && row.input[1] <= north
    );
  }
  points += rows.length;
}
const qualification = JSON.parse(read('release-qualification.json'));
assert.equal(qualification.independent.accuracyDomains, inputs.cases.length);
assert.equal(qualification.independent.accuracyPoints, points);
console.log(
  `Seeded PROJ accuracy reference verified: ${inputs.cases.length} domains, ${points} points.`
);
