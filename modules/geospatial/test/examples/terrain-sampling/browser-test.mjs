// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import {chromium} from 'playwright';
const server = await createServer({root:fileURLToPath(new URL('../../../../../examples/geospatial/terrain-sampling/', import.meta.url)),configLoader:'runner',cacheDir:'/tmp/mathgl-terrain-sampling-vite',server:{host:'127.0.0.1',port:0}});
await server.listen();
const browser = await chromium.launch({executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH});
try {
  const page=await browser.newPage({viewport:{width:1200,height:950}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(server.resolvedUrls.local[0]);
  await page.getByTestId('sample-status').waitFor();
  assert.match(await page.getByTestId('sample-status').innerText(),/VALID/);
  const themedBorders = await page.evaluate(()=>{
    // Reproduce the website's variable-driven table and row borders inside a light/dark host.
    const style=document.createElement('style');
    style.textContent='table,table tr,table th,table td{border:1px solid var(--test-table-border)}';
    document.head.append(style);
    const readout=document.querySelector('.terrain-probe-readout');
    const read=()=>[...readout.querySelectorAll('table,tr,th,td')].map(el=>getComputedStyle(el).borderColor);
    readout.style.setProperty('--test-table-border','#d0d0d0');const light=read();
    readout.style.setProperty('--test-table-border','#303030');const dark=read();
    readout.style.removeProperty('--test-table-border');style.remove();
    return {light,dark};
  });
  assert.deepEqual(themedBorders.light,themedBorders.dark);
  assert(themedBorders.light.every(color=>color==='rgb(66, 98, 119)'));

  const headers = page.locator('.terrain-groups > .example-panel header button');
  assert.equal(await headers.count(), 7);
  assert.deepEqual(await headers.first().evaluate(el=>{const s=getComputedStyle(el);return [s.fontSize,s.paddingTop,s.paddingBottom];}),['14px','8px','8px']);
  assert.equal(await page.locator('.terrain-groups').evaluate(el=>getComputedStyle(el).gap),'2px');
  async function openGroup(title) {
    const button = page.getByRole('button', {name: title, exact: true});
    if (await button.getAttribute('aria-expanded') !== 'true') await button.click();
    assert.equal(await page.locator('.terrain-groups header button[aria-expanded="true"]').count(), 1);
  }
  assert.equal(await page.getByRole('img', {name: 'Mesh lab wireframe'}).count(), 0);
  assert.equal(await page.getByLabel('Mesh dataset').count(), 0);
  const positions = await headers.evaluateAll(items => items.map(item => {
    const rect = item.getBoundingClientRect();
    return {left: rect.left, top: rect.top};
  }));
  assert(positions.every(item => item.left === positions[0].left));
  assert(positions.every((item, i) => i === 0 || item.top > positions[i - 1].top));
  assert((await page.locator('.terrain-stage').boundingBox()).x > positions[0].left);

  const values = await page.evaluate(async()=> {
    const {createTerrain,TerrainSampleStatus}=await import('/src/model.js');
    const a=createTerrain('00-11',false),b=createTerrain('10-01',false);
    return {triangles:a.triangles.length, missing:createTerrain('00-11',true).triangles.length,
      outside:a.field.sample(-1,35).status, valid:TerrainSampleStatus.VALID,
      noData:createTerrain('00-11',true).field.sample(40,40).status,
      heights:[a.field.sample(35,35,{interpolation:'bilinear'}).height,a.field.sample(35,35,{interpolation:'triangle'}).height,b.field.sample(35,35,{interpolation:'triangle'}).height]};
  });
  assert.equal(values.triangles,128);assert(values.missing<128);assert.notEqual(values.outside,values.valid);assert.notEqual(values.noData,values.valid);
  assert.notEqual(values.heights[0],values.heights[1]);assert.notEqual(values.heights[1],values.heights[2]);
  await openGroup('Tiles & LOD');
  assert.equal(await page.getByTestId('sample-status').count(), 0);
  const seams = page.getByRole('region', {name: 'Terrain transitions and seam derivatives'});
  const transition = page.getByTestId('transition-result');
  const drawingInsets=await page.locator('.terrain-transition-comparison svg').evaluateAll(items=>items.map(svg=>{
    const matrix=svg.getScreenCTM();return Math.abs(-8*matrix.a+matrix.e-svg.getBoundingClientRect().left);
  }));
  assert(drawingInsets.every(inset=>inset<1));
  const readings = page.getByRole('table', {name:'Shared boundary gradients'});
  assert.match(await transition.innerText(), /Shared height gap: 0.000000/);
  await page.getByLabel('Surface', {exact:true}).selectOption('plane');
  assert.equal(await readings.locator('tbody tr').first().locator('td').nth(1).textContent(),'0.200, 0.100');
  await page.getByLabel('Resolution ratio').selectOption('4');
  assert.equal(await readings.locator('tbody tr').nth(3).locator('td').nth(2).textContent(),'0.200, 0.100');
  await page.getByLabel('Coarse neighbor resident').uncheck();
  assert.equal(await readings.locator('tbody tr').first().locator('td').nth(1).textContent(),'Unavailable');
  assert.match(await transition.innerText(), /Shared height gap: unavailable/);
  await page.getByLabel('Coarse neighbor resident').check();
  await page.getByLabel('Surface', {exact:true}).selectOption('curved');
  await page.getByLabel('Independent morph factors').check();
  await page.getByLabel('Coarse morph factor').fill('0.75');
  await page.getByLabel('Fine morph factor').fill('0.2');
  await page.getByLabel('Coordinate shared boundary').uncheck();
  assert(!/Shared height gap: 0.000000/.test(await transition.innerText()));
  await page.getByLabel('Coordinate shared boundary').check();
  assert.match(await transition.innerText(), /Shared height gap: 0.000000/);
  await page.getByLabel('Derivative method').selectOption('zevenbergen-thorne');
  await page.getByLabel('Missing coarse sample').check();
  assert.match(await transition.innerText(), /Shared height gap: unavailable/);
  await page.getByLabel('Missing coarse sample').uncheck();
  await page.getByLabel('Independent morph factors').uncheck();
  const originalMorph = await page.locator('[data-transition-profile="raw"]').evaluateAll(items=>items.map(el=>el.getAttribute('points')));
  await page.getByLabel('Morph factor',{exact:true}).fill('1');
  assert.notDeepEqual(await page.locator('[data-transition-profile="raw"]').evaluateAll(items=>items.map(el=>el.getAttribute('points'))),originalMorph);
  assert((await page.locator('[data-derivative-arrow]').count())>0);
  await page.getByLabel('Show derivative arrows').uncheck();
  assert.equal(await page.locator('[data-derivative-arrow]').count(),0);
  await page.getByLabel('Show derivative arrows').check();
  if(process.env.SCREENSHOT_PATH) await page.screenshot({path:process.env.SCREENSHOT_PATH.replace(/\.png$/, '-transitions.png')});
  await openGroup('Contour tolerance');
  assert.equal(await seams.count(), 0);
  assert.equal(await page.getByLabel('Contour tolerance view').count(), 0);
  assert.equal(await page.getByLabel('Missing brush center').count(), 0);
  const profile = page.getByRole('img', {name:'Sampled and simplified terrain cross section',exact:true});
  assert.equal(await profile.locator('[data-section-path="sampled"]').count(), 1);
  const originalProfile = await profile.locator('[data-section-path="sampled"]').getAttribute('points');
  await page.getByLabel('Contour topology tolerance').fill('4');
  assert((await profile.locator('[data-section-path="simplified"]').getAttribute('points')).split(' ').length < 9);
  assert.equal(await profile.locator('[data-section-path="sampled"]').getAttribute('points'), originalProfile);
  await page.getByLabel('Reject unsafe paths locally').check();
  assert.equal(await page.getByTestId('topology-result').count(), 1);
  await page.getByLabel('Contour topology tolerance').fill('0');
  const heightMap = page.getByRole('img', {name:'Edited terrain height map',exact:true});
  assert.equal(await heightMap.locator('[data-height-sample]').count(), 81);
  const bandMap = page.getByRole('img', {name:'Elevation bands with nodata holes',exact:true});
  assert.equal(await heightMap.getAttribute('viewBox'), await bandMap.getAttribute('viewBox'));
  assert.equal(await heightMap.locator('[data-edited-sample]').getAttribute('x'), '4');
  const squares = await page.locator('.terrain-edit-comparison > figure:not(.terrain-cross-section) svg').evaluateAll(items=>items.map(item=>{const r=item.getBoundingClientRect();return {width:r.width,height:r.height};}));
  assert.equal(squares.length,2);
  const plotScales = await page.locator('.terrain-edit-comparison svg').evaluateAll(items=>items.map(svg=>{
    const matrix=svg.getScreenCTM();return {x:matrix.a,y:matrix.d,left:svg.getBoundingClientRect().left,top:svg.getBoundingClientRect().top};
  }));
  assert.equal(plotScales.length,3);
  assert(plotScales.every(scale=>Math.abs(scale.x-plotScales[0].x)<0.01&&Math.abs(scale.y-plotScales[0].y)<0.01));
  assert(plotScales[0].left<plotScales[1].left&&plotScales[1].left<plotScales[2].left);
  assert(plotScales.every(scale=>Math.abs(scale.top-plotScales[0].top)<1));
  assert.equal(await page.locator('.terrain-groups p').count(),0);
  for (const id of ['terrain-edit-result']) {
    assert.equal(await page.getByTestId(id).evaluate(el=>el.closest('figure')?.querySelector('figcaption')?.textContent), 'Height map');
  }
  assert.equal(await page.getByTestId('topology-result').evaluate(el=>el.closest('figure')?.querySelector('figcaption')?.textContent), 'Center-row cross section');
  assert.deepEqual(await profile.locator('[data-section-base]').evaluate(el=>['x1','y1','x2','y2'].map(name=>el.getAttribute(name))),['0','9','9','9']);
  assert.equal(await profile.locator('text').count(),0);
  await page.setViewportSize({width:2400,height:950});
  const wideScales = await page.locator('.terrain-edit-comparison svg').evaluateAll(items=>items.map(svg=>{const m=svg.getScreenCTM();return {x:m.a,y:m.d};}));
  assert(wideScales.every(scale=>Math.abs(scale.x-wideScales[0].x)<0.01&&Math.abs(scale.y-wideScales[0].y)<0.01));
  await page.setViewportSize({width:1200,height:950});
  assert(Math.abs(squares[0].width-squares[1].width)<1 && Math.abs(squares[0].height-squares[1].height)<1);
  const originalCenterColor = await heightMap.locator('[data-edited-sample]').getAttribute('fill');
  const unchangedColor = await heightMap.locator('[data-height-sample]').first().getAttribute('fill');
  await page.getByLabel('Terrain brush peak').fill('9');
  assert.notEqual(await heightMap.locator('[data-edited-sample]').getAttribute('fill'), originalCenterColor);
  assert.equal(await heightMap.locator('[data-height-sample]').first().getAttribute('fill'), unchangedColor);
  assert.match(await page.getByTestId('terrain-edit-result').innerText(), /9.00/);
  assert((await profile.locator('[data-section-path="sampled"]').getAttribute('points')).includes('4.5,0'));
  await page.getByLabel('Terrain brush peak').fill('0');
  assert.equal(await page.getByLabel('Terrain brush peak').getAttribute('aria-valuetext'), 'Missing center sample');
  assert.equal(await profile.locator('[data-section-path="sampled"]').count(), 2);
  assert.equal(await profile.locator('[data-section-path="simplified"]').count(), 2);
  const missingProfile = await profile.locator('[data-section-path="sampled"]').evaluateAll(items=>items.map(item=>item.getAttribute('points')));
  assert.equal(await heightMap.locator('[data-edited-sample]').getAttribute('fill'), '#687587');
  const heightsBeforeBandChange = await heightMap.locator('rect').evaluateAll(items=>items.map(item=>item.getAttribute('fill')));
  await page.getByLabel('Isoband boundary').fill('3');
  assert.deepEqual(await heightMap.locator('rect').evaluateAll(items=>items.map(item=>item.getAttribute('fill'))), heightsBeforeBandChange);
  assert.ok(await page.getByRole('img', {name: 'Elevation bands with nodata holes'}).locator('path').count());
  assert.deepEqual(await profile.locator('[data-section-path="sampled"]').evaluateAll(items=>items.map(item=>item.getAttribute('points'))),missingProfile);
  await page.getByLabel('Terrain brush peak').fill('4');
  assert.equal(await profile.locator('[data-section-path="sampled"]').count(),1);
  if(process.env.SCREENSHOT_PATH) await page.screenshot({path:process.env.SCREENSHOT_PATH.replace(/\.png$/, '-edits.png')});
  await openGroup('Geographic seams & LOD');
  const geographic = page.getByRole('region', {name: 'Geographic seam and sparse terrain LOD'});
  assert.match(await geographic.getByRole('status').first().innerText(), /height jump 0\.00 m/);
  assert.match(await geographic.getByRole('status').last().innerText(), /Coarse east tile/);
  await page.getByLabel('Camera height').fill('1');
  assert.match(await geographic.getByRole('status').last().innerText(), /42 triangles/);
  await page.getByLabel('Near-pole seam').check();
  assert.match(await geographic.getByRole('status').first().innerText(), /88\.5°/);
  await page.getByLabel('Neighbor and fine tile resident').uncheck();
  assert.match(await geographic.getByRole('status').first().innerText(), /neighbor unavailable/);
  assert.match(await geographic.getByRole('status').last().innerText(), /Coarse east tile/);
  await openGroup('Breakline authoring');
  const authoring = page.getByRole('region', {name: 'Terrain breakline authoring'});
  assert.match(await authoring.getByRole('status').innerText(), /6 segments/);
  await page.getByLabel('Ridge height').fill('1');
  assert.match(await authoring.getByRole('status').innerText(), /Conflicting breakline heights/);
  await openGroup('Streaming replay');
  const replayLayout=await page.getByRole('img',{name:'Resident and rebuilt terrain tiles',exact:true}).evaluate(svg=>{
    const r=svg.getBoundingClientRect(),main=svg.closest('main').getBoundingClientRect();
    const legend=svg.parentElement.querySelector('figcaption').getBoundingClientRect();
    return {width:r.width,expected:Math.min(main.width/2,280),center:r.top+r.height/2,expectedCenter:main.top+main.height/2,legendTop:legend.top,bottom:r.bottom};
  });
  assert(Math.abs(replayLayout.width-replayLayout.expected)<1);
  assert(Math.abs(replayLayout.center-replayLayout.expectedCenter)<1);
  assert(replayLayout.legendTop>replayLayout.bottom);
  assert.equal(await page.getByTestId('transition-result').count(),0);
  assert.equal(await page.getByLabel('Resolution ratio').count(),0);
  await page.getByLabel('Terrain streaming step').fill('16');
  assert.match(await page.getByTestId('streaming-result').innerText(), /16 resident tiles/);
  await page.getByLabel('Terrain streaming step').fill('17');
  await page.getByLabel('Terrain streaming step').fill('18');
  assert.match(await page.getByTestId('streaming-result').innerText(), /15 resident tiles/);
  assert.match(await page.getByTestId('streaming-result').innerText(), /1 evictions/);
  await page.getByLabel('Terrain streaming step').fill('19');
  assert.match(await page.getByTestId('streaming-result').innerText(), /16 resident tiles/);
  await page.getByLabel('Pacific bathymetry').check();
  const pacific = page.getByRole('region', {name: 'Pacific bathymetry replay'});
  assert.match(await pacific.getByRole('status').innerText(), /2 resident tiles.*[1-9][0-9]* displayed below-zero cells/);
  await page.getByLabel('Pacific replay step').selectOption('4');
  assert.equal(await pacific.getByRole('img').locator('polygon[fill]:not([fill="none"])').count(), 2042);
  assert.match(await pacific.innerText(), /100\.0×/);
  await page.getByLabel('Bathymetry zoom').fill('1');
  assert.match(await pacific.innerText(), /Vertical exaggeration: 1\.0×/);
  await page.getByLabel('Pacific replay step').selectOption('6');
  assert.match(await pacific.getByRole('status').innerText(), /1 resident tiles/);

  await openGroup('Mesh generation');
  assert.equal(await page.getByTestId('streaming-result').count(), 0);
  assert.equal(await page.getByLabel('Mesh algorithm', {exact:true}).count(), 0);
  const regularStats = page.getByTestId('mesh-lab-stats-regular');
  const martiniStats = page.getByTestId('mesh-lab-stats-martini');
  const initialTriangles = await page.getByRole('img', {name:'MARTINI mesh', exact:true}).locator('[data-mesh-triangle]').count();
  assert.match(await regularStats.innerText(), /2048 triangles/);
  for (const title of ['Regular', 'MARTINI', 'Delatin']) {
    assert((await page.getByRole('img', {name:`${title} mesh`, exact:true}).locator('[data-mesh-triangle]').count()) > 0);
  }
  const meshPositions = await page.locator('.terrain-mesh-result svg').evaluateAll(items => items.map(item => {
    const r = item.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height};
  }));
  assert.equal(meshPositions.length, 4);
  assert(meshPositions.every(item => Math.abs(item.y - meshPositions[0].y) < 1 && Math.abs(item.width - item.height) < 1));
  assert(meshPositions.every((item,i)=>i === 0 || item.x > meshPositions[i-1].x));
  assert.equal(await page.locator('[data-source-sample]').count(), 1089);
  assert.equal(await page.locator('[data-missing-source]').count(), 0);
  await page.getByLabel('Mesh nodal error heatmap').check();
  assert.equal(await page.locator('[data-mesh-error]').count(), 1089 * 3);
  await page.getByLabel('Mesh error tolerance').fill('10');
  assert((await page.getByRole('img', {name:'MARTINI mesh', exact:true}).locator('[data-mesh-triangle]').count()) < initialTriangles);
  assert.match(await martiniStats.innerText(), /output bytes/);
  await page.getByLabel('Mesh nodal error heatmap').uncheck();
  await page.getByLabel('Mesh dataset').selectOption('dem');
  assert.equal(await page.locator('[data-source-sample]').count(), 81);
  for (const id of ['regular','martini','delatin']) assert.match(await page.getByTestId(`mesh-lab-stats-${id}`).innerText(), /output bytes/);
  for (const dataset of ['holes','sierra','pacific']) {
    await page.getByLabel('Mesh dataset').selectOption(dataset);
    assert.equal(await page.locator('[data-unsupported-mesh]').count(), 2);
    assert((await page.locator('[data-missing-source]').count()) > 0);
    assert.deepEqual(await page.locator('[data-unsupported-mesh]').evaluateAll(items => items.map(item=>item.getAttribute('fill'))), ['#7f1d1d','#7f1d1d']);
    assert.equal(await page.getByRole('status').count(), 2);
    assert.match(await regularStats.innerText(), /output bytes/);
    assert((await page.getByRole('img', {name:'Regular mesh', exact:true}).locator('[data-mesh-triangle]').count()) > 0);
  }
  await page.getByLabel('Mesh dataset').selectOption('coast');
  assert.equal(await page.locator('[data-unsupported-mesh]').count(), 0);
  assert.match(await regularStats.innerText(), /2048 triangles/);
  await openGroup('Sampling & analysis');
  assert.equal(await page.getByLabel('Mesh dataset').count(), 0);
  await page.getByLabel('Show mesh normals').check();
  await page.getByLabel('Interpolation').selectOption('triangle');
  await page.getByLabel('Cell diagonal').selectOption('10-01');
  assert.equal(await page.getByLabel('Analysis view', {exact:true}).count(), 0);
  assert.equal(await page.getByLabel('Probe X', {exact:true}).count(), 0);
  assert.equal(await page.getByLabel('Probe Y', {exact:true}).count(), 0);
  assert.equal(await page.locator('.terrain-analysis-grid figure').count(), 4);
  for (const type of ['elevation','slope','contours']) assert.equal(await page.getByRole('img', {name:`${type} terrain analysis`,exact:true}).count(), 1);
  const analysisPositions = await page.locator('.terrain-analysis-grid figure').evaluateAll(items => items.map(item=>item.getBoundingClientRect().top));
  assert(analysisPositions.every(y=>Math.abs(y-analysisPositions[0])<1));
  const slopeBlocks = page.getByRole('img', {name: 'slope terrain analysis'}).locator('rect');
  assert.equal(await slopeBlocks.count(), 81);
  const coverageBefore = await slopeBlocks.evaluateAll(blocks => blocks.map(block => block.getAttribute('fill')));
  await page.getByLabel('Missing center vertex').check();
  const coverageAfter = await slopeBlocks.evaluateAll(blocks => blocks.map(block => block.getAttribute('fill')));
  assert.notDeepEqual(coverageAfter, coverageBefore);
  const contourSegments = page.getByRole('img', {name: 'contours terrain analysis'}).locator('[data-contour-segment]');
  const fullSegments = await contourSegments.count();
  const fullDiagnostics = await page.getByTestId('analysis-description').innerText();
  assert(fullSegments > 0);
  assert.match(fullDiagnostics, /open endpoints or junctions/);
  const plan = page.getByRole('img', {name:'Plan view: click to position probe',exact:true});
  async function probePosition(x,y) {
    await plan.scrollIntoViewIfNeeded();
    return plan.evaluate((svg,{x,y}) => {
      const p=svg.createSVGPoint();p.x=x*2;p.y=160-y*2;
      const q=p.matrixTransform(svg.getScreenCTM());return {x:q.x,y:q.y};
    },{x,y});
  }
  let probe = await probePosition(40,40);
  await page.mouse.click(probe.x,probe.y);
  assert.match(await page.getByTestId('sample-status').innerText(),/NO_DATA/);
  const outside = await probePosition(-5,40);
  await page.mouse.move(probe.x,probe.y);await page.mouse.down();
  await page.mouse.move(outside.x,outside.y,{steps:5});await page.mouse.up();
  assert.match(await page.getByTestId('sample-status').innerText(),/OUTSIDE_DOMAIN/);
  await page.getByLabel('Missing center vertex').uncheck();
  probe = await probePosition(35,35);await page.mouse.click(probe.x,probe.y);
  assert.match(await page.getByTestId('sample-status').innerText(),/VALID/);
  console.log('Terrain: mesh, interpolation differences, diagonals, missing samples, outside domain, normals, and pointer controls passed.');
  await page.setViewportSize({width:390,height:400});
  assert.equal(await page.locator('.terrain-groups header button[aria-expanded="true"]').count(), 1);
  await openGroup('Mesh generation');
  assert.equal(await page.getByLabel('Probe X', {exact:true}).count(), 0);
  await openGroup('Sampling & analysis');
  assert.equal(await page.locator('.terrain-sampling').evaluate(element=>element.clientHeight),400);
  async function checkWorkspaceBounds() {
    const sizes=await page.evaluate(()=>{
      const app=document.querySelector('.terrain-sampling'), groups=document.querySelector('.terrain-groups');
      const active=groups.querySelector('.terrain-group-expanded');
      const collapsed=[...groups.querySelectorAll('.example-panel:not(.terrain-group-expanded)')];
      const r=app.getBoundingClientRect(),g=groups.getBoundingClientRect(),a=active.getBoundingClientRect();
      return {height:r.height,viewport:innerHeight,active:a.height,available:g.height-collapsed.reduce((n,p)=>n+p.getBoundingClientRect().height,0)-parseFloat(getComputedStyle(groups).gap)*collapsed.length,
        headers:[...groups.querySelectorAll('header')].map(h=>{const r=h.getBoundingClientRect();return {top:r.top,bottom:r.bottom};}),
        shell:active.querySelector('.deck-widget-box > section').getBoundingClientRect().height};
    });
    assert(sizes.height<=sizes.viewport,JSON.stringify(sizes));
    assert(Math.abs(sizes.active-sizes.available)<2,JSON.stringify(sizes));
    assert(Math.abs(sizes.shell-sizes.active)<2,JSON.stringify(sizes));
    assert(sizes.headers.every(r=>r.top>=0&&r.bottom<=sizes.viewport),JSON.stringify(sizes));
  }
  await checkWorkspaceBounds();
  await page.setViewportSize({width:1200,height:950});
  await checkWorkspaceBounds();
  await page.locator('#root').evaluate(root=>root.style.height='600px');
  assert.equal(await page.locator('.terrain-sampling').evaluate(app=>app.clientHeight),600);
  await checkWorkspaceBounds();
  await page.locator('#root').evaluate(root=>root.style.height='100vh');
  assert.equal(await page.locator('.terrain-sampling').evaluate(app=>app.clientHeight),950);
  const outsideLayout=await page.evaluate(()=>{const sibling=document.createElement('div');sibling.style.height='500px';document.body.append(sibling);const height=parseFloat(getComputedStyle(document.body).height);sibling.remove();return {height,expected:innerHeight+500};});
  assert(outsideLayout.height>=outsideLayout.expected,'Example CSS must not constrain the surrounding page body');
  await page.getByLabel('Interpolation').selectOption('triangle');
  await page.getByRole('button', {name: 'Sampling & analysis', exact:true}).click();
  assert.equal(await page.locator('.terrain-groups header button[aria-expanded="true"]').count(), 1);
  assert.equal(await page.getByLabel('Interpolation').inputValue(), 'triangle');
  assert.equal(await page.getByTestId('sample-status').count(), 1);
  assert((await page.locator('.terrain-stage svg').count()) > 0);
  assert.deepEqual(errors,[]);
  if(process.env.SCREENSHOT_PATH) await page.screenshot({path:process.env.SCREENSHOT_PATH});
} finally {await browser.close();await server.close();}
