// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

// Run against the standalone Vite server; no live imagery is needed for these checks.
const url = process.env.SUN_TERMINATOR_URL || 'http://127.0.0.1:5187';
const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
});
try {
  const page = await browser.newPage({viewport: {width: 1000, height: 800}});
  page.setDefaultTimeout(90000);
  await page.emulateMedia({reducedMotion: 'reduce'});
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  let tileRequests = 0;
  await page.route('https://gibs.earthdata.nasa.gov/**', (route) => {
    tileRequests++;
    return route.abort();
  });
  await page.goto(url, {waitUntil: 'domcontentloaded'});
  await page.locator('[role=status]').filter({hasText: 'overview ready'}).waitFor();
  assert.equal(tileRequests, 0, 'initial overview must not wait on remote imagery');
  // The community panel can collapse, and every label shares its control's row.
  assert.equal(await page.locator('.deck-widget-box').count(), 1);
  assert.ok(
    await page.locator('.sun-controls label').evaluateAll((labels) =>
      labels.every((label) => {
        const a = label.querySelector('span').getBoundingClientRect();
        const b = label.querySelector('select,input').getBoundingClientRect();
        return Math.abs(a.y + a.height / 2 - b.y - b.height / 2) < 2;
      })
    )
  );
  for (const view of ['map', 'globe', 'map', 'globe'])
    await page.locator('[data-role=view]').selectOption(view);
  await page.locator('[data-role=feather]').selectOption('12');
  await page.locator('[data-role=altitude]').selectOption('-18');
  await page.locator('[data-role=play]').click();
  await page.waitForTimeout(500);
  await page.locator('[data-role=play]').click();
  assert.equal(
    tileRequests,
    0,
    'time, projection and feather updates must not fetch overview tiles'
  );
  await page.getByRole('button', {name: 'Earth after dark', exact: true}).click();
  await page.getByRole('button', {name: 'Earth after dark', exact: true}).click();
  await page.mouse.move(700, 400);
  await page.mouse.wheel(0, -600);
  await page.locator('[role=status]').filter({hasText: 'overview retained'}).waitFor();
  assert.ok(tileRequests > 0, 'zoom must request detail');

  let checked = 0,
    blended = 0;
  for (const scene of [
    {longitude: -150, latitude: 25},
    {longitude: 179, latitude: 0},
    {longitude: 30, latitude: 75},
    {longitude: 30, latitude: -75},
    {longitude: 70, latitude: 10, feather: 3},
    {longitude: 70, latitude: 10, altitude: -12, feather: 12},
    {longitude: 70, latitude: 10, geographic: false},
    {view: 'map', longitude: 70, latitude: 0},
    {view: 'map', longitude: 70, latitude: 0, geographic: false}
  ]) {
    await page.goto(`${url}/test/render.html?${new URLSearchParams(scene)}`);
    const samples = await page.evaluate(() => window.renderResult);
    assert.ok(
      samples.length > 20,
      `Not enough samples for ${JSON.stringify(scene)}: ${samples.length}`
    );
    for (const {lon, lat, darkness, rgb} of samples) {
      const expected = [40, 100, 200].map(
        (c, i) => c * (1 - darkness) + [10, 20, 40][i] * darkness
      );
      assert.ok(
        rgb.every((c, i) => Math.abs(c - expected[i]) < 14),
        `Coverage/feather mismatch at ${lon},${lat} (${JSON.stringify(scene)}): ${rgb} vs ${expected}`
      );
      checked++;
      if (darkness > 0.1 && darkness < 0.9) blended++;
    }
  }
  assert.ok(blended > 10, 'must check intermediate feather colors, not only day/night endpoints');
  assert.deepEqual(errors, []);
  console.log(
    `Passed: inline community panel, offline overview, tile failure fallback, ${checked} coverage samples (${blended} inside feather).`
  );
} finally {
  await browser.close();
}
