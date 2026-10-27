// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';
const png = new PNG({width: 256, height: 256});
for (let i = 0; i < png.data.length; i += 4) {
  png.data[i] = 20;
  png.data[i + 1] = 210;
  png.data[i + 2] = 60;
  png.data[i + 3] = 255;
}
const payload = PNG.sync.write(png);
const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
});
try {
  const page = await browser.newPage({viewport: {width: 1100, height: 800}});
  page.setDefaultTimeout(90000);
  const errors = [],
    requests = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.route('https://gibs.earthdata.nasa.gov/**', (route) => {
    requests.push(route.request().url());
    return route.fulfill({contentType: 'image/png', body: payload});
  });
  await page.goto(process.env.SUN_TERMINATOR_URL || 'http://127.0.0.1:5187/test/navigation.html', {
    waitUntil: 'domcontentloaded'
  });
  await page.locator('[role=status]').filter({hasText: 'overview ready'}).waitFor();
  assert.equal(requests.length, 0, 'globe overview must stay offline at startup');
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.locator('[data-role=date]').fill('2026-03-20');
  await page.locator('[data-role=date]').dispatchEvent('change');
  await page.locator('[data-role=time]').fill('22:00');
  await page.locator('[data-role=time]').dispatchEvent('change');
  await page.locator('[data-role=view]').selectOption('albers-usa');
  await page.evaluate(() =>
    window.navigationDeck.setProps({initialViewState: {target: [0, 0, 0], zoom: 3.2}})
  );
  await page.waitForFunction(() => {
    const layer = window.navigationDeck.props.layers.find((layer) =>
      layer.id?.startsWith('earth-detail')
    );
    return layer?.state?.tileset?.selectedTiles.length > 0 && layer.isLoaded;
  });
  assert.equal(await page.evaluate(() => window.getCutViewports('albers-usa').length), 3);
  const cases = [
    {name: 'Denver', geo: [-104.99, 39.74], inside: true},
    {name: 'Anchorage', geo: [-149.9, 61.2], inside: true},
    {name: 'Honolulu', geo: [-157.82, 21.32], inside: true},
    {name: 'Canada', geo: [-123.12, 49.28], inside: false},
    {name: 'Pacific', geo: [-120, 33], inside: false},
    {name: 'Hawaii ocean', geo: [-159, 20], inside: false}
  ];
  const pixels = await page.evaluate((cases) => {
    const deck = window.navigationDeck;
    let samples;
    const original = deck.props.onAfterRender;
    deck.setProps({
      onAfterRender: () => {
        original();
        const gl = document.querySelector('canvas').getContext('webgl2');
        samples = cases.map((item) => {
          const p = window.projectCutMap('albers-usa', ...item.geo);
          const screen = deck.getViewports()[0].project(p),
            pixel = new Uint8Array(4);
          gl.readPixels(
            Math.floor(screen[0]),
            gl.drawingBufferHeight - 1 - Math.floor(screen[1]),
            1,
            1,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            pixel
          );
          return {...item, pixel: Array.from(pixel)};
        });
      }
    });
    deck.redraw(true);
    return samples;
  }, cases);
  for (const sample of pixels) {
    if (sample.inside)
      assert.ok(
        sample.pixel[1] > 150 && sample.pixel[3] > 200,
        sample.name + ' must show detailed imagery'
      );
    else assert.equal(sample.pixel[3], 0, sample.name + ' must be clipped');
  }
  const detail = requests
    .filter((url) => url.includes('BlueMarble'))
    .map((url) => url.match(/\/(\d+)\/(\d+)\/(\d+)\.jpeg$/))
    .filter(Boolean);
  assert.ok(
    detail.some(
      (m) =>
        Number(m[1]) >= 5 &&
        Math.floor(((-157.82 + 180) / 360) * 2 ** Number(m[1])) === Number(m[3])
    ),
    'Hawaii must request detail above the world overview'
  );
  const before = requests.length;
  await page.locator('[data-role=altitude]').selectOption('-6');
  await page.waitForTimeout(200);
  assert.equal(requests.length, before, 'shader updates must reuse the shared cache');
  await page.locator('[data-role=view]').selectOption('h3');
  await page.evaluate(() =>
    window.navigationDeck.setProps({initialViewState: {target: [0, 0, 0], zoom: 1.4}})
  );
  await page.waitForFunction(() =>
    window.navigationDeck.props.layers.some((layer) => layer.id === 'h3-cell-grid')
  );
  assert.equal(await page.evaluate(() => window.getCutViewports('h3').length), 20);
  assert.deepEqual(errors, []);
  await page.evaluate(() => window.disposeExample());
  assert.equal(await page.locator('canvas').count(), 0);
  console.log(
    'Passed: state clipping, Hawaiian detail, shared request cache, twenty H3 sampling views, cleanup'
  );
} finally {
  await browser.close();
}
