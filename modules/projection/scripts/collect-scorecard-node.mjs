// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original reproducible scorecard collection; no network or third-party datasets.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdirSync, readFileSync, writeFileSync, renameSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {parseArgs} from 'node:util';
import {
  codeFingerprint,
  benchmarkFingerprint,
  benchmarkDependencies
} from './benchmark-metadata.mjs';
const {values} = parseArgs({
  options: {
    directory: {type: 'string'},
    points: {type: 'string', default: '20000'},
    samples: {type: 'string', default: '7'},
    'min-sample-ms': {type: 'string', default: '12'}
  }
});
assert(values.directory, '--directory required');
const directory = resolve(values.directory);
mkdirSync(directory, {recursive: true});
const sourceSHA256 = codeFingerprint(),
  workloadSHA256 = benchmarkFingerprint(),
  dependencies = benchmarkDependencies();
const reports = {};
function run(key, script, args) {
  const file = key + '.json';
  execFileSync(
    process.execPath,
    ['modules/projection/scripts/' + script, ...args, '--output', join(directory, file)],
    {stdio: 'inherit', timeout: 300000}
  );
  reports[key] = {
    file,
    sha256: createHash('sha256')
      .update(readFileSync(join(directory, file)))
      .digest('hex')
  };
}
run('accuracy', 'measure-accuracy.mjs', []);
run('throughput', 'benchmark.mjs', [
  '--points',
  values.points,
  '--samples',
  values.samples,
  '--min-sample-ms',
  values['min-sample-ms'],
  '--allocations'
]);
run('startup', 'benchmark-startup.mjs', ['--samples', values.samples]);
run('memory', 'benchmark-memory.mjs', ['--points', values.points, '--samples', values.samples]);
const bundles = execFileSync(
  process.execPath,
  ['modules/projection/scripts/check-bundle-budget.mjs', '--measure'],
  {encoding: 'utf8', timeout: 30000}
);
writeFileSync(join(directory, 'bundles.json'), bundles);
reports.bundles = {
  file: 'bundles.json',
  sha256: createHash('sha256').update(bundles).digest('hex')
};
assert.equal(codeFingerprint(), sourceSHA256, 'Source changed during collection');
assert.equal(benchmarkFingerprint(), workloadSHA256, 'Workload changed during collection');
const accuracyPath = new URL('../test/fixtures/accuracy-cases.json', import.meta.url);
const accuracyBytes = readFileSync(accuracyPath);
const accuracyProfile = {
  inputsSHA256: createHash('sha256').update(accuracyBytes).digest('hex'),
  domains: JSON.parse(accuracyBytes).cases.map(
    ({id, bounds, forwardTolerance, inverseTolerance, roundtripTolerance}) => ({
      id,
      bounds,
      forwardTolerance,
      inverseTolerance,
      roundtripTolerance
    })
  )
};
const manifest = {
  schemaVersion: 1,
  accuracyProfile,
  sourceSHA256,
  workloadSHA256,
  dependencies,
  date: new Date().toISOString(),
  gitCommit: execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim(),
  reports,
  bundleMethodology: {
    node: process.version,
    format: 'browser ESM',
    target: 'es2020',
    minified: true,
    gzipLevel: 9,
    decoderAndDataIncluded: false
  }
};
writeFileSync(join(directory, 'manifest.json.tmp'), JSON.stringify(manifest, null, 2) + '\n');
renameSync(join(directory, 'manifest.json.tmp'), join(directory, 'manifest.json'));
console.log('Node scorecard inputs collected in ' + directory);
