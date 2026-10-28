// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {Deck,OrthographicView,COORDINATE_SYSTEM} from '@deck.gl/core';
import {PathLayer} from '@deck.gl/layers';
import {SimpleMeshLayer} from '@deck.gl/mesh-layers';
import {runTask,WorkerPool} from '@math.gl/core/tasks';
import {prepareJob} from './job.mjs';
import {engines,capability} from './backends.mjs';
import {mountInfoBox} from '../../../common/info-box.js';
import {acquireWasm} from './wasm-runtime.mjs';
import './style.css';
export function mountProjectionLab(root,{wasmAssetBase=new URL('./',document.baseURI).href}={}) {
root.classList.add('raster-projection-lab');
root.innerHTML=`<section class="maps"><article><h2>Target grid → inverse UVs</h2><p>Threshold in source texels.</p><div class="map" data-map="inverse"></div><output data-stats="inverse"></output></article><article><h2>Source grid → projected positions</h2><p>Threshold at the declared display scale.</p><div class="map" data-map="forward"></div><output data-stats="forward"></output></article></section>
<aside class="lab-info"><p>Compare raster preparation through explicit charts and optional projection engines.</p>
<label>Source grid<select data-source><option value="antarctica">Antarctica · EPSG:3031</option><option value="rotated-polar">Rotated Antarctic grid</option><option value="fiji">Fiji · rotated longitude grid</option><option value="utm60">UTM 60 · antimeridian</option><option value="world">Full-world image</option></select></label>
<label>Target map<select data-target><option value="orthographic">Orthographic hemisphere</option><option value="world">World · equirectangular</option><option value="perspective">Tilted perspective</option><option value="interrupted">Interrupted sinusoidal</option></select></label>
<label>Engine<select data-engine>${Object.entries(engines).map(([id,label])=>`<option value="${id}">${label}</option>`).join('')}</select></label>
<label>Error threshold<select data-tolerance><option value="2">2 pixels</option><option value="1">1 pixel</option><option value=".5">0.5 pixels</option><option value="4">4 pixels</option></select></label>
<label>Center longitude <input data-lon type="range" min="-180" max="180" value="0" step="5"></label><label>Center latitude <input data-lat type="range" min="-90" max="-50" value="-90" step="5"></label><label><input data-wire type="checkbox"> Mesh edges</label>
<button data-benchmark>Measure moving center</button><button data-export disabled>Export measurements</button>
<p data-note></p><pre data-measurements hidden></pre><small>Checkerboard fixtures use actual source CRSs. Domains and error criteria are sampled. No COG loading or tile selection.</small></aside>
<p class="lab-status" role="status" data-status>Preparing chart geometry…</p>`;
const disposeInfo=mountInfoBox(root.querySelector('aside'),{title:'Antarctica & Fiji',theme:'sleek-dark',width:280});
const $=selector=>root.querySelector(selector),source=$('[data-source]'),target=$('[data-target]'),engine=$('[data-engine]'),tolerance=$('[data-tolerance]'),lon=$('[data-lon]'),lat=$('[data-lat]'),wire=$('[data-wire]'),status=$('[data-status]');
const texture=document.createElement('canvas');texture.width=texture.height=256;const ctx=texture.getContext('2d');
for(let y=0;y<8;y++)for(let x=0;x<8;x++){ctx.fillStyle=(x+y)%2?'#215f83':'#60aaa7';ctx.fillRect(x*32,y*32,32,32);ctx.fillStyle='#eaf8ff';ctx.font='10px monospace';ctx.fillText(`${x},${y}`,x*32+5,y*32+19);}
ctx.strokeStyle='#ffd48b';ctx.lineWidth=2;ctx.beginPath();ctx.arc(128,128,9,0,Math.PI*2);ctx.stroke();
const decks={},results={};let generation=0,active,disposed=false,wasmPromise,wasmHandle,benchmarking=false,measurementRows=null;
const pending=new Set();
const loadWorker=()=>new Worker(new URL('./worker.mjs',import.meta.url),{type:'module'});
const pool=new WorkerPool({name:'raster-projection-lab',loadWorker,maxConcurrency:2,maxQueuedJobs:2});
const task={id:'raster-lab',name:'Raster lab',module:'example',version:'1',options:{},loadWorker};
for(const mode of ['inverse','forward'])decks[mode]=new Deck({parent:$(`[data-map="${mode}"]`),views:new OrthographicView({flipY:false}),
  initialViewState:{target:[0,0,0],zoom:0},controller:true,
  getTooltip:({object})=>object?`Source row ${object.row}; chart ${object.chart}`:null});
function render(mode,result) {
  const extent=[Infinity,Infinity,-Infinity,-Infinity];
  for(const mesh of result.meshes)for(let i=0;i<mesh.positions.length;i+=2){extent[0]=Math.min(extent[0],mesh.positions[i]);extent[1]=Math.min(extent[1],mesh.positions[i+1]);extent[2]=Math.max(extent[2],mesh.positions[i]);extent[3]=Math.max(extent[3],mesh.positions[i+1]);}
  for(const {ring} of result.domains)for(const [x,y] of ring){extent[0]=Math.min(extent[0],x);extent[1]=Math.min(extent[1],y);extent[2]=Math.max(extent[2],x);extent[3]=Math.max(extent[3],y);}
  const map=$(`[data-map="${mode}"]`),scale=Math.min((map.clientWidth-32)/Math.max(1e-8,extent[2]-extent[0]),(map.clientHeight-32)/Math.max(1e-8,extent[3]-extent[1]));
  const layers=result.meshes.map((m,i)=>new SimpleMeshLayer({id:`${mode}-raster-${i}`,data:[{row:m.sourceRows[0],chart:m.chart}],
    mesh:{attributes:{positions:{value:Float32Array.from({length:m.positions.length/2*3},(_,j)=>j%3===2?0:m.positions[Math.floor(j/3)*2+j%3]),size:3},texCoords:{value:new Float32Array(m.uv),size:2}},indices:{value:m.indices,size:1}},
    texture,material:false,getPosition:[0,0,0],getColor:[255,255,255],coordinateSystem:COORDINATE_SYSTEM.CARTESIAN,pickable:true,parameters:{depthCompare:'always'}}));
  layers.push(new PathLayer({id:`${mode}-charts`,data:result.domains,getPath:d=>d.ring,coordinateSystem:COORDINATE_SYSTEM.CARTESIAN,getColor:[240,244,250],getWidth:1.4,widthUnits:'pixels',parameters:{depthCompare:'always'}}));
  if(wire.checked) {
    const edges=[];for(const m of result.meshes)for(let i=0;i<m.indices.length;i+=3){const p=Array.from(m.indices.slice(i,i+3),j=>Array.from(m.positions.slice(j*2,j*2+2)));edges.push([...p,p[0]]);}
    layers.push(new PathLayer({id:`${mode}-mesh`,data:edges,getPath:d=>d,coordinateSystem:COORDINATE_SYSTEM.CARTESIAN,getColor:[255,209,137,110],getWidth:.6,widthUnits:'pixels',parameters:{depthCompare:'always'}}));
  }
  const view=Number.isFinite(scale)?{target:[(extent[0]+extent[2])/2,(extent[1]+extent[3])/2,0],zoom:Math.log2(scale)}:{target:[0,0,0],zoom:0};
  decks[mode].setProps({initialViewState:view,layers});
  const d=result.diagnostics;$(`[data-stats="${mode}"]`).textContent=`${d.triangles.toLocaleString()} triangles · ${d.milliseconds.toFixed(1)} ms preparation · ${(d.bytes/1024).toFixed(0)} KiB buffers · 0 omitted`;
}
function spec() {return {source:source.value,target:target.value,engine:engine.value,tolerance:Number(tolerance.value),center:[Number(lon.value),Number(lat.value)],pixelsPerUnit:target.value==='world'?1.2:180};}
async function getWasm(){wasmPromise??=acquireWasm(wasmAssetBase).then(handle=>{wasmHandle=handle;return handle.proj;});return wasmPromise;}
async function update() {
  const current=++generation;active?.abort(new Error('Superseded'));active=new AbortController();const signal=active.signal,s=spec();
  delete root.dataset.ready;delete root.dataset.error;
  status.textContent='Preparing continuous charts…';
  $('[data-note]').textContent=s.engine==='native'?'Native math.gl owns conversion and chart preparation.':s.engine==='d3'?'D3 supplies spherical target conversion; native math.gl supplies the ellipsoidal source conversion and declared charts.':`${engines[s.engine]} converts geographic samples to the source CRS; native math.gl owns target inverse branches and chart geometry.`;
  const jobs=['inverse','forward'].map(async mode=>{
    const reason=capability(s.engine,s.source,s.target,mode),output=$(`[data-stats="${mode}"]`);
    if(reason){delete results[mode];decks[mode].setProps({layers:[]});output.textContent=reason;return;}
    try {
      output.textContent='Preparing…';
      const result=s.engine==='wasm' ? await prepareJob({...s,mode},{signal,proj:await getWasm()})
        : await runTask(task,{...s,mode},{execution:'worker',workerPool:pool,signal});
      if(current!==generation||disposed)return;
      results[mode]=result;render(mode,result);
    }catch(error){if(current!==generation||disposed)return;delete results[mode];decks[mode].setProps({layers:[]});output.textContent=`Cannot prepare: ${error.message}`;if(mode==='inverse')root.dataset.error=error.message;}
  });
  await Promise.all(jobs);
  if(current!==generation||disposed)return;
  root.dataset.ready=JSON.stringify(s);status.textContent=root.dataset.error?'Preparation failed explicitly; no partial mesh was published.':'Ready. Pan and zoom inspect the prepared meshes; changing projection parameters rebuilds them. Forward error uses the declared 180 px/unit (world: 1.2 px/degree) scale, not a guarantee after zoom.';
}
function track(p){pending.add(p);void p.then(()=>pending.delete(p),()=>pending.delete(p));}
function schedule(){if(!disposed)track(update());}
function constrain() {
  const polar=['antarctica','rotated-polar'].includes(source.value);
  for(const option of target.options)option.disabled=!polar&&option.value!=='world';
  if(!polar)target.value='world';
  lon.disabled=lat.disabled=!['orthographic','perspective'].includes(target.value);
  schedule();
}
for(const el of [source,target,engine,tolerance,lon,lat])el.addEventListener('change',constrain);
wire.addEventListener('change',()=>{for(const mode of Object.keys(results))render(mode,results[mode]);});
async function benchmark(){
  if(benchmarking||disposed)return;benchmarking=true;const button=$('[data-benchmark]');button.disabled=true;
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
  finally{benchmarking=false;if(!disposed)button.disabled=false;}
}
$('[data-benchmark]').addEventListener('click',()=>track(benchmark()));
$('[data-export]').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(measurementRows,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='projection-lab-measurements.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),0);});
async function dispose(){if(disposed)return;disposed=true;generation++;active?.abort();disposeInfo();for(const deck of Object.values(decks))deck.finalize();root.replaceChildren();await Promise.allSettled([...pending]);try{await pool.destroy();}finally{await wasmHandle?.release();}}
constrain();
return {dispose,update:()=>{schedule();},get results(){return results;}};
}
