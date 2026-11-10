// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import {serveExample} from '../../../../../test/examples/vite-server.mjs';

const {url, close} = await serveExample('geospatial/elastic-maps');
let browser;
try {
  browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH,
    args: ['--enable-unsafe-swiftshader']
  });
  const page = await browser.newPage({viewport: {width: 900, height: 650}});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && message.text().includes('deck:')) errors.push(message.text());
  });
  await page.goto(url);
  const canvas = page.locator('canvas');
  async function hasPolygon() {
    const png = PNG.sync.read(await canvas.screenshot());
    for (let i = 0; i < png.data.length; i += 4) {
      const [r, g, b] = png.data.subarray(i, i + 3);
      if (r > 150 && r > g + 12 && g > b + 12) return true;
    }
    return false;
  }
  async function waitForPolygon() {
    for (let i = 0; i < 20; i++) {
      if (await hasPolygon()) return;
      await page.waitForTimeout(150);
    }
    assert.fail('The projected sample polygon is missing');
  }
  await waitForPolygon();
  await page.selectOption('[data-map]', 'sinusoidal');
  await page.waitForFunction(() => !document.querySelector('[data-status]').textContent.includes('Preparing'), null, {timeout: 60000});
  await page.setViewportSize({width: 520, height: 650});
  await waitForPolygon();
  assert.deepEqual(errors, []);
} finally {
  await browser?.close();
  await close();
}
