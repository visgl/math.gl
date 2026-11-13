// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {execFileSync} from 'node:child_process';
import {readFileSync, writeFileSync, mkdtempSync, rmSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL, fileURLToPath} from 'node:url';
import {bundleRuntime} from '../modules/geospatial/scripts/projection/benchmark-runtime.mjs';
import {buildCandidate, qualify} from '../examples/geospatial/terrain-sampling/src/qualification/qualify.mjs';
const folder = new URL('../examples/geospatial/terrain-sampling/src/qualification/artifacts/', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('manifest.json', folder)));
const temp = mkdtempSync(join(tmpdir(), 'mathgl-boundary-'));
try {
  const runtime = join(temp, 'runtime.mjs');
  await bundleRuntime(fileURLToPath(new URL('../', import.meta.url)), './modules/geospatial/src/terrain/index.ts', runtime);
  const api = await import(pathToFileURL(runtime));
  const results = [];
  for (const c of manifest.cases) {
    const bytes = readFileSync(new URL(c.file, folder));
    if (createHash('sha256').update(bytes).digest('hex') !== c.sha256) throw new Error(`Hash mismatch: ${c.file}`);
    const fixture = JSON.parse(gunzipSync(bytes));
    for (const algorithm of ['regular', 'martini', 'delatin', 'constrained']) {
      process.stderr.write(`${c.name} ${c.tolerance} ${algorithm}\n`);
      if (c.name === 'sierra' && ['martini', 'delatin'].includes(algorithm)) {
        let error;
        try {buildCandidate(api, fixture, algorithm);} catch (e) {error = e.message;}
        if (!error) throw new Error('Adaptive nodata policy changed; revisit qualification');
        results.push({name: c.name, tolerance: c.tolerance, algorithm, status: 'unsupported-nodata', reason: error});
        continue;
      }
      const mesh = buildCandidate(api, fixture, algorithm);
      const measured = qualify(fixture, mesh);
      const {crossingTriangles, uncoveredIntervals, ...boundary} = measured.boundary;
      results.push({name: c.name, tolerance: c.tolerance, algorithm, status: 'measured', ...measured,
        boundary: {...boundary, crossingTriangleCount: crossingTriangles.length, uncoveredIntervalCount: uncoveredIntervals.length}});
    }
  }
  const report = {mathglRevision: execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim(), runtime: process.version, studyRevision: manifest.studyRevision, interpretation: 'Unit sample-lattice XY; heights in metres. Surface errors and coverage are sampled estimates, not continuous certificates. Boundary height maxima use triangle-clipped intervals. The derived coast is a study scenario, not geographic ground truth.', results};
  writeFileSync(new URL('../test/terrain-boundaries/results.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
} finally {rmSync(temp, {recursive: true, force: true});}
