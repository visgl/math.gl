// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import {chromium} from 'playwright';
const server = await createServer({root:fileURLToPath(new URL('.',import.meta.url)),configLoader:'runner',cacheDir:'/tmp/mathgl-wkb-workbench-vite',server:{host:'127.0.0.1',port:0}});
await server.listen();
const browser = await chromium.launch();
try {
  const page=await browser.newPage({viewport:{width:1200,height:950}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(server.resolvedUrls.local[0]);
  await page.getByTestId('wkb-statistics').waitFor();
  for(const name of ['Polygon with hole','3D line','Measured point','ZM multipoint','Collection','Empty point','EWKB SRID 4326','Big endian point']) {
    await page.getByLabel('Fixture',{exact:true}).selectOption(name);
    assert.equal(await page.getByRole('alert').count(),0,name);
    await page.getByTestId('wkb-statistics').waitFor();
    if(name==='Measured point') assert.match(await page.getByLabel('Formatted WKT',{exact:true}).inputValue(),/POINT M/);
    if(name==='EWKB SRID 4326') assert.match(await page.getByTestId('wkb-statistics').innerText(),/SRID: 4326/);
    if(name==='Big endian point') assert.match(await page.getByTestId('wkb-statistics').innerText(),/Big endian/);
  }
  const roundTrip=await page.evaluate(async()=> {
    const {inspectGeometry,FIXTURES}=await import('/model.js');
    return Object.values(FIXTURES).filter(value=>value.mode==='wkt').every(({text})=> {
      const first=inspectGeometry('wkt',text),second=inspectGeometry('hex',first.hex);
      return first.wkt===second.wkt && first.hex===second.hex;
    });
  });assert(roundTrip);
  await page.getByLabel('Fixture',{exact:true}).selectOption('Truncated WKB');await page.getByRole('alert').waitFor();
  for(const text of ['0','zz','0101000000000000000000f03f000000000000004000']) {
    await page.getByLabel('Geometry input',{exact:true}).fill(text);await page.getByRole('alert').waitFor();
  }
  await page.getByLabel('Input format',{exact:true}).selectOption('wkt');
  await page.getByLabel('Geometry input',{exact:true}).fill('POINT (broken)');await page.getByRole('alert').waitFor();
  await page.getByLabel('Geometry input',{exact:true}).fill('GEOMETRYCOLLECTION (POINT Z (1 2 3), POINT M (4 5 6))');await page.getByRole('alert').waitFor();
  await page.getByLabel('Fixture',{exact:true}).selectOption('Polygon with hole');
  console.log('WKB: fixture round trips, dimensions, EWKB SRID, byte order, malformed input, truncation, trailing bytes, and mixed dimensions passed.');
  await page.setViewportSize({width:390,height:400});
  assert.equal(await page.locator('.wkb-workbench').evaluate(element=>element.clientHeight),400);
  await page.getByText('Input is limited to').scrollIntoViewIfNeeded();
  const bottom=await page.getByText('Input is limited to').boundingBox();
  assert(bottom.y>=0 && bottom.y+bottom.height<=401);
  await page.setViewportSize({width:1200,height:950});
  await page.locator('.wkb-workbench').evaluate(element=>element.scrollTop=0);
  assert.deepEqual(errors,[]);
  if(process.env.SCREENSHOT_PATH) await page.screenshot({path:process.env.SCREENSHOT_PATH});
} finally {await browser.close();await server.close();}
