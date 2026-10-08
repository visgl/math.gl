// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Original fresh-process qualification against the proj4 import.
import {codeFingerprint, benchmarkDependencies} from './benchmark-metadata.mjs';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {cpus} from 'node:os';
import {parseArgs} from 'node:util';
const {values} = parseArgs({
  options: {samples: {type: 'string', default: '7'}, output: {type: 'string'}}
});
const samples = Number(values.samples);
assert(Number.isSafeInteger(samples) && samples >= 3 && samples <= 30);
const entries = {
  'native-selected': `const [{ProjectionTransform},{mercator}]=await Promise.all([import('@math.gl/projection/core'),import('@math.gl/projection/projections/merc')]);const create=()=>new ProjectionTransform({to:'EPSG:3857',projections:[mercator]});`,
  'native-barrel': `const {ProjectionTransform,mercator}=await import('@math.gl/projection');const create=()=>new ProjectionTransform({to:'EPSG:3857',projections:[mercator]});`,
  proj4: `const {default:proj4}=await import('proj4');const create=()=>{const p=proj4('WGS84','EPSG:3857');return {project:p.forward};};`,
  projection: `const {projectionEngine}=await import('@math.gl/projection');const create=()=>projectionEngine.createProjection({to:'EPSG:3857'});`
};
const results = [];
for (let sample = 0; sample < samples; sample++)
  for (const [implementation, entry] of Object.entries(entries)) {
    const source = `const start=performance.now();${entry}const loaded=performance.now();const p=create();const constructed=performance.now();const point=p.project([12,55]);const projected=performance.now();if(Math.abs(point[0]-1335833.8895192828)>1e-5)throw new Error('Startup coordinate mismatch');process.stdout.write(JSON.stringify({moduleMilliseconds:loaded-start,constructionMicroseconds:(constructed-loaded)*1000,projectionMicroseconds:(projected-constructed)*1000}));`;
    const start = performance.now();
    const child = spawnSync(process.execPath, ['--input-type=module', '-e', source], {
      encoding: 'utf8',
      timeout: 30000
    });
    assert.equal(child.status, 0, child.stderr || child.error?.message);
    results.push({
      implementation,
      sample,
      processMilliseconds: performance.now() - start,
      ...JSON.parse(child.stdout)
    });
  }
const report = {
  metadata: {
    dependencies: benchmarkDependencies(),
    sourceSHA256: codeFingerprint(),
    date: new Date().toISOString(),
    node: process.version,
    cpu: cpus()[0]?.model,
    platform: process.platform,
    arch: process.arch,
    samples
  },
  methodology:
    'A new Node process/module registry per sample. Process time includes spawning and exit; module, first construction and first transform are measured inside it. OS disk caches are not flushed. Each first transform is checked. No timing threshold in CI.',
  results
};
console.log('Fresh-process correctness passed for ' + results.length + ' samples');
if (values.output) writeFileSync(values.output, JSON.stringify(report, null, 2) + '\n');
