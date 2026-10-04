// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Original diagnostic report. Authored nonlinear fields and independent inverse targets; no model accuracy certificate.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {createServer} from 'node:http';
import {chromium, firefox, webkit} from 'playwright';
import {join, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {parseArgs} from 'node:util';
import {bundleRuntime} from './benchmark-runtime.mjs';
const {values} = parseArgs({
  options: {
    output: {type: 'string'},
    browser: {type: 'string'},
    model: {type: 'string'},
    reference: {type: 'string'}
  }
});
assert.equal(
  Boolean(values.model),
  Boolean(values.reference),
  'Supply both --model and --reference'
);
assert(
  !values.model || !values.browser,
  'Application factories are qualified locally in Node; authored corpus supports browsers'
);
const browsers = {chromium, firefox, webkit};
assert(!values.browser || Object.hasOwn(browsers, values.browser), 'Unknown browser');

async function browserRows(outfile, name) {
  const server = createServer((request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    if (request.url === '/qualification.js') {
      response.setHeader('Content-Type', 'text/javascript');
      response.end(readFileSync(outfile));
    } else {
      response.setHeader('Content-Type', 'text/html');
      response.end('<!doctype html><title>Independent deformation qualification</title>');
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const browser = await browsers[name].launch({headless: true, timeout: 30000});
    const watchdog = setTimeout(() => {
      void browser.close();
    }, 30000);
    try {
      const page = await browser.newPage();
      await page.goto('http://127.0.0.1:' + server.address().port);
      const rows = await page.evaluate(async () => {
        const {qualifyAuthoredDeformations} = await import('/qualification.js');
        return qualifyAuthoredDeformations();
      });
      return {rows, environment: {browser: name, version: browser.version()}};
    } finally {
      clearTimeout(watchdog);
      await browser.close();
    }
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
}
const root = fileURLToPath(new URL('../../../', import.meta.url));
const directory = mkdtempSync(join(tmpdir(), 'math-gl-deformation-stress-'));
try {
  const outfile = join(directory, 'qualification.mjs');
  const bundle = await bundleRuntime(
    root,
    'modules/projection/test/deformation-stress-workload.ts',
    outfile
  );
  const runtime = await import(pathToFileURL(outfile).href);
  let reference = runtime.reference;
  let modelEntrySHA256;
  let evaluation;
  if (values.model) {
    reference = JSON.parse(readFileSync(resolve(values.reference), 'utf8'));
    assert.equal(reference.schemaVersion, 1, 'Reference schema version');
    assert.equal(reference.distanceUnit, 'm', 'Reference distances must be metres');
    assert.equal(reference.velocityUnit, 'm/year', 'Explicit velocity contract');
    assert(
      reference.provenance &&
        ['authority', 'version', 'reference', 'license', 'modelRevision'].every(
          key => typeof reference.provenance[key] === 'string' && reference.provenance[key].trim()
        ),
      'Reviewed provenance is required'
    );
    const range = reference.epochRange;
    assert(
      Array.isArray(range) &&
        range.length === 2 &&
        range.every(Number.isFinite) &&
        range[0] <= range[1],
      'Declared ordered epoch interval'
    );
    assert(Array.isArray(reference.cases) && reference.cases.length, 'Independent cases required');
    assert(
      reference.forwardToleranceMeters === reference.inverseToleranceMeters,
      'Harness requires one explicit numerical allowance'
    );
    for (const row of reference.cases) {
      assert(typeof row.id === 'string' && row.id.trim(), 'Named reference case');
      for (const epoch of [row.sourceEpoch, row.targetEpoch])
        assert(
          Number.isFinite(epoch) && epoch >= range[0] && epoch <= range[1],
          'Reference epoch outside declared interval'
        );
    }
    const modulePath = resolve(values.model);
    modelEntrySHA256 = createHash('sha256').update(readFileSync(modulePath)).digest('hex');
    const {createModel} = await import(pathToFileURL(modulePath).href);
    assert.equal(
      typeof createModel,
      'function',
      'Application module must export createModel(referenceCase)'
    );
    const results = reference.cases.map(row =>
      runtime.qualifyDeformationModel(createModel(row), [row], reference.forwardToleranceMeters)
    );
    evaluation = {
      rows: results.map((result, i) => ({shape: reference.cases[i].id, ...result})),
      environment: {node: process.version}
    };
  } else {
    evaluation = values.browser
      ? await browserRows(outfile, values.browser)
      : {rows: runtime.qualifyAuthoredDeformations(), environment: {node: process.version}};
  }
  const {rows} = evaluation;
  const hash = createHash('sha256');
  for (const path of Object.keys(bundle.metafile.inputs).sort()) {
    hash.update(path + '\0').update(readFileSync(join(root, path)));
  }
  const summary = rows.map(row => ({
    shape: row.shape,
    cases: row.results.length,
    maximumForwardError: row.maximumForwardError,
    maximumInverseError: row.maximumInverseError,
    maximumInverseClosure: row.maximumInverseClosure
  }));
  const report = {
    provenance: reference.provenance,
    oracle: reference.oracle,
    generatorSHA256: reference.generatorSHA256,
    referenceSHA256: createHash('sha256')
      .update(
        readFileSync(
          values.reference
            ? resolve(values.reference)
            : join(root, 'modules/projection/test/fixtures/deformation-stress-reference.json')
        )
      )
      .digest('hex'),
    modelEntrySHA256,
    profile: values.model ? 'application-provided' : 'authored-stress',
    epochRange: reference.epochRange,
    environment: {
      ...evaluation.environment,
      platform: process.platform,
      architecture: process.arch
    },
    sourceSHA256: hash.digest('hex'),
    toleranceMeters: reference.forwardToleranceMeters,
    note: 'Passing supplied references is a sampled numerical check, not an authoritative accuracy or licensing certificate. Application provenance, model terms, reference independence and imported factory dependencies remain caller-reviewed.',
    summary,
    rows
  };
  if (values.output) {
    const header = JSON.stringify({...report, rows: undefined}, null, 2);
    const body = rows.map(row => '    ' + JSON.stringify(row)).join(',\n');
    writeFileSync(values.output, header.slice(0, -2) + ',\n  "rows": [\n' + body + '\n  ]\n}\n');
  }
  console.log(JSON.stringify(summary, null, 2));
} finally {
  rmSync(directory, {recursive: true, force: true});
}
