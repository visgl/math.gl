// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Original PROJ-reference accuracy reporting for the proj4js-inspired API.
import {build} from 'esbuild';
import {mkdtempSync, rmSync, writeFileSync, readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {parseArgs} from 'node:util';
import {codeFingerprint} from './benchmark-metadata.mjs';
const {values} = parseArgs({options: {output: {type: 'string'}}});
const directory = mkdtempSync(join(tmpdir(), 'math-gl-accuracy-'));
try {
  const outfile = join(directory, 'accuracy.mjs');
  await build({
    entryPoints: [fileURLToPath(new URL('../test/accuracy-workload.ts', import.meta.url))],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'node',
    tsconfigRaw: {}
  });
  const {qualifyAccuracy} = await import(pathToFileURL(outfile).href);
  const cases = qualifyAccuracy();
  const report = {
    sourceSHA256: codeFingerprint(),
    node: process.version,
    referenceSHA256: createHash('sha256')
      .update(readFileSync(new URL('../test/fixtures/accuracy-reference.json', import.meta.url)))
      .digest('hex'),
    oracle: 'pyproj 3.7.2 / PROJ 9.5.1',
    methodology:
      'Maximum absolute component error for scalar and Float64 XYZM paths, within explicit seeded domains. Forward versus PROJ in metres; inverse from PROJ coordinates versus PROJ inverse in degrees; roundtrip versus input in degrees. Sampled observations, not global error bounds. No rejected samples discarded.',
    cases
  };
  if (values.output) writeFileSync(values.output, JSON.stringify(report, null, 2) + '\n');
  console.log(
    `Accuracy budgets passed: ${cases.length} domains, ${cases.reduce((n, row) => n + row.points, 0)} points.`
  );
} finally {
  rmSync(directory, {recursive: true, force: true});
}
