// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {copyFile, mkdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import tableOfContents from '../src/examples/table-of-contents.json' with {type: 'json'};

// Start the website first, then run: yarn screenshots
const baseUrl = process.env.EXAMPLES_URL || 'http://127.0.0.1:3000/math.gl/';
const requestedExamples = process.argv.slice(2);
const output = new URL('../static/images/examples/', import.meta.url);
await mkdir(output, {recursive: true});
const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
});
try {
  const page = await browser.newPage({viewport: {width: 1600, height: 1100}, deviceScaleFactor: 1});
  page.setDefaultTimeout(90000);
  await page.emulateMedia({reducedMotion: 'reduce'});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const group of tableOfContents.filter(item => item.type === 'category')) {
    for (const {id} of group.items) {
      if (requestedExamples.length && !requestedExamples.includes(id)) continue;
      errors.length = 0;
      await page.goto(new URL(`examples/${id}`, baseUrl).href, {waitUntil: 'networkidle'});
      const selectors = {
        expressions: '.expression-playground',
        benchmarks: '[aria-label="Live projection benchmarks"]',
        'external-projection-engines': '[aria-label="Projection engine comparison"]',
        'albers-usa': '[aria-label="Interactive Albers USA map"]',
        'quincuncial-star': '.quincuncial-star',
        'elastic-maps': '.elastic-maps'
      };
      const selector = selectors[id] || '[class*="frame_"][aria-label]';
      const example = page.locator(selector).first();
      await example.waitFor({state: 'visible'});
      assert.equal(await page.locator('webpack-dev-server-client-overlay').count(), 0);
      await example.evaluate(element => {
        element.style.width = '960px';
        element.style.height = '600px';
        element.style.overflow = 'hidden';
        element.style.maxWidth = 'none';
      });
      if (id === 'expressions') {
        await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
        await example.evaluate(element => {
          element.style.zoom = '0.6';
          element.style.width = '1600px';
          element.style.height = '1000px';
          element.style.minHeight = '0';
        });
      }
      if (id === 'benchmarks') {
        await example.getByLabel('Coordinates', {exact: true}).selectOption('2000');
        await example.getByRole('button', {name: 'Run benchmarks', exact: true}).click();
        await example.getByRole('button', {name: 'Download results'}).waitFor();
      }
      if (id === 'sun-terminator') {
        await example.locator('[data-role="view"]').selectOption('map');
        await example.locator('[data-role="status"]').filter({hasText: 'overview ready'}).waitFor();
      }
      if (id === 'geoid-globe' || id === 'timezone-globe') {
        await page.waitForFunction(() => {
          const status = document.querySelector('[data-role="status"]');
          return status && !/Loading/.test(status.textContent);
        });
        assert.doesNotMatch(await example.innerText(), /Unable to load|Could not load/);
      }
      if (id !== 'benchmarks') await example.locator('canvas, svg').first().waitFor();
      await page.evaluate(() => document.fonts.ready);
      // Allow WebGL rendering and ResizeObserver to settle after framing the demo.
      await page.waitForTimeout(2000);
      assert.deepEqual(errors, [], `${id}: browser errors`);
      await example.screenshot({path: fileURLToPath(new URL(`${id}.jpg`, output)), type: 'jpeg', quality: 88});
      const documentationImage = new URL(`../../docs/images/${id}.jpg`, import.meta.url);
      if (existsSync(documentationImage)) {
        await copyFile(new URL(`${id}.jpg`, output), documentationImage);
      }
      console.log(`Captured ${id}`);
    }
  }
} finally {
  await browser.close();
}
