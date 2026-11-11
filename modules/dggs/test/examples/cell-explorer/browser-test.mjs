// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {PNG} from 'pngjs';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {H3Decoder} from '@math.gl/dggs';

function countCenterPixels(screenshot) {
  const {data} = PNG.sync.read(screenshot);
  let count = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] > 220 && data[i + 1] > 150 && data[i + 2] < 140) count++;
  }
  return count;
}

function imageDifference(first, second) {
  const a = PNG.sync.read(first), b = PNG.sync.read(second);
  assert.equal(a.data.length, b.data.length);
  let total = 0;
  for (let i = 0; i < a.data.length; i++) total += Math.abs(a.data[i] - b.data[i]);
  return total / a.data.length;
}

const server = await createServer({
  root: fileURLToPath(new URL('../../../../../examples/dggs/cell-explorer/', import.meta.url)),
  configLoader: 'runner',
  cacheDir: '/tmp/mathgl-dggs-vite',
  server: {host: '127.0.0.1', port: 0}
});
await server.listen();
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
});
try {
  const page = await browser.newPage({viewport: {width: 1200, height: 800}});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  // Observe completed tile generation without adding test state to the example.
  await page.route('**/src/generator.js', async route => {
    const response = await route.fetch();
    const source = await response.text();
    const signature = 'return [...cells];';
    assert(source.includes(signature));
    await route.fulfill({response, body: source.replace(signature, `
      globalThis.tileRequests ||= [];
      globalThis.tileRequests.push({grid, bounds, level, count: cells.size});
      ${signature}`)});
  });
  await page.route('**/src/app.jsx', async route => {
    const response = await route.fetch();
    const source = await response.text();
    const signature = /setViewState\(\{\s*\.\.\.next,\s*latitude,\s*zoom\s*\}\);/;
    assert(signature.test(source));
    await route.fulfill({response, body: source.replace(signature, match =>
      `globalThis.cameraZoom = zoom; globalThis.cameraLatitude = latitude; ${match}`)});
  });
  await page.goto(server.resolvedUrls.local[0]);
  await page.waitForFunction(() => globalThis.tileRequests?.length > 0);
  assert.equal(await page.getByRole('combobox').count(), 1);
  assert.equal(await page.getByRole('button', {name: 'DGGS cell explorer'}).count(), 1);
  assert.equal(await page.locator('input').count(), 0);
  await page.waitForFunction(() => /Loaded cells: [1-9]/.test(document.querySelector('[data-testid="cell-count"]')?.textContent));
  assert.equal(await page.getByTestId('grid-level').textContent().then(text => text.trim()), 'Cell level: 6');
  const header = page.getByRole('button', {name: 'DGGS cell explorer'});
  await header.click();
  assert.equal(await header.getAttribute('aria-expanded'), 'false');
  await header.click();
  assert.equal(await header.getAttribute('aria-expanded'), 'true');
  const initialCalls = await page.evaluate(() => globalThis.tileRequests.length);
  const initialLevel = await page.evaluate(() => globalThis.tileRequests[0].level);
  const canvas = page.locator('canvas').first();
  const beforePan = await canvas.screenshot();
  assert.equal(countCenterPixels(beforePan), 0);
  await page.mouse.move(450, 400);
  const tooltip = page.locator('.deck-tooltip');
  await tooltip.waitFor({state: 'visible'});
  const tooltipText = await tooltip.innerText();
  const cellId = tooltipText.split('\n')[0];
  const center = H3Decoder.cellToLngLat(cellId).map(value => value.toFixed(6));
  assert(tooltipText.includes(`Center: ${center[0]}°, ${center[1]}°`));
  await page.waitForTimeout(100);
  assert(countCenterPixels(await canvas.screenshot()) > 8, 'Hover must draw the cell center marker');
  await header.hover();
  await page.waitForTimeout(100);
  assert.equal(countCenterPixels(await canvas.screenshot()), 0, 'Leaving the cells must clear the marker');
  await page.mouse.move(450, 400);
  await tooltip.waitFor({state: 'visible'});
  if (process.env.SCREENSHOT_PATH) await page.screenshot({path: process.env.SCREENSHOT_PATH});
  await page.mouse.move(450, 400);
  await page.mouse.down();
  await page.mouse.move(700, 400, {steps: 8});
  await page.mouse.up();
  await page.waitForFunction(count => globalThis.tileRequests.length > count, initialCalls);
  assert(imageDifference(beforePan, await canvas.screenshot()) > 0.02);
  await page.mouse.move(450, 400);
  for (let step = 0; step < 4; step++) {
    await page.mouse.wheel(0, -700);
    await page.waitForTimeout(200);
  }
  await page.waitForFunction(level => globalThis.tileRequests.some(request => request.level > level), initialLevel);
  for (const name of ['a5', 'geohash', 'h3', 'plus-code', 'quadkey', 's2']) {
    await page.getByRole('combobox', {name: 'Grid', exact: true}).selectOption(name);
    await page.waitForFunction(grid => globalThis.tileRequests.some(request => request.grid === grid && request.count > 0), name);
    await page.waitForFunction(() => /Loaded cells: [1-9]/.test(document.querySelector('[data-testid="cell-count"]')?.textContent));
    assert.equal(await page.getByRole('alert').count(), 0, name);
    assert(await page.evaluate(async grid => {
      const {getGridLevel} = await import('/src/generator.js');
      return globalThis.tileRequests.filter(request => request.grid === grid).every(request => {
        const zoom = Math.round(Math.log2(360 / (request.bounds[1][0] - request.bounds[0][0])));
        return request.level === getGridLevel(grid, zoom);
      });
    }, name), 'Tile zoom must choose the generated cell level');
  }
  // Exercise both controller limits with enough scroll input to overshoot them.
  await page.mouse.move(450, 400);
  for (let step = 0; step < 30; step++) {
    await page.mouse.wheel(0, 1200);
    await page.waitForTimeout(100);
  }
  await page.waitForFunction(() => globalThis.cameraZoom === 1);
  await page.waitForTimeout(300);
  const wideView = PNG.sync.read(await canvas.screenshot());
  let visibleCellPixels = 0;
  for (let i = 0; i < wideView.data.length; i += 4) {
    if (wideView.data[i] === 13 && wideView.data[i + 1] === 53 && wideView.data[i + 2] === 70) visibleCellPixels++;
  }
  assert(visibleCellPixels > 10000, 'The globe must retain visible cells at minimum zoom');
  // Drag far enough in each direction to reach the latitude caps.
  const reachedLatitudes = [];
  for (const targetY of [780, 20, 780, 20]) {
    await page.mouse.move(600, 400);
    await page.mouse.down();
    await page.mouse.move(600, targetY, {steps: 8});
    await page.mouse.up();
    await page.waitForTimeout(200);
    const latitude = await page.evaluate(() => globalThis.cameraLatitude);
    assert(latitude >= -80 && latitude <= 80, `Camera latitude must stay bounded: ${latitude}`);
    reachedLatitudes.push(latitude);
  }
  assert(reachedLatitudes.some(latitude => Math.abs(latitude) === 80), 'Panning should reach a latitude limit');
  await canvas.focus();
  for (let step = 0; step < 40; step++) {
    await page.keyboard.press('Equal');
    await page.waitForTimeout(350);
  }
  await page.waitForTimeout(300);
  const maximumZoom = await page.evaluate(() => globalThis.cameraZoom);
  assert(maximumZoom > 1 && maximumZoom <= 20, `Zoom-in must stop within the configured maximum: ${maximumZoom}`);
  for (let step = 0; step < 5; step++) {
    await page.keyboard.press('Equal');
    await page.waitForTimeout(350);
  }
  await page.waitForTimeout(300);
  assert.equal(await page.evaluate(() => globalThis.cameraZoom), maximumZoom);
  await page.waitForFunction(() => /Loaded cells: [1-9]/.test(document.querySelector('[data-testid="cell-count"]')?.textContent));
  await page.setViewportSize({width: 390, height: 400});
  assert.equal(await page.locator('.dggs-explorer').evaluate(element => element.clientHeight), 400);
  await page.waitForFunction(() => document.querySelector('.example-panel')?.dataset.compactPanel === 'true');
  if (await header.getAttribute('aria-expanded') === 'false') await header.click();
  await page.getByTestId('cell-count').scrollIntoViewIfNeeded();
  const countBounds = await page.getByTestId('cell-count').boundingBox();
  assert(countBounds.y >= 0 && countBounds.y + countBounds.height <= 400);
  await page.getByRole('combobox').scrollIntoViewIfNeeded();
  const dropdown = await page.getByRole('combobox').boundingBox();
  assert(dropdown.x >= 0 && dropdown.y >= 0 && dropdown.x + dropdown.width <= 390 && dropdown.y + dropdown.height <= 400);
  assert.equal(await page.getByRole('button', {name: 'DGGS cell explorer'}).count(), 1);
  const outsideLayout = await page.evaluate(() => {
    const sibling = document.createElement('div');
    sibling.style.height = '500px';
    document.body.append(sibling);
    const height = parseFloat(getComputedStyle(document.body).height);
    sibling.remove();
    return {height, expected: innerHeight + 500};
  });
  assert(outsideLayout.height >= outsideLayout.expected, 'Example CSS must not constrain the surrounding page body');
  assert.deepEqual(errors, []);
  console.log('DGGS: hovered center marker, cell-center tooltip, panel header, cell count and level, grid selector, six grids, tile bounds, zoom-dependent levels, pan, camera zoom and latitude limits, and responsive layout passed.');
} finally {
  await browser.close();
  await server.close();
}
