// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('../../../../', import.meta.url));
const guardPath = 'modules/geospatial/projection/scripts/check-spheroid-allocations.mjs';
const derivativePath = 'modules/geospatial/src/projection/numerical-derivative.ts';
const guard = readFileSync(join(root, guardPath), 'utf8');

function runGuard(mutate = source => source) {
  const directory = mkdtempSync(join(tmpdir(), 'math-gl-allocation-guard-'));
  try {
    // Copy the guard's actual source inputs so mutations never touch the checkout.
    const paths = [...guard.matchAll(/'(modules\/[^']+\.ts)'/g)].map(match => match[1]);
    for (const path of [guardPath, ...paths]) {
      const destination = join(directory, path);
      mkdirSync(dirname(destination), {recursive: true});
      const source = readFileSync(join(root, path), 'utf8');
      writeFileSync(destination, path === derivativePath ? mutate(source) : source);
    }
    symlinkSync(join(root, 'node_modules'), join(directory, 'node_modules'), 'dir');
    return spawnSync(process.execPath, [join(directory, guardPath)], {encoding: 'utf8'});
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
}

test('guard accepts reusable derivative scratch allocated during construction', () => {
  const result = runGuard();
  assert.equal(result.status, 0, result.stderr);
});

for (const method of ['evaluate', 'difference']) {
  test(`guard identifies missing NumericalDerivative.${method}`, () => {
    const result = runGuard(source => source.replace(`${method}(step:`, `renamed(step:`));
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Guarded functions must remain present/);
    assert.ok(result.stderr.includes(`${derivativePath}:${method}`), result.stderr);
  });

  test(`guard rejects coordinate-path allocation in NumericalDerivative.${method}`, () => {
    const result = runGuard(source =>
      source.replace(
        new RegExp(`(${method}\\(step:[^\\n]+\\{)`),
        '$1\n    const allocated = [0, 0, 0];'
      )
    );
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Explicit successful coordinate allocations/);
    assert.ok(result.stderr.includes(`(${method})`), result.stderr);
  });
}
