// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {PNG} from 'pngjs';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import {chromium} from 'playwright';

function imageDifference(first, second) {
  const a=PNG.sync.read(first),b=PNG.sync.read(second);
  assert.equal(a.data.length,b.data.length);
  let total=0;for(let i=0;i<a.data.length;i++) total+=Math.abs(a.data[i]-b.data[i]);
  return total/a.data.length;
}

const server = await createServer({root: fileURLToPath(new URL('.', import.meta.url)), configLoader: 'runner', cacheDir: '/tmp/mathgl-dggs-vite', server: {host:'127.0.0.1',port:0}});
await server.listen();
const browser = await chromium.launch({args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']});
try {
  const page = await browser.newPage({viewport:{width:1200,height:800}});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(server.resolvedUrls.local[0]);
  await page.getByTestId('cell-center').waitFor();
  for (const name of ['a5','geohash','h3','plus-code','quadkey','s2']) {
    await page.getByRole('combobox').selectOption(name);
    assert.equal(await page.getByRole('alert').count(),0,name);
    await page.getByLabel('Cell ID',{exact:true}).fill('invalid');
    await page.getByRole('alert').waitFor();
    assert(await page.getByRole('button',{name:'Fit cell'}).isDisabled());
    await page.getByRole('button',{name:'Reset ID'}).click();
  }
  const hierarchy = await page.evaluate(async()=> {
    const {s2Hierarchy}=await import('/model.js');
    const parent=s2Hierarchy('80858004').parent;
    return s2Hierarchy(parent).children;
  });
  assert(hierarchy.includes('80858004'));
  await page.getByRole('button',{name:'Parent',exact:true}).click();
  await page.getByRole('button',{name:'Child 1',exact:true}).click();
  await page.getByLabel('Cell ID',{exact:true}).fill('invalid');
  await page.getByRole('alert').waitFor();
  await page.getByRole('button',{name:'Reset ID'}).click();
  await page.getByRole('button',{name:'Fit cell'}).click();
  await page.getByLabel('Compare six').check();
  await page.getByLabel('Unwrap antimeridian').uncheck();
  await page.getByLabel('Compare six').uncheck();
  await page.getByRole('button',{name:'Antimeridian sample'}).click();
  const widths=await page.evaluate(async()=>{const {decodeCell}=await import('/model.js');return [false,true].map(unwrap=>{const {boundary}=decodeCell('h3','835ba5fffffffff',unwrap);const values=boundary.map(point=>point[0]);return Math.max(...values)-Math.min(...values);});});
  assert(widths[0]>180 && widths[1]<180);
  await page.getByRole('combobox').selectOption('a5');
  await page.getByRole('button',{name:'Fit cell'}).click();
  await page.waitForTimeout(500);
  const canvas=page.locator('canvas').first();
  const fitted=await canvas.screenshot();
  await page.mouse.move(450,400);
  await page.mouse.wheel(0,-300);
  await page.waitForTimeout(500);
  assert(imageDifference(fitted,await canvas.screenshot())>0.02,'Zoom gesture must move the rendered camera');
  await page.getByRole('button',{name:'Fit cell'}).click();
  await page.waitForTimeout(500);
  assert(imageDifference(fitted,await canvas.screenshot())<0.02,'Repeated Fit cell must restore the rendered view (allowing subpixel rounding)');
  await page.setViewportSize({width:390,height:400});
  assert.equal(await page.locator('.dggs-explorer').evaluate(element=>element.clientHeight),400);
  await page.getByRole('link',{name:'Inspired by the community global grid example'}).scrollIntoViewIfNeeded();
  const bottom=await page.getByRole('link',{name:'Inspired by the community global grid example'}).boundingBox();
  assert(bottom.y>=0 && bottom.y+bottom.height<=401);
  await page.setViewportSize({width:1200,height:800});
  await page.locator('.example-panel').evaluate(element=>element.scrollTop=0);
  const outsideLayout=await page.evaluate(()=>{const sibling=document.createElement('div');sibling.style.height='500px';document.body.append(sibling);const height=parseFloat(getComputedStyle(document.body).height);sibling.remove();return {height,expected:innerHeight+500};});
  assert(outsideLayout.height>=outsideLayout.expected,'Example CSS must not constrain the surrounding page body');
  assert.deepEqual(errors,[]);
  if(process.env.SCREENSHOT_PATH) await page.screenshot({path:process.env.SCREENSHOT_PATH});
  console.log('DGGS: six fixtures, S2 hierarchy, invalid input, fit, comparison, and unwrap controls passed.');
} finally {await browser.close(); await server.close();}
