// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {resolve, extname} from 'node:path';
import {chromium} from 'playwright';
const root = fileURLToPath(new URL('./dist/', import.meta.url));
const server = createServer(async (req, res) => {
  try {
    const path = resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
    if (path !== resolve(root) && !path.startsWith(root)) {res.writeHead(403).end(); return;}
    const file = path === resolve(root) ? resolve(root, 'index.html') : path;
    res.setHeader('Content-Type', ({'.html':'text/html','.js':'text/javascript','.css':'text/css'})[extname(file)] || 'application/octet-stream');
    res.end(await readFile(file));
  } catch {res.writeHead(404).end();}
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
let browser;
try {
  browser = await chromium.launch({headless:true, args:['--enable-unsafe-swiftshader']});
  const page = await browser.newPage({viewport:{width:1200,height:800}}), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  for (const projection of ['equirectangular','orthographic','interrupted']) for (const raster of ['world','rotated','polar']) {
    await page.selectOption('[data-projection]', projection); await page.selectOption('[data-raster]', raster);
    await page.waitForFunction(key => document.querySelector('#example').dataset.ready === key, `${projection}/${raster}`, {timeout:60000});
    assert.equal(await page.locator('#example').getAttribute('data-error'), null);
    console.log(projection, raster, await page.locator('[data-status]').innerText());
  }
  await page.selectOption('[data-projection]','path-provenance');
  await page.waitForFunction(()=>document.querySelector('#example').dataset.ready==='path-provenance');
  assert.match(await page.locator('[data-status]').innerText(),/source meters/);
  await page.selectOption('[data-wrapper]','mercator');
  await page.selectOption('[data-wrapper]','satellite');
  await page.selectOption('[data-wrapper]','goode');
  await page.uncheck('[data-vertices]');
  await page.check('[data-vertices]');
  await page.selectOption('[data-projection]','polygon-provenance');
  await page.waitForFunction(()=>document.querySelector('#example').dataset.ready==='polygon-provenance');
  assert.match(await page.locator('[data-status]').innerText(),/preserve the hole/);
  await page.check('[data-generated]');await page.uncheck('[data-generated]');
  if (process.env.CAPTURE_SCREENSHOT) await page.screenshot({path:process.env.CAPTURE_SCREENSHOT});
  assert.deepEqual(errors, []);
} finally {await browser?.close(); await new Promise(done => server.close(done));}
