// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';
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
  assert(await page.isChecked('[data-imagery]'));
  assert.equal(await page.evaluate(()=>window.projectionLab.results.inverse.earthTexture.width),256);
  await page.evaluate(()=>{window.initialMesh=window.projectionLab.results.inverse.meshes;});
  const observedTexture=await page.locator('[data-map="inverse"]').screenshot();
  await page.check('[data-native-polar]');
  const nativeTexture=await page.locator('[data-map="inverse"]').screenshot();
  assert(!observedTexture.equals(nativeTexture),'native polar fixture changes rendered texture');
  assert(await page.evaluate(()=>window.initialMesh===window.projectionLab.results.inverse.meshes));
  await page.uncheck('[data-native-polar]');

  const earthView=await page.locator('[data-map="inverse"]').screenshot();
  await page.uncheck('[data-imagery]');
  const checkerView=await page.locator('[data-map="inverse"]').screenshot();
  assert(!earthView.equals(checkerView),'texture toggle must visibly change the raster');
  assert(await page.evaluate(()=>window.initialMesh===window.projectionLab.results.inverse.meshes));
  await page.check('[data-imagery]');
  if(process.env.CAPTURE_INITIAL)await page.screenshot({path:process.env.CAPTURE_INITIAL});
  await page.click('[data-display]');
  await page.waitForFunction(()=>document.querySelector('[data-status]').textContent.startsWith('Display comparison complete'),null,{timeout:120000});
  const displayReport=JSON.parse(await page.locator('[data-measurements]').innerText());
  assert.equal(displayReport.rows.length,4);
  assert(await page.evaluate(()=>window.projectionLab.results.inverse.meshes[0].diagnostics.qualification.maximumDisplayError<=2));
  assert.match(await page.locator('.maps h2').first().innerText(),/qualified/);
  for(const row of displayReport.rows)for(const q of row.charts){assert(q.maximumDisplayError<=q.displayTolerance);assert(q.maximumTextureError<=q.textureTolerance);}
  await page.click('[data-limits]');
  await page.waitForFunction(()=>document.querySelector('#lab').dataset.limits,null,{timeout:120000});
  const limits=JSON.parse(await page.locator('#lab').getAttribute('data-limits'));
  assert.deepEqual(limits.map(r=>r.mode),['reuse','reuse','rebuild']);assert.equal(limits[2].reason,'domain-policy');
  assert(await page.evaluate(()=>window.projectionLab.results.inverse.meshes[0].indices.length>0));
  await page.evaluate(()=>{window.rebuiltMesh=window.projectionLab.results.inverse;});
  await page.check('[data-wire]');await page.uncheck('[data-imagery]');
  assert(await page.evaluate(()=>window.rebuiltMesh===window.projectionLab.results.inverse));
  assert.match(await page.locator('.maps h2').first().innerText(),/Full mesh after reuse limit/);
  await page.uncheck('[data-wire]');await page.check('[data-imagery]');

  await page.locator('[data-lon]').dispatchEvent('change');
  await ready('antarctica','native','orthographic');
  await page.click('[data-reuse]');
  await page.waitForFunction(()=>document.querySelector('#lab').dataset.reuse,null,{timeout:120000});
  const reuse=JSON.parse(await page.locator('#lab').getAttribute('data-reuse'));
  assert.equal(reuse.models,1);assert.equal(reuse.uvBuffers,1);assert.equal(reuse.replacementModels,12);assert.equal(reuse.updates,12);
  const measurements=JSON.parse(await page.locator('[data-measurements]').innerText());
  // 1089 vertices × (XYZ + UV + normal + RGB) float32 plus 6144 uint32 indices.
  assert(measurements.replacements.every(r=>r.bytes===1089*44+6144*4));
  assert(measurements.uploads.every(r=>r.bytes===1089*2*4));
  const left=PNG.sync.read(await page.locator('[data-map="inverse"] canvas').screenshot());
  const right=PNG.sync.read(await page.locator('[data-map="forward"] canvas').screenshot());
  let difference=0,countPixels=0;
  for(let y=10;y<90;y++)for(let x=10;x<90;x++)for(let c=0;c<3;c++) {
    const a=(Math.floor(y/100*left.height)*left.width+Math.floor(x/100*left.width))*4+c;
    const b=(Math.floor(y/100*right.height)*right.width+Math.floor(x/100*right.width))*4+c;
    difference+=Math.abs(left.data[a]-right.data[b]);countPixels++;
  }
  assert(difference/countPixels<8,'UV-only rendering must match full mesh replacement');
  if(process.env.CAPTURE_REUSE)await page.screenshot({path:process.env.CAPTURE_REUSE});
  await page.evaluate(()=>{document.querySelector('button[data-limits]').click();document.querySelector('[data-imagery]').click();});
  await page.waitForFunction(()=>document.querySelector('#lab').dataset.limits,null,{timeout:120000});
  assert.equal(await page.isChecked('[data-imagery]'),false);
  assert.match(await page.locator('.maps h2').first().innerText(),/Full mesh after reuse limit/);
  await page.check('[data-imagery]');
  await page.click('[data-reuse]');await page.waitForFunction(()=>document.querySelector('#lab').dataset.reuse,null,{timeout:120000});
  await page.evaluate(()=>{document.querySelector('[data-display]').click();document.querySelector('[data-wire]').click();});
  await page.waitForFunction(()=>document.querySelector('[data-status]').textContent.startsWith('Display comparison complete'),null,{timeout:120000});
  assert(await page.isChecked('[data-wire]'));
  assert(await page.evaluate(()=>window.projectionLab.results.inverse.meshes[0].diagnostics.qualification));
  await page.uncheck('[data-wire]');

  for(const engine of ['proj4','d3','wasm','native']) {
    await page.selectOption('[data-engine]',engine);await ready('antarctica',engine,'orthographic');
    const count=await page.evaluate(()=>window.projectionLab.results.inverse.diagnostics.triangles);assert(count>100);
    if(engine==='wasm'){
      await page.click('[data-reuse]');await page.waitForFunction(()=>document.querySelector('#lab').dataset.reuse,null,{timeout:120000});
      const result=JSON.parse(await page.locator('#lab').getAttribute('data-reuse'));assert.equal(result.models,1);assert.equal(result.uvBuffers,1);assert.equal(result.updates,12);
    }
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
  await page.uncheck('[data-wire]');
  if(process.env.CAPTURE_SCREENSHOT)await page.screenshot({path:process.env.CAPTURE_SCREENSHOT});
  // Cancellation retains the last completed report for both measurement modes.
  await page.selectOption('[data-source]','antarctica');await page.selectOption('[data-target]','orthographic');await ready('antarctica','native','orthographic');
  const previousReport=await page.locator('[data-measurements]').innerText();
  for(const button of ['data-benchmark','data-reuse','data-display','data-limits']) {
    await page.evaluate(button=>{document.querySelector(`button[${button}]`).click();document.querySelector('[data-lon]').dispatchEvent(new Event('change',{bubbles:true}));},button);
    await ready('antarctica','native','orthographic');
    await page.waitForFunction(()=>['data-benchmark','data-reuse','data-display','data-limits'].every(name=>!document.querySelector(`button[${name}]`).disabled));
    assert.equal(await page.isDisabled('[data-export]'),false);assert.equal(await page.locator('[data-measurements]').innerText(),previousReport);
  }
  // An unavailable image fails comparison, then restores the full fixture and
  // ordinary wire/texture controls rather than leaving a partial comparison.
  const failurePage=await browser.newPage({viewport:{width:1300,height:1000}});
  failurePage.on('pageerror',e=>errors.push(e.message));
  await failurePage.route('**/*.jpg',route=>route.abort());await failurePage.goto(url);
  await failurePage.waitForFunction(()=>document.querySelector('#lab').dataset.ready,null,{timeout:120000});
  await failurePage.click('[data-display]');
  await failurePage.waitForFunction(()=>document.querySelector('[data-status]').textContent.startsWith('Display comparison complete'),null,{timeout:120000});
  assert(await failurePage.evaluate(()=>window.projectionLab.results.inverse.meshes[0].diagnostics.qualification&&!window.projectionLab.results.inverse.earthTexture));
  await failurePage.click('[data-limits]');
  await failurePage.waitForFunction(()=>document.querySelector('#lab').dataset.limits,null,{timeout:120000});
  assert(await failurePage.evaluate(()=>window.projectionLab.results.inverse.meshes[0].indices.length>0&&!window.projectionLab.results.inverse.earthTexture));
  assert.match(await failurePage.locator('[data-imagery-note]').innerText(),/checkerboard/);
  await failurePage.click('[data-reuse]');
  await failurePage.waitForFunction(()=>document.querySelector('[data-status]').textContent.includes('UV comparison failed'),null,{timeout:120000});
  assert.equal(await failurePage.locator('.maps h2').first().innerText(),'Target grid → inverse UVs');
  await failurePage.evaluate(()=>{window.restoredMesh=window.projectionLab.results.inverse;});
  await failurePage.check('[data-wire]');
  assert(await failurePage.evaluate(()=>window.restoredMesh===window.projectionLab.results.inverse));
  await failurePage.evaluate(()=>window.projectionLab.dispose());await failurePage.close();
  await page.evaluate(()=>window.projectionLab.dispose());
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  console.log('Projection lab: four real engines, polar/Fiji/interrupted/horizon fixtures, supersession, measurements and disposal passed');
}finally{await browser?.close();await new Promise(done=>server.close(done));}
