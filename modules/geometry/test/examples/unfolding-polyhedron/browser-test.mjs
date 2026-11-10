// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import {serveExample} from '../../../../../test/examples/vite-server.mjs';

const {url, close} = await serveExample('geometry/unfolding-polyhedron');
let browser;
try {
  browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH,
    args: ['--enable-unsafe-swiftshader']
  });
  const page = await browser.newPage({viewport: {width: 950, height: 750}});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && message.text().includes('deck:')) errors.push(message.text());
  });
  await page.route('https://gibs.earthdata.nasa.gov/**', route => route.abort());
  await page.goto(url);
  await page.locator('#earth').uncheck();
  const canvas = page.locator('canvas');
  async function panelImage() {
    for (let i = 0; i < 20; i++) {
      const image = await canvas.screenshot();
      const {data} = PNG.sync.read(image);
      // The opaque blue panel color distinguishes geometry from the background.
      for (let j = 0; j < data.length; j += 4) {
        if (data[j] >= 85 && data[j] <= 155 && Math.abs(data[j + 1] - 153) <= 1 && data[j + 2] >= 175 && data[j + 2] <= 207) return image;
      }
      await page.waitForTimeout(150);
    }
    assert.fail('The unfolding panels did not render');
  }
  const folded = await panelImage();
  await page.locator('#unfold').evaluate(input => {
    input.value = '100';
    input.dispatchEvent(new Event('input', {bubbles: true}));
  });
  await page.waitForFunction(() => document.querySelector('#amount').textContent === '100%');
  const unfolded = await panelImage();
  assert.notDeepEqual(unfolded, folded);
  assert.deepEqual(errors, []);
} finally {
  await browser?.close();
  await close();
}
