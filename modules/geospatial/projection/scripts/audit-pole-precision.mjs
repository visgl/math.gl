// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original comparison of independent high-precision equations and historical/current native runtimes.
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {bundleRuntime} from './benchmark-runtime.mjs';

const root = fileURLToPath(new URL('../../../../', import.meta.url));
const reference = JSON.parse(readFileSync(new URL('../test/fixtures/pole-precision-reference.json', import.meta.url)));
const temporary = mkdtempSync(join(tmpdir(), 'mathgl-pole-precision-'));
try {
  const report = {referenceGeneratorSHA256: reference.generatorSHA256, baselineCommit: '64b7fe33', cases: []};
  const engines = [];
  for (const [name, revision] of [['before', report.baselineCommit], ['after', undefined]]) {
    const file = join(temporary, name + '.mjs');
    await bundleRuntime(root, 'modules/geospatial/src/projection/experimental/index.ts', file, revision);
    const api = await import(pathToFileURL(file).href);
    const plugins = Object.values(api).filter(v => v && typeof v === 'object' && 'create' in v);
    engines.push({name, create: definition => new api.ProjectionTransform({from: '+proj=longlat +datum=none', to: definition, projections: plugins})});
  }
  for (const [index, row] of reference.cases.entries()) {
    const results = {};
    for (const engine of engines) {
      const transform = engine.create(row.definition);
      const errors = {};
      if (!row.inverseOnly) {
        const xy = transform.project(row.input);
        errors.forward = Math.max(...xy.slice(0, 2).map((v, i) => Math.abs(v - row.forward[i])));
      }
      if (row.inverse) {
        const ll = transform.unproject(row.forward);
        errors.inverseLatitude = Math.abs(ll[1] - row.inverse[1]);
      }
      results[engine.name] = errors;
    }
    results.native = {};
    if (row.nativeForward) results.native.forward = Math.max(...row.nativeForward.map((v, i) => Math.abs(v - row.forward[i])));
    if (row.nativeInverse) results.native.inverseLatitude = Math.abs(row.nativeInverse[1] - row.inverse[1]);
    report.cases.push({index, definition: row.definition, input: row.input, results});
  }
  writeFileSync(new URL('../test/fixtures/pole-precision-qualification.json', import.meta.url), JSON.stringify({...report, cases: undefined}, null, 2).slice(0, -2) + ',\n  \"cases\": [\n' + report.cases.map(row => '    ' + JSON.stringify(row)).join(',\n') + '\n  ]\n}\n');
  for (const name of ['before', 'after', 'native'])
    console.log(name, 'max metres', Math.max(...report.cases.map(c => c.results[name].forward || 0)), 'max inverse latitude degrees', Math.max(...report.cases.map(c => c.results[name].inverseLatitude || 0)));
} finally {
  rmSync(temporary, {recursive: true, force: true});
}
