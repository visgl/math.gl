// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original stored-binary64 inputs from independent normal-support constructions; no upstream test data.
import assert from 'node:assert/strict';
import {readFileSync, writeFileSync} from 'node:fs';
const rows = [];
for (const ratio of [1, 0.9966471893352525, 0.5, 0.1, 0.01, 0.001, 0.000001])
  for (const a of [10, 6378137])
    for (const normal of [
      [1, 0, 0],
      [0.6, 0, 0.8],
      [-0.36, 0.48, -0.8],
      [1e-8, 0, Math.sqrt(1 - 1e-16)],
      [0, 0, -1]
    ])
      for (const height of [0, a * 0.01, a * 6]) {
        const b = a * ratio,
          [nx, ny, nz] = normal,
          support = Math.hypot(a * nx, a * ny, b * nz);
        rows.push({
          ratio,
          a,
          b,
          normal,
          height,
          xyz: [
            a * ((a * nx) / support) + height * nx,
            a * ((a * ny) / support) + height * ny,
            b * ((b * nz) / support) + height * nz
          ]
        });
      }
const path = new URL('../test/fixtures/spheroid-anchor-inputs.json', import.meta.url);
const text = '[\n' + rows.map(row => '  ' + JSON.stringify(row)).join(',\n') + '\n]\n';
if (process.argv.includes('--check'))
  assert.equal(readFileSync(path, 'utf8'), text, 'Regenerate the stored anchor inputs');
else writeFileSync(path, text);
console.log(`Verified ${rows.length} stored-binary64 anchor inputs`);
