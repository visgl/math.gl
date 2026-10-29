// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {Deck,OrthographicView,COORDINATE_SYSTEM} from '@deck.gl/core';
import {PathLayer} from '@deck.gl/layers';
import {SimpleMeshLayer} from '@deck.gl/mesh-layers';
import {runTask,WorkerPool} from '@math.gl/core/tasks';
import {prepareJob} from './job.mjs';
import {createCharts} from '../warp/fixtures.mjs';
import {createPersistentGrid,updatePersistentUV} from './persistent-grid.mjs';
import {updateOrRebuild} from './reuse-policy.mjs';
import {PersistentUVLayer,ReplacementMeshLayer} from './persistent-layer.mjs';
import {engines,capability,createBackend} from './backends.mjs';
import {mountInfoBox} from '../../../common/info-box.js';
import {acquireWasm} from './wasm-runtime.mjs';
import './style.css';
import earthImageUrl from '../../../earth/sun-terminator/assets/day.jpg';
import {nativePolarImage} from './native-polar.mjs';
import {resampleImagery} from './imagery.mjs';
export function mountProjectionLab(root,{wasmAssetBase=new URL('./',document.baseURI).href}={}) {
root.classList.add('raster-projection-lab');
root.innerHTML=`<section class="maps"><article><h2>Target grid → inverse UVs</h2><p>Threshold in source texels.</p><div class="map" data-map="inverse"></div><output data-stats="inverse"></output></article><article><h2>Source grid → projected positions</h2><p>Threshold at the declared display scale.</p><div class="map" data-map="forward"></div><output data-stats="forward"></output></article></section>
<aside class="lab-info"><p>Compare raster preparation through explicit charts and optional projection engines.</p>
<label>Source grid<select data-source><option value="antarctica">Antarctica · EPSG:3031</option><option value="rotated-polar">Rotated Antarctic grid</option><option value="fiji">Fiji · rotated longitude grid</option><option value="utm60">UTM 60 · antimeridian</option><option value="world">Full-world image</option></select></label>
<label>Target map<select data-target><option value="orthographic">Orthographic hemisphere</option><option value="world">World · equirectangular</option><option value="perspective">Tilted perspective</option><option value="interrupted">Interrupted sinusoidal</option></select></label>
<label>Engine<select data-engine>${Object.entries(engines).map(([id,label])=>`<option value="${id}">${label}</option>`).join('')}</select></label>
<label>Error threshold<select data-tolerance><option value="2">2 pixels</option><option value="1">1 pixel</option><option value=".5">0.5 pixels</option><option value="4">4 pixels</option></select></label>
<label>Center longitude <input data-lon type="range" min="-180" max="180" value="0" step="5"></label><label>Center latitude <input data-lat type="range" min="-90" max="-50" value="-90" step="5"></label><label><input data-imagery type="checkbox" checked> Earth imagery</label><label><input data-wire type="checkbox"> Mesh edges</label>
<label><input data-native-polar type="checkbox"> Native polar diagnostic (synthetic, with nodata)</label>
<button data-display>Compare display error</button><button data-limits>Exercise reuse limits</button><button data-reuse>Compare UV-only updates</button><button data-benchmark>Measure moving center</button><button data-export disabled>Export measurements</button>
<p data-note></p><pre data-measurements hidden></pre><small><span data-imagery-note>NASA Blue Marble overview imagery, resampled into the source grid. Uncheck Earth imagery for the diagnostic checkerboard.</span> <a href="https://science.nasa.gov/earth/earth-observatory/blue-marble/" target="_blank" rel="noreferrer">NASA / GIBS credit</a>. Domains and error criteria are sampled. No COG loading or tile selection.</small></aside>
<p class="lab-status" role="status" data-status>Preparing chart geometry…</p>`;
const disposeInfo=mountInfoBox(root.querySelector('aside'),{title:'Antarctica & Fiji',theme:'sleek-dark',width:280});
const $=selector=>root.querySelector(selector),source=$('[data-source]'),target=$('[data-target]'),engine=$('[data-engine]'),tolerance=$('[data-tolerance]'),lon=$('[data-lon]'),lat=$('[data-lat]'),wire=$('[data-wire]'),imagery=$('[data-imagery]'),status=$('[data-status]');
const texture=document.createElement('canvas');texture.width=texture.height=256;const ctx=texture.getContext('2d');
for(let y=0;y<8;y++)for(let x=0;x<8;x++){ctx.fillStyle=(x+y)%2?'#215f83':'#60aaa7';ctx.fillRect(x*32,y*32,32,32);ctx.fillStyle='#eaf8ff';ctx.font='10px monospace';ctx.fillText(`${x},${y}`,x*32+5,y*32+19);}
ctx.strokeStyle='#ffd48b';ctx.lineWidth=2;ctx.beginPath();ctx.arc(128,128,9,0,Math.PI*2);ctx.stroke();
const decks={},results={};let generation=0,active,disposed=false,wasmPromise,wasmHandle,benchmarking=false,reuseMode=false,displayComparing=false,measurementRows=null;
const nativePolar=$('[data-native-polar]'),nativeCanvas=document.createElement('canvas'),nativeImage=nativePolarImage();
nativeCanvas.width=nativeImage.width;nativeCanvas.height=nativeImage.height;nativeCanvas.getContext('2d').putImageData(new ImageData(nativeImage.data,nativeImage.width,nativeImage.height),0,0);
const chooseTexture=(name,earth)=>nativePolar.checked&&name==='antarctica'?nativeCanvas:imagery.checked&&earth?earth:texture;
const pending=new Set(),imageCache=new Map();let imagePromise;
async function getEarthTexture(name,signal) {
  if(imageCache.has(name))return imageCache.get(name);
  imagePromise??=new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;const context=canvas.getContext('2d');context.drawImage(image,0,0);resolve(context.getImageData(0,0,canvas.width,canvas.height));};image.onerror=()=>reject(new Error('Bundled Earth imagery could not load'));image.src=earthImageUrl;});
  const raster=await resampleImagery(await imagePromise,name,{signal,yieldFrame:()=>new Promise(resolve=>setTimeout(resolve,0))});
  const canvas=document.createElement('canvas');canvas.width=raster.width;canvas.height=raster.height;canvas.getContext('2d').putImageData(new ImageData(raster.data,raster.width,raster.height),0,0);
  imageCache.set(name,canvas);return canvas;
}
const loadWorker=()=>new Worker(new URL('./worker.mjs',import.meta.url),{type:'module'});
const pool=new WorkerPool({name:'raster-projection-lab',loadWorker,maxConcurrency:2,maxQueuedJobs:2});
const task={id:'raster-lab',name:'Raster lab',module:'example',version:'1',options:{},loadWorker};
for(const mode of ['inverse','forward'])decks[mode]=new Deck({parent:$(`[data-map="${mode}"]`),views:new OrthographicView({flipY:false}),
  initialViewState:{target:[0,0,0],zoom:0},controller:true,
  getTooltip:({object})=>object?`Source row ${object.row}; chart ${object.chart}`:null});
function render(mode,result) {
  // Place the two already-cut Pacific charts next to each other for inspection.
  // Only display coordinates change; preparation buffers and UVs stay untouched.
  const pacific=['fiji','utm60'].includes(result.sourceName);
  const offset=chart=>pacific&&result.domains.some(d=>d.chart===chart&&d.ring.every(p=>p[0]<=0))?360:0;
  const meshes=result.meshes.map(m=>({...m,positions:m.positions.map((v,i)=>v+(i%2===0?offset(m.chart):0))}));
  const domains=result.domains.map(d=>({...d,ring:d.ring.map(([x,y])=>[x+offset(d.chart),y])}));
  const extent=[Infinity,Infinity,-Infinity,-Infinity];
  for(const mesh of meshes)for(let i=0;i<mesh.positions.length;i+=2){extent[0]=Math.min(extent[0],mesh.positions[i]);extent[1]=Math.min(extent[1],mesh.positions[i+1]);extent[2]=Math.max(extent[2],mesh.positions[i]);extent[3]=Math.max(extent[3],mesh.positions[i+1]);}
  for(const {ring} of domains)for(const [x,y] of ring){extent[0]=Math.min(extent[0],x);extent[1]=Math.min(extent[1],y);extent[2]=Math.max(extent[2],x);extent[3]=Math.max(extent[3],y);}
  const map=$(`[data-map="${mode}"]`),scale=Math.min((map.clientWidth-32)/Math.max(1e-8,extent[2]-extent[0]),(map.clientHeight-32)/Math.max(1e-8,extent[3]-extent[1]));
  const layers=meshes.map((m,i)=>new SimpleMeshLayer({id:`${mode}-raster-${i}`,data:[{row:m.sourceRows[0],chart:m.chart}],
    mesh:{attributes:{positions:{value:Float32Array.from({length:m.positions.length/2*3},(_,j)=>j%3===2?0:m.positions[Math.floor(j/3)*2+j%3]),size:3},texCoords:{value:new Float32Array(m.uv),size:2}},indices:{value:m.indices,size:1}},
    texture:chooseTexture(result.sourceName,result.earthTexture),material:false,getPosition:[0,0,0],getColor:[255,255,255],coordinateSystem:COORDINATE_SYSTEM.CARTESIAN,pickable:true,parameters:{depthCompare:'always'}}));
  layers.push(new PathLayer({id:`${mode}-charts`,data:domains,getPath:d=>d.ring,coordinateSystem:COORDINATE_SYSTEM.CARTESIAN,getColor:[240,244,250],getWidth:1.4,widthUnits:'pixels',parameters:{depthCompare:'always'}}));
  if(wire.checked) {
    const edges=[];for(const m of meshes)for(let i=0;i<m.indices.length;i+=3){const p=Array.from(m.indices.slice(i,i+3),j=>Array.from(m.positions.slice(j*2,j*2+2)));edges.push([...p,p[0]]);}
    layers.push(new PathLayer({id:`${mode}-mesh`,data:edges,getPath:d=>d,coordinateSystem:COORDINATE_SYSTEM.CARTESIAN,getColor:[255,209,137,110],getWidth:.6,widthUnits:'pixels',parameters:{depthCompare:'always'}}));
  }
  const view=Number.isFinite(scale)?{target:[(extent[0]+extent[2])/2,(extent[1]+extent[3])/2,0],zoom:Math.log2(scale)}:{target:[0,0,0],zoom:0};
  decks[mode].setProps({initialViewState:view,layers});
  const d=result.diagnostics;$(`[data-stats="${mode}"]`).textContent=`${d.triangles.toLocaleString()} triangles · ${d.milliseconds.toFixed(1)} ms preparation · ${(d.bytes/1024).toFixed(0)} KiB buffers · 0 omitted`;
}
function spec() {return {source:source.value,target:target.value,engine:engine.value,tolerance:Number(tolerance.value),center:[Number(lon.value),Number(lat.value)],pixelsPerUnit:target.value==='world'?1.2:180};}
async function getWasm(){wasmPromise??=acquireWasm(wasmAssetBase).then(handle=>{wasmHandle=handle;return handle.proj;});return wasmPromise;}
async function update() {
  reuseMode=false;
  const subtitles=root.querySelectorAll('.maps article > p');subtitles[0].textContent='Threshold in source texels.';subtitles[1].textContent='Threshold at the declared display scale.';
  const titles=root.querySelectorAll('.maps h2');titles[0].textContent='Target grid → inverse UVs';titles[1].textContent='Source grid → projected positions';
  const current=++generation;active?.abort(new Error('Superseded'));active=new AbortController();const signal=active.signal,s=spec();
  delete root.dataset.ready;delete root.dataset.error;
  status.textContent='Preparing continuous charts…';
  $('[data-note]').textContent=s.engine==='native'?'Native math.gl owns conversion and chart preparation.':s.engine==='d3'?'D3 supplies spherical target conversion; native math.gl supplies the ellipsoidal source conversion and declared charts.':`${engines[s.engine]} converts geographic samples to the source CRS; native math.gl owns target inverse branches and chart geometry.`;
  let earthTexture;
  try{earthTexture=await getEarthTexture(s.source,signal);}catch(error){if(current!==generation||disposed)return;$('[data-imagery-note]').textContent=`Earth imagery unavailable: ${error.message}. Showing diagnostic checkerboard.`;}
  if(current!==generation||disposed)return;
  const jobs=['inverse','forward'].map(async mode=>{
    const reason=capability(s.engine,s.source,s.target,mode),output=$(`[data-stats="${mode}"]`);
    if(reason){delete results[mode];decks[mode].setProps({layers:[]});output.textContent=reason;return;}
    try {
      output.textContent='Preparing…';
      const result=s.engine==='wasm' ? await prepareJob({...s,mode},{signal,proj:await getWasm()})
        : await runTask(task,{...s,mode},{execution:'worker',workerPool:pool,signal});
      if(current!==generation||disposed)return;
      result.sourceName=s.source;result.earthTexture=earthTexture;results[mode]=result;render(mode,result);
    }catch(error){if(current!==generation||disposed)return;delete results[mode];decks[mode].setProps({layers:[]});output.textContent=`Cannot prepare: ${error.message}`;if(mode==='inverse')root.dataset.error=error.message;}
  });
  await Promise.all(jobs);
  if(current!==generation||disposed)return;
  root.dataset.ready=JSON.stringify(s);status.textContent=root.dataset.error?'Preparation failed explicitly; no partial mesh was published.':'Ready. Pan and zoom inspect the prepared meshes; changing projection parameters rebuilds them. Forward error uses the declared 180 px/unit (world: 1.2 px/degree) scale, not a guarantee after zoom.';
}
function track(p){pending.add(p);void p.then(()=>pending.delete(p),()=>pending.delete(p));}
function schedule(){if(!disposed)track(update());}
function constrain() {
  nativePolar.disabled=source.value!=='antarctica';if(nativePolar.disabled)nativePolar.checked=false;
  const polar=['antarctica','rotated-polar'].includes(source.value);
  for(const option of target.options)option.disabled=!polar&&option.value!=='world';
  if(!polar)target.value='world';
  lon.disabled=lat.disabled=!['orthographic','perspective'].includes(target.value);
  schedule();
}
for(const el of [source,target,engine,tolerance,lon,lat])el.addEventListener('change',constrain);
for(const control of [wire,imagery,nativePolar])control.addEventListener('change',()=>{if(displayComparing)return;if(reuseMode){active?.abort();schedule();return;}for(const mode of Object.keys(results))render(mode,results[mode]);});
async function benchmark(){
  if(benchmarking||disposed)return;benchmarking=true;$('[data-export]').disabled=true;const button=$('[data-benchmark]');button.disabled=true;
  const controller=new AbortController();active?.abort();const current=++generation;active=controller;
  try {
    const s={...spec(),target:'orthographic',source:'antarctica',mode:'inverse'},rows=[];
    for(const longitude of [-30,-15,0,15,30]) {
      const job={...s,center:[longitude,-75]},begin=performance.now();
      const result=s.engine==='wasm'?await prepareJob(job,{proj:await getWasm(),signal:controller.signal}):await runTask(task,job,{execution:'worker',workerPool:pool,signal:controller.signal});
      if(disposed||current!==generation)return;
      rows.push({center:job.center,endToEndMs:performance.now()-begin,...result.diagnostics});
    }
    measurementRows={schemaVersion:1,engine:s.engine,tolerance:s.tolerance,source:s.source,target:s.target,policy:'five sequential orthographic centers; cold/warm work included; no FPS claim',rows};const text=$('[data-measurements]');text.hidden=false;text.textContent=JSON.stringify(measurementRows,null,2);$('[data-export]').disabled=false;
    status.textContent='Moving-center measurements complete. These include worker transport and rebuilding; they are not a frame-rate guarantee.';
  }catch(error){if(!disposed&&!controller.signal.aborted)status.textContent=error.message;}
  finally{benchmarking=false;if(!disposed){button.disabled=false;$('[data-export]').disabled=!measurementRows;}}
}
async function compareReuse() {
  if(benchmarking||disposed)return;
  if(source.value!=='antarctica'||target.value!=='orthographic'){status.textContent='UV reuse demo requires Antarctica and Orthographic; other domains require rebuilding.';return;}
  benchmarking=true;reuseMode=true;$('[data-export]').disabled=true;const titles=root.querySelectorAll('.maps h2');titles[0].textContent='Persistent target grid → UV updates';titles[1].textContent='Same target grid → full replacement';for(const p of root.querySelectorAll('.maps article > p'))p.textContent='Same target patch and source-texel error policy.';const button=$('[data-reuse]');button.disabled=true;active?.abort();const controller=new AbortController(),current=++generation;active=controller;
  delete root.dataset.reuse;
  const grid=createPersistentGrid(),positions=Float32Array.from({length:grid.positions.length/2*3},(_,j)=>j%3===2?0:grid.positions[Math.floor(j/3)*2+j%3]);
  const mesh={attributes:{positions:{value:positions,size:3},texCoords:{value:new Float32Array(grid.positions.length),size:2}},indices:{value:grid.indices,size:1}};
  const models=new Set(),uvBuffers=new Set(),replacementModels=new Set(),uploads=[],replacements=[],rows=[],fixedData=[{}],zero=[0,0,0],white=[255,255,255];
  const selectedEngine=engine.value;
  try {
    const earthTexture=await getEarthTexture('antarctica',controller.signal);
    for(let frame=0;frame<12;frame++) {
      const center=[-30+frame*5,-85],operationStart=performance.now(),chart=createCharts('antarctica','orthographic',{center})[0];
      const backend=await createBackend(selectedEngine,chart,'orthographic',center,selectedEngine==='wasm'?await getWasm():undefined);
      const operationPrepareMs=performance.now()-operationStart;
      let reused,replacement,replacementGrid,rebuildMs;
      try {
        reused=await updatePersistentUV(grid,backend.evaluate,{center,signal:controller.signal,tolerance:Number(tolerance.value)});
        const begin=performance.now();replacementGrid=createPersistentGrid();replacement=await updatePersistentUV(replacementGrid,backend.evaluate,{center,signal:controller.signal,tolerance:Number(tolerance.value)});rebuildMs=performance.now()-begin;
      } finally{await backend.dispose();}
      if(disposed||current!==generation)return;
      const fullMesh={attributes:{positions:{value:new Float32Array(positions),size:3},texCoords:{value:replacement.uv,size:2}},indices:{value:replacementGrid.indices,size:1}};
      const common={data:fixedData,texture:chooseTexture('antarctica',earthTexture),material:false,getPosition:zero,getColor:white,coordinateSystem:COORDINATE_SYSTEM.CARTESIAN};
      decks.inverse.setProps({initialViewState:{target:[0,0,0],zoom:Math.log2(Math.max(1,Math.min($('[data-map="inverse"]').clientWidth,$('[data-map="inverse"]').clientHeight)-40)/.5)},layers:[new PersistentUVLayer({...common,id:'persistent-raster',mesh,uvValues:reused.uv,onUVUpload:info=>{models.add(info.model);uvBuffers.add(info.buffer);uploads.push({bytes:info.bytes,submitMs:info.submitMs});}})]});
      decks.forward.setProps({initialViewState:{target:[0,0,0],zoom:Math.log2(Math.max(1,Math.min($('[data-map="forward"]').clientWidth,$('[data-map="forward"]').clientHeight)-40)/.5)},layers:[new ReplacementMeshLayer({...common,id:'replacement-raster',mesh:fullMesh,onMeshUpload:info=>{replacementModels.add(info.model);replacements.push({bytes:info.bytes,submitMs:info.submitMs});}})]});
      await new Promise(resolve=>{
        let frame;const done=()=>{clearTimeout(timer);cancelAnimationFrame(frame);controller.signal.removeEventListener('abort',done);resolve();};
        const timer=setTimeout(done,100);controller.signal.addEventListener('abort',done,{once:true});
        frame=requestAnimationFrame(()=>{frame=requestAnimationFrame(done);});
      });
      if(disposed||current!==generation)return;
      rows.push({center,operationPrepareMs,uvPreparationMs:reused.diagnostics.preparationMs,fullPreparationMs:rebuildMs,maximumTextureError:reused.diagnostics.maximumError});
      $('[data-stats="inverse"]').textContent=`Persistent target patch · UV update ${frame+1}/12 · fixed positions and indices`;
      $('[data-stats="forward"]').textContent=`Same target patch · full mesh replacement ${frame+1}/12 · same texture-error policy`;
    }
    measurementRows={schemaVersion:1,engine:selectedEngine,policy:'qualified interior orthographic patch; main-thread orchestration (backend may use workers); submission timings are not GPU completion or FPS',models:models.size,uvBuffers:uvBuffers.size,replacementModels:replacementModels.size,uploads,replacements,rows};
    root.dataset.reuse=JSON.stringify({models:models.size,uvBuffers:uvBuffers.size,replacementModels:replacementModels.size,updates:uploads.length});
    $('[data-measurements]').hidden=false;$('[data-measurements]').textContent=JSON.stringify(measurementRows,null,2);$('[data-export]').disabled=false;
    status.textContent='UV-only comparison complete: fixed interior patch, unchanged topology. Left reuses geometry; right replaces it. Change a selector to restore the full fixture.';
  } catch(error){
    if(!disposed&&!controller.signal.aborted&&current===generation){
      const restoredGeneration=generation+1;
      await update();
      if(!disposed&&generation===restoredGeneration)status.textContent=`UV comparison failed: ${error.message}. Returned to full-fixture mode.`;
    }
  }
  finally{benchmarking=false;if(!disposed){button.disabled=false;$('[data-export]').disabled=!measurementRows;}}
}

async function compareDisplay(){
  if(benchmarking||disposed)return;
  const s=spec();
  if(s.source!=='antarctica'||s.target!=='orthographic'||capability(s.engine,s.source,s.target,'forward')){status.textContent='Display comparison requires Antarctica, Orthographic and an engine with forward preparation.';return;}
  benchmarking=true;displayComparing=true;const button=$('[data-display]');button.disabled=true;$('[data-export]').disabled=true;
  active?.abort();const controller=new AbortController(),current=++generation;active=controller;
  try{
    const rows=[],qualified={};
    for(const pixelsPerUnit of [[180,90],[360,180]])for(const mode of ['inverse','forward']){
      const displayPolicy={pixelsPerUnit,displayTolerance:Number(tolerance.value),textureTolerance:2};
      const result=await runTask(task,{...s,mode,displayPolicy},{execution:'worker',workerPool:pool,signal:controller.signal});
      if(disposed||current!==generation)return;
      rows.push({mode,...result.diagnostics,charts:result.meshes.map(m=>m.diagnostics.qualification)});qualified[mode]=result;
    }
    let earthTexture;
    try{earthTexture=await getEarthTexture(s.source,controller.signal);}
    catch(error){if(disposed||current!==generation||controller.signal.aborted)return;$('[data-imagery-note]').textContent=`Earth imagery unavailable: ${error.message}. Showing diagnostic checkerboard.`;}
    if(disposed||current!==generation)return;
    reuseMode=false;
    const titles=root.querySelectorAll('.maps h2');titles[0].textContent='Target grid → qualified inverse UVs';titles[1].textContent='Source grid → qualified positions';
    for(const p of root.querySelectorAll('.maps article > p'))p.textContent='Same recorded display-pixel and source-texel gates.';
    for(const mode of ['inverse','forward']){qualified[mode].sourceName=s.source;qualified[mode].earthTexture=earthTexture;results[mode]=qualified[mode];render(mode,qualified[mode]);}
    measurementRows={schemaVersion:1,engine:s.engine,policy:'shared independent affine display-pixel and source-texel probes; native chart reference; two anisotropic zoom scales; finite sampling, not a continuous error certificate',rows};
    $('[data-measurements]').hidden=false;$('[data-measurements]').textContent=JSON.stringify(measurementRows,null,2);
    status.textContent='Display comparison complete. Both strategies passed the same display-pixel and texture-error gates at both declared scales. Pan/zoom does not change these recorded scales.';
  }catch(error){if(!disposed&&current===generation&&!controller.signal.aborted)status.textContent=error.message;}
  finally{benchmarking=false;displayComparing=false;if(!disposed){button.disabled=false;$('[data-export]').disabled=!measurementRows;}}
}
$('[data-display]').addEventListener('click',()=>track(compareDisplay()));
async function exerciseReuseLimits(){
  if(benchmarking||disposed)return;
  if(source.value!=='antarctica'||target.value!=='orthographic'){status.textContent='Reuse-limit demonstration requires Antarctica and Orthographic.';return;}
  benchmarking=true;const button=$('[data-limits]');button.disabled=true;$('[data-export]').disabled=true;
  active?.abort();const controller=new AbortController(),current=++generation;active=controller;
  const selectedEngine=engine.value,grid=createPersistentGrid(),rows=[];delete root.dataset.limits;
  try{
    let rebuilt;
    for(const center of [[0,-90],[15,-85],[30,-70]]){
      const chart=createCharts('antarctica','orthographic',{center})[0],proj=selectedEngine==='wasm'?await getWasm():undefined;
      const backend=await createBackend(selectedEngine,chart,'orthographic',center,proj);
      let outcome;
      try{outcome=await updateOrRebuild(grid,backend.evaluate,()=>prepareJob({source:'antarctica',target:'orthographic',center,engine:selectedEngine,mode:'inverse',tolerance:Number(tolerance.value)},{signal:controller.signal,proj}),{center,tolerance:Number(tolerance.value),signal:controller.signal});}
      finally{await backend.dispose();}
      if(disposed||current!==generation)return;
      rows.push({center,mode:outcome.mode,reason:outcome.reason??null});
      if(outcome.mode==='rebuild')rebuilt=outcome.result;
    }
    if(rebuilt){
      rebuilt.sourceName='antarctica';rebuilt.earthTexture=await getEarthTexture('antarctica',controller.signal);
      if(disposed||current!==generation)return;
      reuseMode=true;results.inverse=rebuilt;delete results.forward;render('inverse',rebuilt);decks.forward.setProps({layers:[]});
      root.querySelectorAll('.maps h2')[0].textContent='Full mesh after reuse limit';
      $('[data-stats="forward"]').textContent='Fixed patch retired: domain-policy limit. A full inverse mesh was rebuilt on the left.';
    }
    measurementRows={schemaVersion:1,engine:selectedEngine,policy:'explicit fixed-patch policy invalidation; full inverse rebuild on domain/coverage/texture limits; backend failures are not hidden',rows};
    root.dataset.limits=JSON.stringify(rows);$('[data-measurements]').hidden=false;$('[data-measurements]').textContent=JSON.stringify(measurementRows,null,2);
    status.textContent='Reuse-limit exercise complete. The last center left the qualified patch policy and rebuilt the full mesh. Change a selector to restore the comparison.';
  }catch(error){if(!disposed&&current===generation&&!controller.signal.aborted)status.textContent=error.message;}
  finally{benchmarking=false;if(!disposed){button.disabled=false;$('[data-export]').disabled=!measurementRows;}}
}
$('[data-limits]').addEventListener('click',()=>track(exerciseReuseLimits()));
$('[data-reuse]').addEventListener('click',()=>track(compareReuse()));
$('[data-benchmark]').addEventListener('click',()=>track(benchmark()));
$('[data-export]').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(measurementRows,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='projection-lab-measurements.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),0);});
async function dispose(){if(disposed)return;disposed=true;generation++;active?.abort();disposeInfo();for(const deck of Object.values(decks))deck.finalize();root.replaceChildren();await Promise.allSettled([...pending]);imageCache.clear();try{await pool.destroy();}finally{await wasmHandle?.release();}}
constrain();
return {dispose,update:()=>{schedule();},get results(){return results;}};
}
