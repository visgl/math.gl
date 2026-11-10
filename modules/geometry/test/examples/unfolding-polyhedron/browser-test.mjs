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
  // North is red and south is blue. The image exercises the production texture path.
  const texture = new PNG({width: 16, height: 16});
  for (let i = 0; i < texture.data.length; i += 4) {
    texture.data[i + (i < texture.data.length / 2 ? 0 : 2)] = 255;
    texture.data[i + 3] = 255;
  }
  await page.route('https://gibs.earthdata.nasa.gov/**', route => route.fulfill({
    contentType: 'image/png',
    headers: {'access-control-allow-origin': '*'},
    body: PNG.sync.write(texture)
  }));
  await page.goto(url);
  await page.locator('#imagery-status').filter({hasText: 'Earth imagery: NASA Blue Marble'}).waitFor();
  const canvas = page.locator('canvas');
  const tooltip = page.locator('[role="tooltip"]');

  async function checkHemispheres() {
    await canvas.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    const box = await canvas.boundingBox();
    assert.ok(box);
    const {data, width, height} = PNG.sync.read(await canvas.screenshot());
    const seen = new Set();
    for (let y = 12; y < height && seen.size < 2; y += 18) {
      for (let x = 12; x < width && seen.size < 2; x += 18) {
        const i = (y * width + x) * 4;
        const [r, g, b] = data.subarray(i, i + 3);
        const north = r > 50 && g < 10 && b < 10;
        const south = b > 50 && g < 10 && r < 10;
        if ((!north && !south) || seen.has(north)) continue;
        await page.mouse.move(box.x + x * box.width / width, box.y + y * box.height / height);
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        if (!(await tooltip.isVisible())) continue;
        const latitude = Number((await tooltip.textContent()).match(/Lat (-?[0-9.]+)°/)?.[1]);
        if (Math.abs(latitude) < 15) continue;
        assert.equal(north, latitude > 0, `Wrong texture color at latitude ${latitude}`);
        seen.add(north);
      }
    }
    assert.equal(seen.size, 2, 'Both hemispheres should be visible in the sampled mesh');
    return data;
  }

  const folded = await checkHemispheres();
  await page.locator('#unfold').evaluate(input => {
    input.value = '100';
    input.dispatchEvent(new Event('input', {bubbles: true}));
  });
  await page.waitForFunction(() => document.querySelector('#amount').textContent === '100%');
  const unfolded = await checkHemispheres();
  assert.notDeepEqual(unfolded, folded);
  assert.deepEqual(errors, []);
} finally {
  await browser?.close();
  await close();
}
