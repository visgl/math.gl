// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
});
try {
  const page = await browser.newPage({viewport: {width: 1000, height: 800}});
  page.setDefaultTimeout(90000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route('https://gibs.earthdata.nasa.gov/**', (route) => route.abort());
  await page.goto(process.env.SUN_TERMINATOR_URL || 'http://127.0.0.1:5187/test/navigation.html', {
    waitUntil: 'domcontentloaded'
  });
  const select = page.locator('[data-role=view]');
  await select.waitFor();
  await page.locator('[role=status]').filter({hasText: 'overview ready'}).waitFor();
  const ids = await select.locator('option').evaluateAll((options) => options.map((o) => o.value));
  assert.equal(ids.length, 41);
  await page.emulateMedia({reducedMotion: 'reduce'});
  for (const id of process.env.GESTURES_ONLY ? [] : ids) {
    await select.selectOption(id);
    await page.waitForTimeout(100);
    assert.equal(await select.inputValue(), id);
    assert.ok(!(await page.locator('[role=status]').textContent()).includes('error'), id);
    const png = PNG.sync.read(await page.locator('canvas').first().screenshot());
    let covered = 0;
    for (let y = 280; y < png.height; y += 8)
      for (let x = 0; x < png.width; x += 8) {
        const i = (y * png.width + x) * 4;
        if (
          Math.abs(png.data[i] - 7) +
            Math.abs(png.data[i + 1] - 18) +
            Math.abs(png.data[i + 2] - 30) >
          15
        )
          covered++;
      }
    assert.ok(covered > 100, id + ' must render a visible map');
    console.log('Rendered', id);
  }
  for (const id of ['map', 'eqearth']) {
    await select.selectOption(id);
    await page.waitForTimeout(200);
    const canvas = page.locator('canvas').first();
    const before = await canvas.screenshot();
    await page.keyboard.down('Shift');
    await page.mouse.move(650, 450);
    await page.mouse.down();
    await page.mouse.move(760, 520, {steps: 8});
    await page.mouse.up();
    await page.waitForTimeout(300);
    await page.keyboard.up('Shift');
    assert.deepEqual(await canvas.screenshot(), before, id + ' modified drag must not rotate');
    await page.mouse.move(650, 450);
    await page.mouse.down();
    await page.mouse.move(700, 450, {steps: 8});
    await page.waitForTimeout(100);
    await page.mouse.move(740, 450, {steps: 8});
    await page.mouse.up();
    await page.waitForTimeout(300);
    assert.notDeepEqual(await canvas.screenshot(), before, id + ' ordinary drag must pan');
  }
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await page.evaluate(() => {
    window.morphSamples = [];
    const deck = window.navigationDeck;
    const setProps = deck.setProps;
    deck.setProps = function (props) {
      const mesh = props.layers?.[0]?.props.mesh;
      if (props.layers?.[0]?.id === 'earth-morph' && mesh) {
        window.morphSamples.push(props.layers[0].props.progress);
      }
      return setProps.call(this, props);
    };
  });
  await select.selectOption('robin');
  await page.waitForFunction(() => window.navigationDeck.getViewports()[0].id === 'earth-robin');
  assert.ok(
    await page.evaluate(() => new Set(window.morphSamples).size > 2),
    'surface vertices must move through intermediate frames'
  );
  assert.equal(await page.locator('canvas').count(), 1, 'morph must not use an image overlay');
  await select.selectOption('globe');
  await select.selectOption('isinu');
  await page.waitForFunction(() => window.navigationDeck.getViewports()[0].id === 'earth-isinu');
  await page.emulateMedia({reducedMotion: 'reduce'});
  await select.selectOption('globe');
  assert.equal(
    await page.evaluate(() => window.navigationDeck.getViewports()[0].id),
    'earth-globe'
  );

  await page.locator('[data-role=date]').fill('2026-03-20');
  await page.locator('[data-role=date]').dispatchEvent('change');
  await page.locator('[data-role=time]').fill('12:00');
  await page.locator('[data-role=time]').dispatchEvent('change');
  await page.locator('[data-role=offset]').evaluate((el) => {
    el.value = '24';
    el.dispatchEvent(new Event('input', {bubbles: true}));
  });
  assert.equal(await page.locator('[data-role=date]').inputValue(), '2026-03-21');
  assert.equal(await page.locator('[data-role=time]').inputValue(), '12:00');
  await page.locator('[data-role=offset]').evaluate((el) => {
    el.value = '0';
    el.dispatchEvent(new Event('input', {bubbles: true}));
  });
  assert.equal(await page.locator('[data-role=date]').inputValue(), '2026-03-20');
  await page.locator('[data-role=play]').click();
  await page.waitForTimeout(500);
  await page.locator('[data-role=play]').click();
  assert.ok(
    Number(await page.locator('[data-role=offset]').inputValue()) > 1,
    'default playback should advance at least an hour in half a second'
  );
  await page.evaluate(() => {
    if (window.navigationDeck) {
      const viewport = window.navigationDeck.getViewports()[0];
      if ((viewport.bearing || 0) !== 0 || (viewport.pitch || 0) !== 0)
        throw new Error('View rotated');
      window.disposeExample();
      if (document.querySelector('canvas')) throw new Error('Unmount retained a canvas');
    }
  });
  assert.deepEqual(errors, []);
  console.log(
    'Passed all projections, pan without rotation, geometric morphs with cuts, time slider, playback, and reduced motion'
  );
} finally {
  await browser.close();
}
