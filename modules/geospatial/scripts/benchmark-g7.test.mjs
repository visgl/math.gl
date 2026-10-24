// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';

test('G7 rejects wrong finite native answers before any timing or report', () => {
  const root = fileURLToPath(new URL('../../../', import.meta.url));
  const directory = mkdtempSync(join(tmpdir(), 'mathgl-g7-bad-native-'));
  try {
    const marker = join(directory, 'timed'), output = join(directory, 'report.json');
    const binary = join(directory, 'native');
    const driverSHA256 = createHash('sha256').update(readFileSync(join(root,
      'modules/geospatial/scripts/geographiclib-g7-benchmark.cpp'))).digest('hex');
    const metadata = {version: '2.7', precisionBits: 53, driverSHA256, compiler: 'test fixture'};
    writeFileSync(binary, `#!${process.execPath}
import {writeFileSync} from 'node:fs';
if(process.argv[2]==='--metadata') console.log(${JSON.stringify(JSON.stringify(metadata))});
else if(process.argv[2]==='--evaluate') console.log(Array(9).fill('0 0 0 0 0 0 0').join('\\n'));
else {writeFileSync(${JSON.stringify(marker)},'timed');console.log('{"milliseconds":1,"iterations":1,"checksum":1}');}
`, {mode: 0o700});
    // Extensionless executable uses ESM explicitly, independent of temporary-directory defaults.
    writeFileSync(join(directory, 'package.json'), '{"type":"module"}');
    const result = spawnSync(process.execPath, ['modules/geospatial/scripts/benchmark-g7.mjs',
      '--baseline-ref', 'HEAD', '--points', '10', '--samples', '3', '--min-sample-ms', '0',
      '--native', binary, '--output', output], {cwd: root, encoding: 'utf8', timeout: 60000});
    assert.equal(result.error, undefined);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Actual native executable failed stored output budgets: gi/);
    assert.equal(existsSync(marker), false);
    assert.equal(existsSync(output), false);
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
});
