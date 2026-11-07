// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { chromium, webkit } from 'playwright';

const root = resolve('website/build');
const basePath = process.env.WEBSITE_BASE_URL || '/math.gl/';
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.wasm': 'application/wasm',
  '.woff2': 'font/woff2'
};
let server;
let base = process.env.MOBILE_TEST_BASE_URL;
if (!base) {
  server = createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      if (!pathname.startsWith(basePath)) throw new Error('Unknown base path');
      let file = resolve(root, pathname.slice(basePath.length) || 'index.html');
      if (!file.startsWith(root + sep)) throw new Error('Invalid path');
      try {
        await stat(file + '.html');
        file += '.html';
      } catch {
        /* An asset or directory. */
      }
      if ((await stat(file)).isDirectory()) file = resolve(file, 'index.html');
      response.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream');
      response.end(await readFile(file));
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  base = `http://127.0.0.1:${server.address().port}${basePath}`;
}
const browser = await (process.env.MOBILE_TEST_ENGINE === 'webkit' ? webkit : chromium).launch({
  headless: true,
  ...(process.env.MOBILE_TEST_ENGINE === 'webkit'
    ? {}
    : { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
});
const sizes = [
  { width: 390, height: 844 },
  { width: 844, height: 390 }
];
try {
  const context = await browser.newContext({ viewport: sizes[0], isMobile: true, hasTouch: true });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  page.setDefaultNavigationTimeout(45000);
  page.on('pageerror', (error) => console.error('Example page error:', error.message));
  for (const size of sizes) {
    await page.setViewportSize(size);
    for (const route of ['docs', 'docs/modules', 'examples']) {
      console.log('Navigation', size.width, route);
      await page.goto(base + route, { waitUntil: 'domcontentloaded' });
      const toggle = page.getByRole('button', { name: 'Toggle navigation bar' });
      await toggle.waitFor({ state: 'visible' });
      await toggle.tap();
      await page.locator('.navbar-sidebar .menu:visible').first().waitFor({ state: 'visible' });
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        true,
        route
      );
    }
    for (const route of [
      'core-transforms',
      'geometry-viewer',
      'polygon-playground',
      'dggs-cell-explorer',
      'timezone-globe'
    ]) {
      console.log('Panel', size.width, route);
      await page.goto(base + 'examples/' + route, { waitUntil: 'domcontentloaded' });
      const header = page.locator('.example-panel header button').first();
      await header.waitFor();
      await page.waitForFunction(
        () => document.querySelector('.example-panel')?.dataset.compactPanel === 'true'
      );
      assert.equal(await header.getAttribute('aria-expanded'), 'false', route);
      assert.ok((await header.boundingBox()).height >= 44, route);
      const frame = page.locator('[data-inline], [class*="frame"]').first();
      const rect = await frame.boundingBox();
      assert.ok(rect.height <= size.height, `${route}: frame fits ${size.width}`);
      await header.tap();
      assert.equal(await header.getAttribute('aria-expanded'), 'true', route);
      const ranges = page.locator('.example-panel input[type="range"]');
      const selects = page.locator('.example-panel select');
      const numbers = page.locator('.example-panel input[type="number"]');
      let control;
      if (await ranges.count()) {
        control = ranges.first();
        await control.focus();
        // Exercise the date slider at its year-end limit as well as ordinary values.
        if (route === 'timezone-globe') await control.press('End');
        const before = await control.inputValue();
        const max = Number((await control.getAttribute('max')) ?? 100);
        await control.press(Number(before) >= max ? 'ArrowLeft' : 'ArrowRight');
        assert.notEqual(await control.inputValue(), before, `${route}: range changed`);
      } else if (await selects.count()) {
        control = selects.first();
        const before = await control.inputValue();
        const next = await control.locator('option').evaluateAll((options, current) =>
          options.find(option => !option.disabled && option.value && option.value !== current)?.value,
          before
        );
        assert.ok(next, `${route}: alternate option exists`);
        await control.selectOption(next);
      } else {
        assert.ok(await numbers.count(), `${route}: editable control exists`);
        control = numbers.first();
        await control.fill(String(Number(await control.inputValue()) + 1));
      }
      const value = await control.inputValue();
      await header.tap();
      await header.tap();
      assert.equal(await control.inputValue(), value, `${route}: control value survives collapse`);
      await header.tap();
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        true,
        route
      );
    }
  }
  await context.close();
  // Exercise both missing APIs (iPhone) and exposed APIs that reject the request.
  for (const mode of ['missing', 'rejected', 'native']) {
    const testContext = await browser.newContext({
      viewport: sizes[0],
      isMobile: true,
      hasTouch: true
    });
    console.log('Fullscreen', mode);
    const testPage = await testContext.newPage();
    testPage.setDefaultTimeout(15000);
    const errors = [];
    testPage.on('pageerror', (error) => errors.push(error.message));
    if (mode !== 'native')
      await testPage.addInitScript((mode) => {
        Object.defineProperty(Element.prototype, 'requestFullscreen', {
          configurable: true,
          value: mode === 'missing' ? undefined : () => Promise.reject(new Error('Not allowed'))
        });
      }, mode);
    await testPage.goto(base + 'docs/modules/geometry/api-reference/hinge-tree', {
      waitUntil: 'domcontentloaded'
    });
    const open = testPage.getByRole('button', { name: 'Open Unfolding Earth fullscreen' });
    await open.waitFor();
    await open.scrollIntoViewIfNeeded();
    const originalScroll = await testPage.evaluate(() => window.scrollY);
    const originalLock = await testPage.evaluate(() =>
      document.documentElement.getAttribute('data-example-expanded')
    );
    await open.tap();
    const nativeSupported =
      mode === 'native' &&
      (await testPage.evaluate(() => typeof Element.prototype.requestFullscreen === 'function'));
    if (nativeSupported) {
      await testPage.waitForFunction(() => Boolean(document.fullscreenElement));
      assert.equal(await testPage.locator('[data-expanded]').count(), 0);
    } else {
      const dialog = testPage.getByRole('dialog', { name: 'Unfolding Earth' });
      await dialog.waitFor();
      assert.equal(
        await testPage.evaluate(() => getComputedStyle(document.body).overflow),
        'hidden'
      );
      const canvas = testPage.locator('[aria-label="Unfolding Earth"][data-inline] canvas').first();
      await canvas.waitFor();
      await canvas.evaluate((element) => {
        element.dataset.mobileTest = 'preserved';
      });
      for (const size of sizes) {
        await testPage.setViewportSize(size);
        await testPage.waitForTimeout(100);
        const rect = await dialog.boundingBox();
        assert.ok(
          Math.abs(rect.width - size.width) < 2 && Math.abs(rect.height - size.height) < 2,
          'Fallback fills viewport after rotation'
        );
        assert.equal(
          await testPage.evaluate(() => getComputedStyle(document.body).overflow),
          'hidden'
        );
      }
      const close = testPage.getByRole('button', { name: 'Exit fullscreen Unfolding Earth' });
      await close.focus();
      await testPage.keyboard.press('Tab');
      assert.equal(
        await testPage.evaluate(() =>
          document.querySelector('[role="dialog"]').contains(document.activeElement)
        ),
        true
      );
      await close.tap();
      assert.equal(await canvas.getAttribute('data-mobile-test'), 'preserved');
      assert.equal(
        await testPage.evaluate(() =>
          document.documentElement.getAttribute('data-example-expanded')
        ),
        originalLock
      );
      assert.notEqual(
        await testPage.evaluate(() => getComputedStyle(document.body).overflow),
        'hidden'
      );
      await testPage.waitForFunction((y) => Math.abs(window.scrollY - y) < 2, originalScroll);
      assert.equal(await open.evaluate((element) => element === document.activeElement), true);
      await open.tap();
      await testPage.keyboard.press('Escape');
      await dialog.waitFor({ state: 'hidden' });
    }
    if (nativeSupported)
      await testPage.getByRole('button', { name: 'Exit fullscreen Unfolding Earth' }).tap();
    assert.deepEqual(errors, []);
    await testContext.close();
  }
  console.log('Mobile navigation, panel layouts, and native/fallback fullscreen checks passed.');
} finally {
  await browser.close();
  if (server) await new Promise((done) => server.close(done));
}
