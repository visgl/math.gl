// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Start the terrain example with its local-source Vite config before running this check.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
const browser = await chromium.launch({headless: true});
try {
  const page = await browser.newPage({viewport: {width: 1280, height: 900}});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(process.env.TERRAIN_EXAMPLE_URL || 'http://127.0.0.1:5197');
  await page.getByText('Mesh generation', {exact: true}).click();
  await page.getByLabel('Boundary qualification study').check();
  await page.getByTestId('boundary-metrics').waitFor({timeout: 120000});
  assert.match(await page.getByTestId('boundary-metrics').innerText(), /boundary|Boundary/);
  // Exercise a static host that does not supply Content-Encoding as well as Vite's decoded response.
  await page.route(/\/artifacts\/[^/]+\.json\.gz$/, route => {
    const file = new URL(route.request().url()).pathname.split('/').pop();
    return route.fulfill({contentType: 'application/octet-stream', body: readFileSync(new URL(`../../examples/geospatial/terrain-sampling/src/qualification/artifacts/${file}`, import.meta.url))});
  });
  await page.getByLabel('Boundary algorithm').selectOption('constrained');
  await page.getByTestId('boundary-metrics').waitFor({timeout: 120000});
  assert.match(await page.getByTestId('boundary-metrics').innerText(), /precomputed-cdtr/);
  await page.screenshot({path: '/tmp/terrain-boundary-desktop.png', fullPage: true});
  await page.getByLabel('Boundary dataset').selectOption('sierra');
  await page.getByLabel('Boundary algorithm').selectOption('delatin');
  await page.getByRole('status').filter({hasText: 'Incomplete data'}).waitFor({timeout: 120000});
  await page.getByLabel('Boundary dataset').selectOption('step');
  await page.getByTestId('boundary-metrics').waitFor({timeout: 120000});
  await page.setViewportSize({width: 390, height: 844});
  assert.ok(await page.getByLabel('Boundary dataset').evaluate(e => e.getBoundingClientRect().width >= 120), 'mobile selectors remain readable');
  await page.screenshot({path: '/tmp/terrain-boundary-mobile.png', fullPage: true});
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'no horizontal overflow');
  assert.deepEqual(errors, []);
  console.log('Boundary study desktop/mobile controls, worker computation, reference label, nodata rejection and cancellation passed.');
} finally {await browser.close();}
