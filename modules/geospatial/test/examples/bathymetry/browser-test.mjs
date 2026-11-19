// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {preview} from 'vite';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import {gzipSync} from 'node:zlib';
import {
  STANDARD_DEPTHS,
  WOA23_MANIFEST_URL,
  WOA23_PREVIEW_URL,
  syntheticProfileSource
} from '../../../../../examples/geospatial/bathymetry/src/profile-sources.js';

// Offline stand-in for the pinned WOA23 preview: synthetic profiles in the same format.
const previewManifest = {
  latitudes: [-60, -30, 0, 12, 30, 60],
  longitudes: Array.from({length: 12}, (_, i) => -180 + 30 * i),
  depths: STANDARD_DEPTHS,
  temperature: {scale: 0.01, fill: -32768},
  salinity: {scale: 0.01, fill: 65535}
};
const previewCells = previewManifest.latitudes.length * previewManifest.longitudes.length;
const previewTemperature = new Int16Array(previewCells * STANDARD_DEPTHS.length);
const previewSalinity = new Uint16Array(previewCells * STANDARD_DEPTHS.length);
previewManifest.latitudes.forEach((latitude, row) =>
  previewManifest.longitudes.forEach((longitude, col) => {
    const profile = syntheticProfileSource.getProfile(longitude, latitude);
    const offset = (row * previewManifest.longitudes.length + col) * STANDARD_DEPTHS.length;
    profile.temperature.forEach((t, i) => {
      previewTemperature[offset + i] = Math.round(t * 100);
    });
    profile.practicalSalinity.forEach((value, i) => {
      previewSalinity[offset + i] = Math.round(value * 100);
    });
  })
);
const previewBody = gzipSync(
  Buffer.concat([Buffer.from(previewTemperature.buffer), Buffer.from(previewSalinity.buffer)])
);

const server = await preview({
  configFile: false,
  root: fileURLToPath(new URL('../../../../../examples/geospatial/bathymetry/', import.meta.url)),
  preview: {host: '127.0.0.1', port: 0}
});
const browser = await chromium.launch({
  args: ['--enable-unsafe-swiftshader'],
  executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH
});
try {
  const page = await browser.newPage({viewport: {width: 1200, height: 800}});
  const errors = [];
  const png = new PNG({width: 256, height: 256});
  for (let y = 0; y < 256; y++)
    for (let x = 0; x < 256; x++) {
      const value = 32768 - 4000 + Math.round(100 * Math.sin(x / 10) * Math.cos(y / 10));
      const i = (y * 256 + x) * 4;
      png.data[i] = value >> 8;
      png.data[i + 1] = value & 255;
      png.data[i + 2] = 0;
      png.data[i + 3] = 255;
    }
  const tile = PNG.sync.write(png);
  let tileRequests = 0;
  await page.route('https://s3.amazonaws.com/elevation-tiles-prod/**', route => {
    tileRequests++;
    return route.fulfill({contentType: 'image/png', body: tile});
  });
  let previewRequests = 0;
  await page.route(WOA23_MANIFEST_URL, route => {
    previewRequests++;
    return route.fulfill({contentType: 'application/json', body: JSON.stringify(previewManifest)});
  });
  await page.route(WOA23_PREVIEW_URL, route => {
    previewRequests++;
    return route.fulfill({contentType: 'application/octet-stream', body: previewBody});
  });
  page.on('pageerror', error => errors.push(error.message));
  const response = await fetch(server.resolvedUrls.local[0]);
  assert.equal(response.status, 200, 'Built preview serves index');
  await response.text();
  await page.goto(server.resolvedUrls.local[0], {waitUntil: 'domcontentloaded', timeout: 60000});
  await page.waitForFunction(() =>
    document.querySelector('[data-role=status]').textContent.includes('260,281')
  );
  await page.locator('[data-role=zoom]').fill('4');
  await page.waitForFunction(
    () => document.querySelector('output').textContent === '1.0× vertical exaggeration'
  );
  await page.waitForFunction(
    () => document.querySelector('[data-role=detail]').textContent.startsWith('Refined'),
    {},
    {timeout: 60000}
  );
  assert.ok(tileRequests > 0, 'Zoom requested higher-resolution tile resources');
  // A failed finer-region replacement must retain the already resident terrain.
  await page.unroute('https://s3.amazonaws.com/elevation-tiles-prod/**');
  await page.route('https://s3.amazonaws.com/elevation-tiles-prod/**', route =>
    route.fulfill({status: 503, body: 'offline test'})
  );
  await page.locator('[data-role=zoom]').fill('3');
  await page.waitForFunction(() =>
    document.querySelector('[data-role=detail]').textContent.startsWith('Refinement unavailable')
  );

  await page.locator('[data-role=zoom]').fill('0');
  await page.waitForFunction(
    () => document.querySelector('output').textContent === '100.0× vertical exaggeration'
  );
  await page.locator('[data-role=destination]').selectOption('atlantic');
  const screenshot = PNG.sync.read(await page.screenshot());
  let bluePixels = 0;
  for (let y = 150; y < 650; y++)
    for (let x = 400; x < 800; x++) {
      const i = (y * screenshot.width + x) * 4;
      if (screenshot.data[i + 2] > 60 && screenshot.data[i + 2] > screenshot.data[i] * 1.5)
        bluePixels++;
    }
  assert.ok(bluePixels > 10000, 'Rendered blue seafloor occupies the globe');
  // The globe center is the Atlantic focus (12°N, 30°W): a click opens its sound-speed profile.
  await page.mouse.click(600, 400);
  await page.locator('[data-role=profile-chart]').waitFor();
  const profileText = await page.locator('[data-role=profile]').textContent();
  assert.match(profileText, /12\.00°, -30\.00°/);
  assert.match(profileText, /deep sound channel axis/);
  assert.match(profileText, /Absorption at 12 kHz/);
  assert.equal(previewRequests, 2, 'Manifest and preview load once from the pinned commit');
  assert.match(
    await page.locator('[data-role=profile-source]').textContent(),
    /World Ocean Atlas 2023.*Locarnini et al\. 2023; Reagan et al\. 2023/
  );
  await page.locator('[data-role=frequency]').selectOption('400000');
  await page.waitForFunction(() =>
    document.querySelector('[data-role=absorption]').textContent.includes('400 kHz')
  );
  await page.locator('[data-role=morph]').fill('0.5');
  await page.mouse.click(600, 400);
  await page.waitForFunction(() =>
    document.querySelector('[data-role=profile]').textContent.includes('fully to the globe')
  );
  await page.locator('[data-role=morph]').fill('0');
  await page.locator('[data-role=morph]').fill('1');
  await page.locator('[data-role=projection]').selectOption('mercator');
  await page.locator('[data-role=morph]').fill('0');
  await page.locator('[data-role=wireframe]').check();
  await page.setViewportSize({width: 390, height: 844});
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.locator('aside[data-compact-panel=true]').first().waitFor();
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
  server.httpServer.closeAllConnections();
  await new Promise(resolve => server.httpServer.close(resolve));
}
