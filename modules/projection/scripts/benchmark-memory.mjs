// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original isolated GC checkpoint diagnostic, distinct from allocation sampling and peak memory.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {cpus} from 'node:os';
import {parseArgs} from 'node:util';
import {codeFingerprint, benchmarkDependencies} from './benchmark-metadata.mjs';
const {values} = parseArgs({
  options: {
    points: {type: 'string', default: '20000'},
    samples: {type: 'string', default: '3'},
    output: {type: 'string'}
  }
});
const points = Number(values.points),
  samples = Number(values.samples);
assert(Number.isSafeInteger(points) && points >= 10 && points <= 1000000);
assert(Number.isSafeInteger(samples) && samples >= 3 && samples <= 30);
const dependencies = benchmarkDependencies();
const implementations = ['math.gl flat', 'math.gl scalar', 'proj4js ' + dependencies.proj4.version];
const results = [];
for (let sample = 0; sample < samples; sample++) {
  for (const [index, implementation] of implementations.entries()) {
    const entry =
      index === 2
        ? "const {default:proj4}=await import('proj4');const project=proj4('WGS84','EPSG:3857').forward;"
        : "const [{ProjectionEngine},{mercator}]=await Promise.all([import('@math.gl/projection/core'),import('@math.gl/projection/projections/merc')]);const engine=new ProjectionEngine({to:'EPSG:3857',projections:[mercator]});const project=p=>engine.project(p);";
    const source = `
      const checkpoint=()=>{global.gc();global.gc();return process.memoryUsage();};
      const before=checkpoint();
      ${entry}
      const prepared=checkpoint();
      const input=new Float64Array(${points}*4),output=new Float64Array(input.length),scalar=[12,55,7,8];
      for(let i=0;i<input.length;i+=4){input.set(scalar,i);}
      const storage=checkpoint();
      for(let repeat=0;repeat<10;repeat++){
        output.set(input);
        ${index === 0 ? 'engine.projectFlatSync(output,4);' : `for(let i=0;i<input.length;i+=4){const result=project(scalar);for(let k=0;k<4;k++)output[i+k]=result[k];}`}
      }
      if(Math.abs(output[0]-1335833.8895192828)>1e-5 || Math.abs(output[1]-7361866.113051188)>1e-5 || output[2]!==7 || output[3]!==8)throw new Error('Memory workload coordinate mismatch');
      const steady=checkpoint();
      // Keep both owned buffers alive across the final checkpoint.
      process.stdout.write(JSON.stringify({before,prepared,storage,steady,ownedCoordinateBytes:input.byteLength+output.byteLength,checksum:output[0]+input[0]}));
    `;
    const child = spawnSync(
      process.execPath,
      ['--expose-gc', '--input-type=module', '-e', source],
      {encoding: 'utf8', timeout: 30000}
    );
    assert.equal(child.status, 0, child.stderr || child.error?.message);
    results.push({implementation, sample, ...JSON.parse(child.stdout)});
  }
}
const report = {
  schemaVersion: 1,
  metadata: {
    sourceSHA256: codeFingerprint(),
    dependencies,
    date: new Date().toISOString(),
    node: process.version,
    v8: process.versions.v8,
    platform: process.platform,
    arch: process.arch,
    cpu: cpus()[0]?.model,
    points,
    samples
  },
  methodology:
    'Independent --expose-gc Node processes per implementation/sample. Two forced GCs at before-import, prepared converter, two owned Float64 XYZM buffers, and after ten complete forward Web Mercator batches. MemoryUsage byte snapshots are retained state/RSS observations, not peak working set, allocation counts, browser heap estimates or confidence intervals. GC/JIT/allocator and instrumentation costs affect the observations. Both buffers remain live and coordinates are checked.',
  results
};
if (values.output) writeFileSync(values.output, JSON.stringify(report, null, 2) + '\n');
console.log(
  'Fresh-process memory checkpoints and correctness passed for ' + results.length + ' samples'
);
