// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Original diagnostic report. Only explicitly qualified rows gate accuracy.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {createServer} from 'node:http';
import {chromium, firefox, webkit} from 'playwright';
import {join} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {parseArgs} from 'node:util';
import {bundleRuntime} from './benchmark-runtime.mjs';
const {values} = parseArgs({options: {output: {type: 'string'}, browser: {type: 'string'}}});
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
      response.end('<!doctype html><title>G5–G6 qualification</title>');
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
        const {qualifyG56} = await import('/qualification.js');
        return qualifyG56();
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
const root = fileURLToPath(new URL('../../../../', import.meta.url));
const directory = mkdtempSync(join(tmpdir(), 'math-gl-g56-'));
try {
  const outfile = join(directory, 'qualification.mjs');
  const bundle = await bundleRuntime(
    root,
    'modules/geospatial/projection/test/g56-entry.ts',
    outfile
  );
  const runtime = await import(pathToFileURL(outfile).href);
  const evaluation = values.browser
    ? await browserRows(outfile, values.browser)
    : {rows: runtime.qualifyG56(), environment: {node: process.version}};
  const {rows} = evaluation;
  const hash = createHash('sha256');
  for (const path of Object.keys(bundle.metafile.inputs).sort()) {
    hash.update(path + '\0').update(readFileSync(join(root, path)));
  }
  const summary = {};
  for (const row of rows) {
    summary[row.family] ??= {rows: 0, failed: 0, maxBudgetUsage: 0, maxNativeAreaDiscrepancy: 0};
    const group = summary[row.family];
    ++group.rows;
    if (!row.passed) ++group.failed;
    group.maxBudgetUsage = Math.max(group.maxBudgetUsage, row.budgetUsage);
    group.maxNativeAreaDiscrepancy = Math.max(
      group.maxNativeAreaDiscrepancy,
      row.nativeAreaDiscrepancy || 0
    );
  }
  const report = {
    provenance: runtime.provenance,
    environment: {
      ...evaluation.environment,
      platform: process.platform,
      architecture: process.arch
    },
    sourceSHA256: hash.digest('hex'),
    note: 'Bounded G5–G6 profile. Rhumb native and independent integral controls; bounded intersections include native counts and residual gates. Capture-bound completeness is additionally gated by the global G6 matrix.',
    summary,
    rows
  };
  if (values.output) {
    const header = JSON.stringify({...report, rows: undefined}, null, 2);
    const body = rows.map(row => '    ' + JSON.stringify(row)).join(',\n');
    writeFileSync(values.output, header.slice(0, -2) + ',\n  "rows": [\n' + body + '\n  ]\n}\n');
  }
  console.log(JSON.stringify(summary, null, 2));
  assert(
    rows.every(row => row.passed),
    JSON.stringify(rows.filter(row => !row.passed))
  );
} finally {
  rmSync(directory, {recursive: true, force: true});
}
