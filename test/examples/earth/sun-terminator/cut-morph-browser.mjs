// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH,
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
    window.morphChecks = {progress: [], stable: true, mesh: null, uniqueVertices: 0, indices: 0, drawn: [], warmed: false, slowFrames: true};
    const afterRender = deck.props.onAfterRender;
    deck.setProps({
      onBeforeRender: () => {
        if (deck.props.layers[0]?.id === 'earth-morph' && !window.morphChecks.warmed) {
          window.morphChecks.warmed = true;
          // Model a slow initial shader compilation/buffer upload. It must not
          // consume the visible animation's duration.
          const until = performance.now() + 650;
          while (performance.now() < until) { /* shader warmup */ }
        }
      },
      onAfterRender: () => {
        const layer = deck.props.layers[0];
        const check = window.morphChecks;
        if (layer?.id === 'earth-morph') check.drawn.push({progress: layer.props.progress, time: performance.now()});
        else if (check.drawn.length) check.completedAt = performance.now();
        afterRender();
        if (layer?.id === 'earth-morph' && check.slowFrames) {
          // Model slow software-GPU frames after the initial upload as well.
          const until = performance.now() + 180;
          while (performance.now() < until) { /* delayed frame */ }
        }
      }
    });
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
  assert.ok(check.drawn.length >= 12, 'slow frames must still draw intermediate animation states');
  assert.ok(new Set(check.progress).size > 3, 'must render intermediate GPU progress');
  assert.ok(check.uniqueVertices < check.indices / 2, 'continuous pieces should share vertices');
  await page.waitForFunction(() => window.morphChecks.completedAt);
  const duration = await page.evaluate(() => window.morphChecks.completedAt - window.morphChecks.drawn[0].time);
  assert.ok(duration >= 1400, `shader warmup must not shorten the visible animation: ${duration} ms`);
  const focus = await page.evaluate(() => window.geographicCenter('albers-usa'));
  assert.ok(Math.abs(focus[0] + 96) < 0.001 && Math.abs(focus[1] - 38) < 0.001);
  await page.evaluate(() =>
    window.navigationDeck.setProps({initialViewState: {target: [0, 0, 0], zoom: 3.2}})
  );
  await page.screenshot({path: '/tmp/sun-albers-usa.png'});
  await page.evaluate(() => {
    window.morphChecks = {progress: [], stable: true, mesh: null, uniqueVertices: 0, indices: 0, drawn: [], warmed: true};
  });
  await page.locator('[data-role=view]').selectOption('globe');
  await page.waitForFunction(() => window.navigationDeck.getViewports()[0].id === 'earth-globe');
  const reverse = await page.evaluate(() => ({...window.morphChecks, mesh: undefined}));
  assert.equal(reverse.stable, true);
  assert.ok(new Set(reverse.progress).size > 3, 'Albers USA must also animate back to globe');
  await page.evaluate(() => {
    window.morphChecks.mesh = null;
  });
  await page.locator('[data-role=view]').selectOption('imoll');
  await page.waitForFunction(() => window.navigationDeck.getViewports()[0].id === 'earth-imoll');
  await page.locator('[data-role=view]').selectOption('isinu');
  await page.waitForFunction(() => window.navigationDeck.getViewports()[0].id === 'earth-isinu');
  // A failed preparation must discard choices queued during that attempt.
  await page.evaluate(() => {
    const viewport = window.navigationDeck.getViewports()[0];
    const width = viewport.width;
    Object.defineProperty(viewport, 'width', {
      configurable: true,
      get() {
        if (document.querySelector('[role=status]').textContent.startsWith('Preparing projection')) {
          Object.defineProperty(viewport, 'width', {value: width, configurable: true, writable: true});
          const select = document.querySelector('[data-role=view]');
          select.value = 'robin';
          select.dispatchEvent(new Event('change'));
          throw new Error('Injected transition preparation failure');
        }
        return width;
      }
    });
  });
  await page.locator('[data-role=view]').selectOption('globe');
  await page.locator('[role=status]').filter({hasText: 'Injected transition preparation failure'}).waitFor();
  assert.equal(await page.locator('[data-role=view]').inputValue(), 'isinu');
  await page.locator('[data-role=view]').selectOption('map');
  await page.waitForFunction(() => window.navigationDeck.getViewports()[0].id === 'earth-map');
  assert.equal(await page.locator('[data-role=view]').inputValue(), 'map');
  assert.deepEqual(errors, []);
  await page.evaluate(() => window.disposeExample());
  assert.equal(await page.locator('canvas').count(), 0);
  console.log(
    'Passed: high-zoom GPU morph, shared buffers, Albers USA insets, interrupted maps, cleanup'
  );
} finally {
  await browser.close();
}
