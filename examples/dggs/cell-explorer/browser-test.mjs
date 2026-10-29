// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import {chromium} from 'playwright';

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
  assert.deepEqual(errors,[]);
  if(process.env.SCREENSHOT_PATH) await page.screenshot({path:process.env.SCREENSHOT_PATH});
  console.log('DGGS: six fixtures, S2 hierarchy, invalid input, fit, comparison, and unwrap controls passed.');
} finally {await browser.close(); await server.close();}
