// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import {chromium} from 'playwright';
const server = await createServer({root:fileURLToPath(new URL('.',import.meta.url)),configLoader:'runner',cacheDir:'/tmp/mathgl-terrain-sampling-vite',server:{host:'127.0.0.1',port:0}});
await server.listen();
const browser = await chromium.launch();
try {
  const page=await browser.newPage({viewport:{width:1200,height:950}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(server.resolvedUrls.local[0]);
  await page.getByTestId('sample-status').waitFor();
  assert.match(await page.getByTestId('sample-status').innerText(),/VALID/);
  const values = await page.evaluate(async()=> {
    const {createTerrain,TerrainSampleStatus}=await import('/model.js');
    const a=createTerrain('00-11',false),b=createTerrain('10-01',false);
    return {triangles:a.triangles.length, missing:createTerrain('00-11',true).triangles.length,
      outside:a.field.sample(-1,35).status, valid:TerrainSampleStatus.VALID,
      noData:createTerrain('00-11',true).field.sample(40,40).status,
      heights:[a.field.sample(35,35,{interpolation:'bilinear'}).height,a.field.sample(35,35,{interpolation:'triangle'}).height,b.field.sample(35,35,{interpolation:'triangle'}).height]};
  });
  assert.equal(values.triangles,128);assert(values.missing<128);assert.notEqual(values.outside,values.valid);assert.notEqual(values.noData,values.valid);
  assert.notEqual(values.heights[0],values.heights[1]);assert.notEqual(values.heights[1],values.heights[2]);
  await page.getByLabel('Show mesh normals').check();
  await page.getByRole('combobox').first().selectOption('triangle');
  await page.getByRole('combobox').nth(1).selectOption('10-01');
  await page.getByLabel('Missing center vertex').check();
  for(const axis of ['X','Y']) await page.getByLabel(`Probe ${axis}`,{exact:true}).fill('40');
  assert.match(await page.getByTestId('sample-status').innerText(),/NO_DATA/);
  await page.getByLabel('Probe X',{exact:true}).fill('-10');
  assert.match(await page.getByTestId('sample-status').innerText(),/OUTSIDE_DOMAIN/);
  await page.getByLabel('Missing center vertex').uncheck();
  await page.getByLabel('Probe X',{exact:true}).fill('35');
  await page.getByLabel('Probe Y',{exact:true}).fill('35');
  await page.getByLabel('Plan view:',{exact:false}).click({position:{x:50,y:50}});
  assert.match(await page.getByTestId('sample-status').innerText(),/VALID/);
  console.log('Terrain: mesh, interpolation differences, diagonals, missing samples, outside domain, normals, and pointer controls passed.');
  await page.setViewportSize({width:390,height:400});
  assert.equal(await page.locator('.terrain-sampling').evaluate(element=>element.clientHeight),400);
  await page.getByText('Triangle interpolation matches').scrollIntoViewIfNeeded();
  const bottom=await page.getByText('Triangle interpolation matches').boundingBox();
  assert(bottom.y>=0 && bottom.y+bottom.height<=401);
  await page.setViewportSize({width:1200,height:950});
  await page.locator('.terrain-sampling').evaluate(element=>element.scrollTop=0);
  assert.deepEqual(errors,[]);
  if(process.env.SCREENSHOT_PATH) await page.screenshot({path:process.env.SCREENSHOT_PATH});
} finally {await browser.close();await server.close();}
