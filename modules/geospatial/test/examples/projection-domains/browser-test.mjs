// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {serveExample} from '../../../../../test/examples/vite-server.mjs';
const {url, close} = await serveExample('geospatial/projection-domains');
let browser;
try {
  browser = await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH, args:['--enable-unsafe-swiftshader']});
  const page = await browser.newPage({viewport:{width:1200,height:800}}), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(url);
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
  await page.selectOption('[data-wrapper]','armadillo');
  await page.selectOption('[data-wrapper]','elastic');
  await page.selectOption('[data-wrapper]','goode');
  await page.uncheck('[data-vertices]');
  await page.check('[data-vertices]');
  await page.selectOption('[data-projection]','polygon-provenance');
  await page.waitForFunction(()=>document.querySelector('#example').dataset.ready==='polygon-provenance');
  assert.match(await page.locator('[data-status]').innerText(),/preserve the hole/);
  await page.check('[data-generated]');await page.uncheck('[data-generated]');
  for(const wrapper of ['mercator','satellite','armadillo','elastic','goode']){await page.selectOption('[data-polygon-wrapper]',wrapper);await page.check('[data-atlas]');await page.uncheck('[data-atlas]');}
  if (process.env.CAPTURE_SCREENSHOT) await page.screenshot({path:process.env.CAPTURE_SCREENSHOT});
  await page.goto(new URL('centered-omerc.html',url).href);
  await page.waitForFunction(()=>document.querySelector('#example').dataset.ready==='true');
  assert.equal(await page.locator('#example').getAttribute('data-error'),null);
  const revision=await page.locator('#example').getAttribute('data-revision');
  await page.click('[data-repeat]');
  assert.equal(await page.locator('#example').getAttribute('data-revision'),revision);
  assert.match(await page.locator('[data-status]').innerText(),/Reused/);
  await page.selectOption('[data-engine]','math.gl');
  assert.notEqual(await page.locator('#example').getAttribute('data-revision'),revision);
  await page.locator('[data-lon]').fill('170');
  await page.locator('[data-alpha]').fill('-20');
  assert.match(await page.locator('[data-status]').innerText(),/Rebuilt/);
  await page.click('[data-fiji]');
  assert.equal(await page.locator('[data-lon]').inputValue(),'180');
  assert.equal(await page.locator('#example').getAttribute('data-error'),null);
  if(process.env.CAPTURE_OMERC_SCREENSHOT)await page.screenshot({path:process.env.CAPTURE_OMERC_SCREENSHOT});
  await page.reload();await page.waitForFunction(()=>document.querySelector('#example').dataset.ready==='true');
  await page.goto(new URL('raster-frame.html',url).href);
  for(const id of ['north-up','point','rotated','axes']){
    await page.selectOption('[data-frame]',id);
    await page.waitForFunction(id=>document.querySelector('#example').dataset.ready===id,id);
    assert.equal(await page.locator('#example').getAttribute('data-error'),null);
    assert.match(await page.locator('[data-status]').innerText(),/12 samples/);
  }
  if(process.env.CAPTURE_RASTER_FRAME_SCREENSHOT)await page.screenshot({path:process.env.CAPTURE_RASTER_FRAME_SCREENSHOT});
  assert.deepEqual(errors, []);
  await page.goto(new URL('surface-mesh.html',url).href);
  await page.waitForFunction(()=>document.querySelector('#example').dataset.ready==='surface');
  if(process.env.CAPTURE_SURFACE_SCREENSHOT)await page.screenshot({path:process.env.CAPTURE_SURFACE_SCREENSHOT});
  for (const pose of ['0','0.37','1']) {
    await page.locator('[data-pose]').fill(pose);
    await page.locator('[data-pose]').dispatchEvent('input');
    assert.equal(await page.locator('#example').getAttribute('data-error'),null);
  }
  await page.locator('[data-walls]').uncheck();
  await page.locator('[data-normals]').check();
  assert.match(await page.locator('[data-status]').innerText(),/0 source walls/);
  assert.equal(await page.locator('#example').getAttribute('data-error'),null);
  assert.deepEqual(errors,[]);
} finally {await browser?.close(); await close();}
