// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {readdirSync, readFileSync} from 'node:fs';
import {join, relative} from 'node:path';
import {fileURLToPath} from 'node:url';

const source = fileURLToPath(new URL('../src/', import.meta.url));
const derived = new Set([
  'experimental/datum.ts',
  'experimental/kinematic-helmert.ts',
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
let sourceCount = 0;
function visit(directory) {
  for (const file of readdirSync(directory, {withFileTypes: true})) {
    const path = join(directory, file.name);
    if (file.isDirectory()) {
      visit(path);
      continue;
    }
    if (!file.name.endsWith('.ts')) continue;
    const name = relative(source, path).replaceAll('\\', '/');
    const header = readFileSync(path, 'utf8').match(/^(?:\/\/[^\n]*\n)+/)?.[0] || '';
    sourceCount++;
    assert.equal(header.split('\n')[0], '// math.gl', name + ' must identify the project');
    assert.equal(
      [...header.matchAll(/^\/\/ SPDX-License-Identifier: /gm)].length,
      1,
      name + ' must have exactly one SPDX license expression'
    );
    assert(
      /^\/\/ SPDX-FileCopyrightText: \S.+$/m.test(header),
      name + ' must declare copyright holders with SPDX'
    );
    assert(
      header
        .trimEnd()
        .split('\n')
        .slice(1)
        .every(line => /^\/\/ SPDX-[\w-]+: \S.+$/.test(line)),
      name + ' must use SPDX tags for copyright and provenance header comments'
    );
    assert(
      [...header.matchAll(/^\/\/ SPDX-FileComment: /gm)].length <= 1,
      name + ' must keep provenance in a single SPDX-FileComment'
    );
    if (['experimental/exact-helmert.ts', 'experimental/kinematic-helmert.ts'].includes(name)) {
      assert(
        /^\/\/ SPDX-FileCopyrightText: .*2016, Thomas Knudsen \/ SDFE \(PROJ\)$/m.test(header),
        name + ' must retain the PROJ copyright holder'
      );
      assert(header.includes('PROJ-LICENSE.txt'), name + ' must link the retained PROJ license');
    }
    const apache = name === 'experimental/kernels/eqearth.ts';
    const license = header.match(/^\/\/ SPDX-License-Identifier: (.+)$/m)?.[1];
    assert.equal(license, apache ? 'Apache-2.0' : 'MIT', name + ' must declare its source license');
    if (/^experimental\/(kernels|common)\//.test(name) || derived.has(name)) {
      assert(
        /^\/\/ SPDX-FileComment: .*proj4js/m.test(header),
        name + ' must identify its provenance with SPDX'
      );
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
  'Projection SPDX headers passed for ' +
    sourceCount +
    ' source files, including ' +
    count +
    ' proj4js-derived files.'
);
