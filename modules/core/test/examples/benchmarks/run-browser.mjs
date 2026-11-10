// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {build, preview} from 'vite';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {chromium} from 'playwright';

const fixtureRoot = fileURLToPath(new URL('.', import.meta.url));
process.chdir(fixtureRoot);
const outDir = await mkdtemp(join(tmpdir(), 'mathgl-core-benchmarks-'));
const options = {
  root: fixtureRoot,
  configFile: fileURLToPath(new URL('../../../../../examples/vite.config.local.mjs', import.meta.url)),
  worker: {format: 'es'},
  build: {outDir, emptyOutDir: true},
  preview: {host: '127.0.0.1', port: 0}
};
await build(options);
const server = await preview(options);
const browser = await chromium.launch();
try {
  const page = await browser.newPage({viewport: {width: 390, height: 844}});
  page.setDefaultTimeout(60000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {if (message.type() === 'error') console.error(message.text());});
  await page.goto(server.resolvedUrls.local[0]);
  await page.getByRole('status').filter({hasText: 'Ready'}).waitFor();
  assert.equal(page.workers().length, 0, 'Reading the guide must not launch benchmarks');
  const started = page.waitForEvent('worker');
  await page.getByRole('button', {name: 'Run benchmarks'}).click();
  const first = await started;
  await page.waitForFunction(() => document.querySelector('.probe-bench-results tbody td') || document.querySelector('[role=status]')?.textContent.startsWith('Error:'));
  assert(!((await page.getByRole('status').innerText()).startsWith('Error:')), await page.getByRole('status').innerText());
  await page.locator('.probe-bench-results tbody td').first().waitFor();
  console.log('Benchmark produced real results.');
  const stopped = new Promise(resolve => first.once('close', resolve));
  await page.getByRole('button', {name: 'Stop', exact: true}).click();
  await stopped;
  console.log('Benchmark worker stopped.');
  assert.equal(await page.getByRole('status').innerText(), 'Stopped');
  const count = await page.locator('.probe-bench-results tbody tr').count();
  await page.waitForTimeout(200);
  assert.equal(await page.locator('.probe-bench-results tbody tr').count(), count);

  await page.getByRole('combobox', {name: 'Suite'}).selectOption('all');
  const restarted = page.waitForEvent('worker');
  await page.getByRole('button', {name: 'Run benchmarks'}).click();
  const second = await restarted;
  assert.notEqual(second, first);
  await page.waitForFunction(() => document.querySelector('.probe-bench-results tbody td') || document.querySelector('[role=status]')?.textContent.startsWith('Error:'));
  assert(!((await page.getByRole('status').innerText()).startsWith('Error:')), await page.getByRole('status').innerText());
  await page.locator('.probe-bench-results tbody td').first().waitFor();
  assert.equal(await page.getByRole('status').innerText(), 'Running');
  const disposed = new Promise(resolve => second.once('close', resolve));
  await page.evaluate(() => window.unmountBenchmarks());
  await disposed;
  console.log('Benchmark worker disposed.');
  assert.equal(await page.locator('.probe-bench-results').count(), 0);
  assert.deepEqual(errors, []);
  console.log('Inline benchmark: no autorun, real results, stop, restart, and worker disposal passed.');
} finally {
  await browser.close();
  server.httpServer.closeAllConnections?.();
  await new Promise(resolve => server.httpServer.close(resolve));
  await rm(outDir, {recursive: true, force: true});
}
