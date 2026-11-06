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
  const page = await browser.newPage({viewport: {width: 1100, height: 800}});
  page.setDefaultTimeout(90000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (
      message.type() === 'error' &&
      !message.text().startsWith('Failed to load resource: net::ERR_FAILED')
    )
      errors.push(message.text());
  });
  await page.route('https://gibs.earthdata.nasa.gov/**', (route) => route.abort());
  await page.goto(process.env.SUN_TERMINATOR_URL || 'http://127.0.0.1:5187/test/navigation.html', {
    waitUntil: 'domcontentloaded'
  });
  await page.locator('[role=status]').filter({hasText: 'overview ready'}).waitFor();
  for (const id of ['albers-usa', 'isinu', 'imoll'])
    assert.equal(await page.locator('[data-role=view] option[value="' + id + '"]').count(), 1);
  await page.evaluate(() => {
    const deck = window.navigationDeck;
    deck.setProps({initialViewState: {longitude: -96, latitude: 38, zoom: 5}});
    window.morphChecks = {progress: [], stable: true, mesh: null, uniqueVertices: 0, indices: 0};
    const setProps = deck.setProps;
    deck.setProps = function (props) {
      const layer = props.layers?.[0];
      if (layer?.id === 'earth-morph') {
        const check = window.morphChecks;
        if (!check.mesh) check.mesh = layer.props.mesh;
        check.stable &&= check.mesh === layer.props.mesh;
        check.progress.push(layer.props.progress);
        check.uniqueVertices = layer.props.mesh.positions.length / 3;
        check.indices = layer.props.mesh.indices.length;
      }
      return setProps.call(this, props);
    };
  });
  await page.locator('[data-role=view]').selectOption('albers-usa');
  await page.waitForFunction(
    () => window.navigationDeck.getViewports()[0].id === 'earth-albers-usa'
  );
  const check = await page.evaluate(() => ({...window.morphChecks, mesh: undefined}));
  assert.equal(check.stable, true, 'GPU morph must retain the same position buffers');
  assert.ok(new Set(check.progress).size > 3, 'must render intermediate GPU progress');
  assert.ok(check.uniqueVertices < check.indices / 2, 'continuous pieces should share vertices');
  const focus = await page.evaluate(() => window.geographicCenter('albers-usa'));
  assert.ok(Math.abs(focus[0] + 96) < 0.001 && Math.abs(focus[1] - 38) < 0.001);
  await page.evaluate(() =>
    window.navigationDeck.setProps({initialViewState: {target: [0, 0, 0], zoom: 3.2}})
  );
  await page.screenshot({path: '/tmp/sun-albers-usa.png'});
  await page.evaluate(() => {
    window.morphChecks.mesh = null;
  });
  await page.locator('[data-role=view]').selectOption('imoll');
  await page.waitForFunction(() => window.navigationDeck.getViewports()[0].id === 'earth-imoll');
  await page.locator('[data-role=view]').selectOption('isinu');
  await page.waitForFunction(() => window.navigationDeck.getViewports()[0].id === 'earth-isinu');
  assert.deepEqual(errors, []);
  await page.evaluate(() => window.disposeExample());
  assert.equal(await page.locator('canvas').count(), 0);
  console.log(
    'Passed: high-zoom GPU morph, shared buffers, Albers USA insets, interrupted maps, cleanup'
  );
} finally {
  await browser.close();
}
