// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Browser regressions for findings left on merged example PRs. No external requests.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createServer} from 'node:http';
import {basename, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import {chromium} from 'playwright';

const root = fileURLToPath(new URL('../', import.meta.url));
const files = new Map();
for (const [name, example, entry] of [
  ['unfold','geometry/unfolding-polyhedron','main.ts'],
  ['globe','geospatial/globe-primitives','app.js'],
  ['albers','geospatial/albers-usa','standalone.js'],
  ['expressions','core/expressions','main.tsx']
]) {
  const plugins = name === 'expressions' ? [{
    name: 'controlled-async-evaluation',
    setup(builder) {
      builder.onResolve({filter: /^@math\.gl\/core$/}, args =>
        args.importer === resolve(root,'examples/core/expressions/app.tsx') ? {path:'controlled',namespace:'review'} : null
      );
      builder.onLoad({filter:/.*/,namespace:'review'}, () => ({
        resolveDir:root,
        contents:`export * from ${JSON.stringify(resolve(root,'modules/core/src/index.ts'))};
import {compileAsync as original} from ${JSON.stringify(resolve(root,'modules/core/src/index.ts'))};
export function compileAsync(expression,options) {
  if (expression === 'reviewPending') return () => new Promise((yes,no) => {
    window.reviewRequest=(window.reviewRequest || 0)+1;
    window.finishReview=yes;window.failReview=no;
  });
  return original(expression,options);
}`
      }));
    }
  }] : [];
  const result = await build({
    entryPoints:[resolve(root,`examples/${example}/${entry}`)],
    outfile:resolve(root,`.review-output/${name}.js`),
    bundle:true,format:'esm',platform:'browser',write:false,plugins,loader:{'.ttf':'dataurl'}
  });
  for (const file of result.outputFiles) files.set('/'+basename(file.path),file.contents);
  const html=readFileSync(resolve(root,`examples/${example}/index.html`),'utf8')
    .replace(/<script type="module" src="[^"]+"><\/script>/,`<script type="module" src="/${name}.js"></script>`)
    .replace('</head>',`<link rel="stylesheet" href="/${name}.css"></head>`);
  files.set('/'+name,html);
}
const server=createServer((request,response)=>{
  const file=files.get(request.url);
  if (!file) {response.writeHead(404);response.end();return;}
  response.setHeader('Content-Type',request.url.endsWith('.js')?'text/javascript':request.url.endsWith('.css')?'text/css':'text/html');
  response.end(file);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser, page;
const errors=[];
try {
  browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  page=await browser.newPage({viewport:{width:1200,height:1000}});
  page.setDefaultTimeout(15000);
  await page.route('**/*',route => route.request().resourceType() === 'image' || new URL(route.request().url()).hostname !== '127.0.0.1' ? route.abort() : route.continue());
  page.on('pageerror',error=>errors.push(error.message));
  const url='http://127.0.0.1:'+server.address().port;

  await page.goto(url+'/unfold');
  await page.waitForSelector('#app canvas');
  const panel = page.locator('.example-info-box').first();
  await panel.getByRole('button', {name: 'Geometry and cuts'}).click();
  await page.locator('#solid').waitFor({state: 'hidden'});
  await panel.getByRole('button', {name: 'Geometry and cuts'}).click();
  await page.locator('#solid').waitFor({state: 'visible'});
  assert.equal(await page.locator('#solid').inputValue(), 'icosahedron');
  const sizes=await page.evaluate(()=>{
    const root=document.querySelector('#app'),canvas=root.querySelector('canvas');
    const height=()=>canvas.getBoundingClientRect().height;
    const standalone=height();root.dataset.compact='true';const compact=height();
    document.body.dataset.fullscreen='true';const fullscreen=height();
    delete document.body.dataset.fullscreen;delete root.dataset.compact;
    return {standalone,compact,fullscreen};
  });
  assert.equal(sizes.compact,280);
  assert(sizes.standalone>sizes.compact && sizes.fullscreen>sizes.compact,JSON.stringify(sizes));
  await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));
  assert(await page.locator('#app').evaluate(root=>root.childElementCount>0),'Cached page must remain mounted');
  await page.evaluate(()=>{
    window.reviewGL=document.querySelector('canvas').getContext('webgl2');
    window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:false}));
  });
  await page.waitForFunction(()=>window.reviewGL.isContextLost());
  assert.equal(await page.locator('#app').evaluate(root=>root.childElementCount),0);

  await page.goto(url+'/albers');
  for (const width of [1200, 600, 375]) {
    await page.setViewportSize({width, height:1000});
    const info = page.locator('.example-info-box');
    await info.scrollIntoViewIfNeeded();
    assert((await info.boundingBox()).height > 100, 'Inline panel must retain its natural content height');
    const toggle = info.getByRole('button', {name: 'Albers USA', exact:true});
    await toggle.click();
    await page.locator('.view-toggle').waitFor({state:'hidden'});
    await toggle.click();
    await page.locator('.view-toggle').waitFor({state:'visible'});
  }
  await page.setViewportSize({width:1200,height:1000});

  await page.goto(url+'/globe');
  await page.waitForFunction(()=>document.querySelector('#imagery-status').textContent.includes('unavailable'));
  assert(await page.locator('#metrics').textContent());
  await page.locator('#dateline').click();
  assert(Math.abs(Number.parseFloat(await page.locator('#longitude-value').textContent())) > 160);

  await page.goto(url+'/expressions');
  const expression=page.locator('textarea').first();
  await expression.fill('reviewPending');
  await page.waitForFunction(()=>window.reviewRequest===1);
  await expression.fill('(');
  await page.locator('.error-output').waitFor();
  const latestError=await page.locator('.error-output').textContent();
  await page.evaluate(()=>window.finishReview(123));
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  assert.equal(await page.locator('.error-output').textContent(),latestError);
  await expression.fill('reviewPending');
  await page.waitForFunction(()=>window.reviewRequest===2);
  await expression.fill('2+2');
  await page.waitForFunction(()=>document.querySelector('.result-output')?.textContent==='4');
  await page.evaluate(()=>window.failReview(new Error('obsolete request')));
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  assert.equal(await page.locator('.result-output').textContent(),'4');
  assert.equal(await page.locator('.error-output').count(),0);
  await page.getByRole('combobox', {name:'Longitude edges'}).selectOption('shortest');
  await expression.fill('[[-60,0],[60,0],[0,60],[0,-60]]');
  await page.waitForFunction(()=>document.querySelector('.result-output')?.textContent.includes('-60'));
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const crossing = await page.locator('canvas').evaluate(canvas => {
    const ratio = window.devicePixelRatio || 1;
    return Array.from(canvas.getContext('2d').getImageData(
      Math.floor(canvas.width/2 + 2*ratio), Math.floor(canvas.height/2), 1, 1
    ).data);
  });
  assert(crossing[0] > crossing[1] * 1.5, `Crossing remains red: ${crossing}`);
  assert.deepEqual(errors,[]);
  console.log('Merged-review browser regressions pass: BFCache, WebGL disposal, responsive sizing, failed imagery, stale async evaluation and crossing stroke order.');
} catch (error) {
  console.error({errors, page:page?.url(), status:await page?.locator('body').innerText().catch(()=>'' )});
  throw error;
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise(resolve=>server.close(resolve));
}
