// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {readdirSync, readFileSync} from 'node:fs';
import {join, relative} from 'node:path';
import {fileURLToPath} from 'node:url';

const source = fileURLToPath(new URL('../src/', import.meta.url));
const derived = new Set([
  'experimental/datum.ts',
  'experimental/projections/ob-tran.ts',
  'experimental/crs/structured.ts',
  'experimental/crs/datum-table.ts',
  'experimental/crs/ellipsoid-table.ts',
  'experimental/crs/units-table.ts',
  'experimental/crs/primemeridian-table.ts',
  'experimental/grids/grid.ts',
  'experimental/grids/ntv2.ts',
  'experimental/grids/geotiff.ts'
]);
let count = 0;
function visit(directory) {
  for (const file of readdirSync(directory, {withFileTypes: true})) {
    const path = join(directory, file.name);
    if (file.isDirectory()) {
      visit(path);
      continue;
    }
    if (!file.name.endsWith('.ts')) continue;
    const name = relative(source, path).replaceAll('\\', '/');
    const header = readFileSync(path, 'utf8').split('\n').slice(0, 16).join('\n');
    const apache = name === 'experimental/kernels/eqearth.ts';
    const license = header.match(/^\/\/ SPDX-License-Identifier: (.+)$/m)?.[1];
    assert.equal(license, apache ? 'Apache-2.0' : 'MIT', name + ' must declare its source license');
    if (/^experimental\/(kernels|common)\//.test(name) || derived.has(name)) {
      assert(header.includes('proj4js'), name + ' must identify its provenance');
      assert(
        /^\/\/ SPDX-FileCopyrightText: .*proj4js/m.test(header),
        name + ' must credit upstream with SPDX'
      );
      assert(
        header.includes(apache ? 'APACHE-2.0-LICENSE.txt' : 'PROJ4-LICENSE.md'),
        name + ' must link the retained license'
      );
      if (apache)
        assert(header.includes('Bernie Jenny'), 'Equal Earth must retain its original copyright');
      else
        assert(
          header.includes('Mike Adair') && header.includes('Calvin Metcalf'),
          name + ' must retain the proj4js copyright holders'
        );
      count++;
    }
  }
}
visit(source);
console.log(
  'Projection SPDX headers and upstream credits passed for ' + count + ' derived source files.'
);
