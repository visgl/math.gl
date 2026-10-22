// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {bundleRuntime} from './benchmark-runtime.mjs';

const temporary = mkdtempSync(join(tmpdir(), 'mathgl-pole-audit-'));
try {
  const outfile = join(temporary, 'audit.mjs');
  await bundleRuntime(fileURLToPath(new URL('../../../../', import.meta.url)),
    'modules/geospatial/projection/test/pole-audit-workload.ts', outfile);
  const {runPoleAudit} = await import(pathToFileURL(outfile).href);
  const cases = runPoleAudit();
  const reference = JSON.parse(readFileSync(new URL('../test/fixtures/pole-audit-reference.json', import.meta.url)));
  const report = {oracle: 'pyproj 3.7.2 / PROJ 9.5.1',
    referenceSourceSHA256: reference.sourceSHA256,
    referenceGeneratorSHA256: reference.generatorSHA256,
    methodology: 'Unchanged definitions except documented non-ellipsoid aliases/defaults. Forward error in metres (1 mm + 1e-12 relative screening); inverse in degrees (1e-6 screening), with longitude weighted by cos(latitude) at collapsed poles. Pole-line maps and noncollapsed conic pole arcs retain unweighted longitude. All oracle rejections and disagreements are retained. Screening is an audit, not a global accuracy guarantee.',
    cases};
  const output = process.argv[2];
  if (output) writeFileSync(output, JSON.stringify(report, null, 2) + '\n');
  console.log(`${cases.length} configurations; ${cases.reduce((n, c) => n + c.probes, 0)} probes; ${cases.filter(c => c.mismatches.length).length} configurations with retained findings`);
  for (const c of cases.filter(c => c.mismatches.length))
    console.log(c.id, c.mismatches.length, c.errors.forward, c.errors.inverse,
      [...new Set(c.mismatches.map(m => m.kind))].join(', '));
} finally {
  rmSync(temporary, {recursive: true, force: true});
}
