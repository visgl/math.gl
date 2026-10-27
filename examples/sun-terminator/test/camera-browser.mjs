// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
});
try {
  const page = await browser.newPage({viewport: {width: 1000, height: 800}});
  page.setDefaultTimeout(90000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('https://gibs.earthdata.nasa.gov/**', (route) => route.abort());
  await page.goto(process.env.SUN_TERMINATOR_URL || 'http://127.0.0.1:5187/test/navigation.html', {
    waitUntil: 'domcontentloaded'
  });
  await page.locator('[role=status]').filter({hasText: 'overview ready'}).waitFor();
  await page.locator('[data-role=date]').fill('2026-03-20');
  await page.locator('[data-role=date]').dispatchEvent('change');
  await page.locator('[data-role=time]').fill('12:00');
  await page.locator('[data-role=time]').dispatchEvent('change');
  await page.evaluate(() => {
    const deck = window.navigationDeck;
    deck.setProps({
      initialViewState: {longitude: 12, latitude: 24, zoom: 3, minZoom: -1, maxZoom: 7}
    });
    window.centerFrames = [];
    const original = deck.props.onAfterRender;
    deck.setProps({
      onAfterRender: () => {
        original();
        const gl = document.querySelector('canvas').getContext('webgl2');
        const pixel = new Uint8Array(4);
        gl.readPixels(
          Math.floor(gl.drawingBufferWidth / 2),
          Math.floor(gl.drawingBufferHeight / 2),
          1,
          1,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          pixel
        );
        window.centerFrames.push({
          view: deck.getViewports()[0].id,
          rgb: Array.from(pixel.slice(0, 3))
        });
      }
    });
  });
  for (const id of ['eqearth', 'robin', 'map', 'globe']) {
    await page.locator('[data-role=view]').selectOption(id);
    await page.waitForFunction(
      (id) => window.navigationDeck.getViewports()[0].id === 'earth-' + id,
      id
    );
    const focus = await page.evaluate((id) => window.geographicCenter(id), id);
    assert.ok(
      Math.abs(focus[0] - 12) < 0.001 && Math.abs(focus[1] - 24) < 0.001,
      id + ' retains focus'
    );
  }
  const frames = await page.evaluate(() => window.centerFrames);
  const morphs = frames.filter((frame) => frame.view === 'earth-morph');
  assert.ok(morphs.length > 10, 'must sample intermediate morph frames');
  const dark = morphs.filter((frame) => frame.rgb.reduce((a, b) => a + b, 0) < 100);
  assert.equal(
    dark.length,
    0,
    'daylit center must never go dark during morph: ' + JSON.stringify(dark.slice(0, 5))
  );
  assert.deepEqual(errors, []);
  console.log(
    'Passed: center retained through map/globe round trip; ' +
      morphs.length +
      ' illuminated morph frames'
  );
} finally {
  await browser.close();
}
