// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';
import {serveExample} from '../../../../../test/examples/vite-server.mjs';

const {url, close} = await serveExample('geospatial/myriahedral-maps');
let browser;
try {
  browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH,
    args: ['--enable-unsafe-swiftshader']
  });
  const page = await browser.newPage({viewport: {width: 900, height: 720}});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('https://gibs.earthdata.nasa.gov/**', route => route.abort());
  await page.goto(url);
  assert.equal(await page.locator('#surface').inputValue(), 'land');
  const canvas = page.locator('canvas');
  let land = 0, ocean = 0;
  for (let attempt = 0; attempt < 15 && (land < 20 || ocean < 20); attempt++) {
    const {data} = PNG.sync.read(await page.screenshot({clip: await canvas.boundingBox()}));
    land = 0;
    ocean = 0;
    for (let i = 0; i < data.length; i += 4) {
      const [r, g, b] = data.subarray(i, i + 3);
      if (r > 110 && r > g + 15 && g > b + 45) land++;
      if (b > 65 && b > g + 12 && g > r + 15) ocean++;
    }
    if (land < 20 || ocean < 20) await page.waitForTimeout(150);
  }
  assert.ok(land >= 20 && ocean >= 20, 'Both land and ocean should render with imagery offline');
  assert.deepEqual(errors, []);
} finally {
  await browser?.close();
  await close();
}
