// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {serveLab} from './server.mjs';
const {server,url}=await serveLab();let browser;
try {
  browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:1300,height:1000}}),errors=[],external=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith(url)&&!r.url().startsWith('blob:')&&!r.url().startsWith('data:'))external.push(r.url());});
  await page.goto(url);
  async function ready(source,engine,target) {
    await page.waitForFunction(({source,engine,target})=>{const key=document.querySelector('#lab').dataset.ready;if(!key)return false;const s=JSON.parse(key);return s.source===source&&s.engine===engine&&s.target===target;},{source,engine,target},{timeout:120000});
    assert.equal(await page.locator('#lab').getAttribute('data-error'),null);
  }
  await ready('antarctica','native','orthographic');
  if(process.env.CAPTURE_INITIAL)await page.screenshot({path:process.env.CAPTURE_INITIAL});
  for(const engine of ['proj4','d3','wasm','native']) {
    await page.selectOption('[data-engine]',engine);await ready('antarctica',engine,'orthographic');
    const count=await page.evaluate(()=>window.projectionLab.results.inverse.diagnostics.triangles);assert(count>100);
  }
  for(const engine of ['native','proj4','d3','wasm']) {
    await page.selectOption('[data-source]','fiji');await page.selectOption('[data-engine]',engine);await ready('fiji',engine,'world');
  }
  await page.selectOption('[data-source]','antarctica');await page.selectOption('[data-engine]','native');await page.selectOption('[data-target]','interrupted');await ready('antarctica','native','interrupted');
  assert.equal(await page.evaluate(()=>window.projectionLab.results.inverse.meshes.length),3);
  await page.check('[data-wire]');
  await page.selectOption('[data-target]','perspective');await ready('antarctica','native','perspective');
  await page.selectOption('[data-target]','world');await ready('antarctica','native','world');
  assert.match(await page.locator('[data-stats="forward"]').innerText(),/no continuous patch/);
  await page.selectOption('[data-engine]','wasm');await page.selectOption('[data-source]','fiji');await page.selectOption('[data-engine]','native');await ready('fiji','native','world');
  await page.click('[data-benchmark]');await page.waitForFunction(()=>!document.querySelector('[data-export]').disabled,null,{timeout:120000});
  assert.match(await page.locator('[data-measurements]').innerText(),/endToEndMs/);
  if(process.env.CAPTURE_SCREENSHOT)await page.screenshot({path:process.env.CAPTURE_SCREENSHOT});
  await page.evaluate(()=>window.projectionLab.dispose());
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  console.log('Projection lab: four real engines, polar/Fiji/interrupted/horizon fixtures, supersession, measurements and disposal passed');
}finally{await browser?.close();await new Promise(done=>server.close(done));}
