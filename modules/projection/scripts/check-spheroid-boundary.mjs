// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Original selective graph qualification; historical and current source builds use identical entries.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';
import {parseArgs} from 'node:util';
import {transform} from 'esbuild';
import {bundleRuntime} from './benchmark-runtime.mjs';
const {values} = parseArgs({options: {'baseline-ref': {type: 'string'}, output: {type: 'string'}}});
const root = fileURLToPath(new URL('../../../', import.meta.url));
const baselineCommit = values['baseline-ref']
  ? execFileSync('git', ['rev-parse', '--verify', values['baseline-ref'] + '^{commit}'], {
      cwd: root,
      encoding: 'utf8'
    }).trim()
  : undefined;
const directory = mkdtempSync(join(tmpdir(), 'math-gl-spheroid-graphs-'));
const fixtures = {
  projectionBulk: "export * from '@math.gl/projection/bulk';",
  projectionAnalysis: "export * from '@math.gl/projection/analysis';",
  numericLeaf: "export * from '@math.gl/core/spheroid';",
  coreRoot: "export * from '@math.gl/core';",
  projectionCore: "export {ProjectionEngine} from '@math.gl/projection/core';",
  projectionPipeline: "export {ProjectionPipeline} from '@math.gl/projection/pipeline';",
  geospatialEllipsoid: "export {Ellipsoid} from '@math.gl/geospatial';"
};
const rows = [];
try {
  for (const [name, contents] of Object.entries(fixtures)) {
    const entry = join(directory, name + '.ts');
    writeFileSync(entry, contents);
    const measurements = [];
    for (const revision of baselineCommit &&
    !['numericLeaf', 'projectionAnalysis', 'projectionBulk'].includes(name)
      ? ['baseline', 'candidate']
      : ['candidate']) {
      const outfile = join(directory, name + '-' + revision + '.mjs');
      const result = await bundleRuntime(
        root,
        relative(root, entry),
        outfile,
        revision === 'baseline' ? baselineCommit : undefined
      );
      const inputs = Object.keys(result.metafile.inputs).map(path => path.replaceAll('\\', '/'));
      if (revision === 'candidate') {
        if (name !== 'projectionBulk')
          assert(
            inputs.every(path => !path.endsWith('modules/projection/src/bulk.ts')),
            'Optional bulk must stay outside existing graphs'
          );
        if (name !== 'projectionAnalysis')
          assert(
            inputs.every(path => !path.endsWith('modules/projection/src/analysis.ts')),
            'Optional analysis must stay outside existing graphs'
          );
        const leaf = inputs.filter(path => path.endsWith('modules/core/src/spheroid.ts'));
        if (['projectionAnalysis', 'projectionBulk'].includes(name)) {
          assert.equal(leaf.length, 0);
          assert.equal(inputs.filter(path => /modules\/.*\/src\//.test(path)).length, 1);
        } else if (name === 'coreRoot')
          assert.equal(leaf.length, 0, 'Core root must not retain the optional spheroid leaf');
        else assert.equal(leaf.length, 1, 'Exactly one shared numeric source per selected graph');
        if (name === 'numericLeaf') {
          assert.equal(
            inputs.filter(path => /(?:^|\/)modules\//.test(path)).length,
            1,
            'Numeric leaf must have no runtime dependencies'
          );
        }
        if (name.startsWith('projection'))
          assert(
            inputs.every(path => !/modules\/(geospatial|culling)\//.test(path)),
            'Projection cannot import geometry classes/culling'
          );
      }
      const {code} = await transform(readFileSync(outfile, 'utf8'), {
        minify: true,
        target: 'es2020',
        legalComments: 'none'
      });
      measurements.push({
        revision,
        minified: Buffer.byteLength(code),
        gzip: gzipSync(code, {level: 9}).length,
        runtimeSources: inputs.filter(
          path => /(?:^|\/)modules\//.test(path) && path.includes('/src/')
        )
      });
    }
    const candidate = measurements.at(-1);
    if (name === 'numericLeaf') {
      assert(
        candidate.minified <= 3200 && candidate.gzip <= 1500,
        'Reviewed standalone leaf size budget'
      );
    }
    if (name === 'projectionBulk')
      assert(
        candidate.minified <= 6500 && candidate.gzip <= 2100,
        'Reviewed optional bulk size budget'
      );
    if (name === 'projectionAnalysis')
      assert(
        candidate.minified <= 4900 && candidate.gzip <= 1800,
        'Reviewed optional analysis size budget'
      );
    rows.push({
      name,
      measurements,
      ...(measurements.length === 2
        ? {
            delta: {
              minified: candidate.minified - measurements[0].minified,
              gzip: candidate.gzip - measurements[0].gzip
            }
          }
        : {})
    });
  }
  const report = {
    schemaVersion: 1,
    baselineCommit,
    methodology:
      'Identical source-level ESM entries and historical/current source resolver; browser/es2020, esbuild minification and gzip level 9. Numeric leaf is new, with no historical equivalent. Graph checks require no class/culling dependencies for projection, no runtime dependency for the leaf, and no retained leaf in core root. Module loading/setup timing is measured separately.',
    rows
  };
  console.table(
    rows.map(({name, measurements, delta}) => ({
      name,
      ...measurements.at(-1),
      runtimeSources: undefined,
      deltaMinified: delta?.minified,
      deltaGzip: delta?.gzip
    }))
  );
  if (values.output) writeFileSync(values.output, JSON.stringify(report, null, 2) + '\n');
} finally {
  rmSync(directory, {recursive: true, force: true});
}
