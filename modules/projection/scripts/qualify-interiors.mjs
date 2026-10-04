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
      response.end('<!doctype html><title>Independent interior qualification</title>');
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const browser = await browsers[name].launch({headless: true, timeout: 30000});
    const watchdog = setTimeout(() => {
      void browser.close();
    }, 30000);
    try {
      const page = await browser.newPage();
      await page.goto('http://127.0.0.1:' + server.address().port);
      const rows = await page.evaluate(async () => {
        const {qualifyInteriors} = await import('/qualification.js');
        return qualifyInteriors();
      });
      return {rows, environment: {browser: name, version: browser.version()}};
    } finally {
      clearTimeout(watchdog);
      await browser.close();
    }
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}
const root = fileURLToPath(new URL('../../../', import.meta.url));
const directory = mkdtempSync(join(tmpdir(), 'math-gl-interiors-'));
try {
  const outfile = join(directory, 'qualification.mjs');
  const bundle = await bundleRuntime(
    root,
    'modules/projection/test/spheroid-interior-entry.ts',
    outfile
  );
  const runtime = await import(pathToFileURL(outfile).href);
  const evaluation = values.browser
    ? await browserRows(outfile, values.browser)
    : {rows: runtime.qualifyInteriors(), environment: {node: process.version}};
  const {rows} = evaluation;
  const hash = createHash('sha256');
  for (const path of Object.keys(bundle.metafile.inputs).sort()) {
    hash.update(path + '\0').update(readFileSync(join(root, path)));
  }
  const summary = {};
  for (const row of rows) {
    assert(
      row.finite && row.inputUnchanged && row.failureAtomic,
      row.id + ': ownership/finiteness'
    );
    if (row.qualified) assert.equal(row.status, 'matches-reference', row.path + ': ' + row.id);
    const label = row.path + (row.qualified ? ' qualified' : ' diagnostic');
    summary[label] ??= {matchesReference: 0, outsideTolerance: 0, rejected: 0};
    summary[label][
      {
        'matches-reference': 'matchesReference',
        'outside-tolerance': 'outsideTolerance',
        rejected: 'rejected'
      }[row.status]
    ]++;
  }
  const report = {
    provenance: runtime.provenance,
    environment: {
      ...evaluation.environment,
      platform: process.platform,
      architecture: process.arch
    },
    sourceSHA256: hash.digest('hex'),
    angleToleranceRadians: runtime.angleTolerance,
    heightTolerance: 'max(1e-12, max(radii) * 2e-12) in axis units',
    note: 'Diagnostic matches do not promote unsupported domains. Passing bounded-behavior checks is not an accuracy claim.',
    summary,
    rows
  };
  if (values.output) {
    const header = JSON.stringify({...report, rows: undefined}, null, 2);
    const body = rows.map((row) => '    ' + JSON.stringify(row)).join(',\n');
    writeFileSync(values.output, header.slice(0, -2) + ',\n  "rows": [\n' + body + '\n  ]\n}\n');
  }
  console.log(JSON.stringify(summary, null, 2));
} finally {
  rmSync(directory, {recursive: true, force: true});
}
