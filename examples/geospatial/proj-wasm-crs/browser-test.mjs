// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {serve} from './server.mjs';

const {server, url} = await serve();
let browser;
try {
  browser = await chromium.launch({headless: true});
  const page = await browser.newPage();
  const external = [];
  page.on('request', (request) => {
    if (!request.url().startsWith(url)) external.push(request.url());
  });
  await page.goto(url);
  await page.waitForFunction(() => globalThis.exampleComplete, null, {timeout: 60000});
  const result = await page.evaluate(() => globalThis.exampleResult);
  assert.equal(result.lookup.identifier, 'EPSG:8857');
  for (let i = 0; i < 3; i++) {
    assert.ok(Math.abs(result.mathgl[i] - result.wasm[i]) < 1e-6);
    assert.ok(Math.abs(result.inverse[i] - result.input[i]) < 1e-8);
  }
  assert.equal(result.compoundType, 'CompoundCRS');
  assert.equal(result.batch.transferred, true);
  assert.equal(result.batch.workerParity, true);
  assert.equal(result.batch.staleDiscarded, true);
  assert.deepEqual(result.batch.rows, [7, 11, 19]);
  for (let i = 0; i < result.batch.input.length; i++)
    assert.ok(Math.abs(result.batch.inverse[i] - result.batch.input[i]) < 1e-8);
  for (let i = 0; i < 3; i++)
    assert.ok(Math.abs(result.batch.projected[i] - result.mathgl[i]) < 1e-6);

  assert(result.raster.transferred);assert(result.raster.workerParity);
  assert(result.raster.triangles>100);
  assert(result.raster.batches>1);
  assert(result.raster.maximumDifference<1e-8);
  assert(result.raster.probeError<=4);
  assert.match(result.unsupported, /compound|vertical/i);
  assert.deepEqual(external, [], 'Example loads all assets locally');
  console.log(
    'Chromium: real database lookup, native/PROJ agreement, unsupported CRS and local assets passed'
  );
} finally {
  if (browser) await browser.close();
  await new Promise((done) => server.close(done));
}
