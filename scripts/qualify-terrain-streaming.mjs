// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {performance} from 'node:perf_hooks';
import {HeightField,HeightFieldMinMax,createTerrainGradientGrid,createTerrainGradientPyramid,updateTerrainMixedVertexTileHalos,updateTerrainMeshRegions,updateTerrainPersistentBounds,updateTerrainPersistentGradients,getTerrainHierarchyNode} from '../modules/geospatial/dist/terrain/index.js';
const folder=new URL('../modules/geospatial/test/terrain/fixtures/',import.meta.url);
if(!process.argv.includes('--case')){
 const results=[];for(const name of ['sierra','pacific','sierra-nodata'])for(const method of ['horn','zevenbergen-thorne']){
  const run=spawnSync(process.execPath,[fileURLToPath(import.meta.url),'--case',name,method],{encoding:'utf8',maxBuffer:10_000_000});if(run.status!==0)throw new Error(run.stderr);results.push(JSON.parse(run.stdout));
 }
 console.log(JSON.stringify({runtime:process.version,platform:`${process.platform}/${process.arch}`,results,scope:'257x257 real regional inputs, 16 overlapping 65x65 sample patches. Deterministic arrival/eviction/edit stream; no renderer or GPU. Both derivative methods. Pipeline timing includes halo rebuilds, regular mesh-region updates, field copies and full derivative grids; full-rebuild oracles and retained-snapshot hashing run outside timing. Copied buffer bytes exclude JS directories, input copies and transient allocations. RSS is whole-process high-water memory; sampled heap/ArrayBuffer maxima are observations, not allocation traffic. Results are workload-specific.'},null,2));
}else{
 const [name,method]=process.argv.slice(-2),fixture=JSON.parse(readFileSync(new URL(`${name}-streaming.json`,folder),'utf8'));
 const raw=readFileSync(new URL(`${name.split('-')[0]}.tif`,folder));if(createHash('sha256').update(raw).digest('hex')!==fixture.sha256)throw new Error('Streaming source hash mismatch');
 const base=[];for(let row=0;row<4;row++)for(let column=0;column<4;column++){
  const x=column*64,y=row*64;
  base.push({column:x,row:y,spacing:1,field:{width:65,height:65,heights:Float64Array.from({length:65*65},(_,i)=>fixture.heights[(y+Math.floor(i/65))*fixture.width+x+i%65]??NaN),origin:[fixture.origin[0]+(x+0.5)*fixture.columnStep[0],fixture.origin[1]+(y+0.5)*fixture.rowStep[1]],columnStep:fixture.columnStep,rowStep:fixture.rowStep,registration:'vertex',heightReference:fixture.heightReference}});
 }
 const key=t=>`${t.column},${t.row}`;
 const fingerprint=states=>{
  const hash=createHash('sha256');
  const add=array=>hash.update(new Uint8Array(array.buffer,array.byteOffset,array.byteLength));
  for(const state of states.values()){
   for(const hierarchy of [state.bounds,state.gradients])for(const level of hierarchy.levels)for(const block of level.blocks){add(block.values);add(block.counts);}
   for(const region of state.mesh.regions){add(region.data.positions);add(region.data.indices);add(region.data.gridCoordinates);}
  }
  return hash.digest('hex');
 };

 let resident=[],halos=null,states=new Map(),copiedBytes=0,flatCopiedBytes=0,updates=0,verifiedNodes=0,reusedTiles=0,meshRegionsRebuilt=0,meshRegionsReused=0,peakHeapBytes=0,peakArrayBufferBytes=0;const retained=[],times=[],verifiedMeshes=new WeakSet();
 for(let step=0;step<32;step++){
  if(step<16)resident.push(base[step]);
  else if(step===17)resident=resident.filter(t=>key(t)!==key(base[5]));
  else if(step===18)resident.push(base[5]);
  else{
   const at=(step*7)%resident.length,prior=resident[at],heights=prior.field.heights.slice();heights[31*65+31]=step%3===0?NaN:100+step;resident=resident.map((t,i)=>i===at?{...t,field:{...t.field,heights}}:t);
  }
  const start=performance.now(),nextHalos=updateTerrainMixedVertexTileHalos(halos,resident),nextStates=new Map();
  const sourceMap=new Map(resident.map(t=>[key(t),t]));
  for(const halo of nextHalos.tiles){
   const old=states.get(key(halo));if(old?.halo===halo){nextStates.set(key(halo),old);reusedTiles++;continue;}
   const field=new HeightField(halo.field);let minColumn=field.width,minRow=field.height,maxColumn=-1,maxRow=-1;
   if(old)for(let i=0;i<halo.field.heights.length;i++){
    if(halo.field.validity[i]!==old.halo.field.validity[i]||(halo.field.validity[i]&&halo.field.heights[i]!==old.halo.field.heights[i])){const x=i%field.width,y=Math.floor(i/field.width);minColumn=Math.min(minColumn,x);maxColumn=Math.max(maxColumn,x);minRow=Math.min(minRow,y);maxRow=Math.max(maxRow,y);}
   }
   const dirty=old&&maxColumn>=0?[{minColumn,minRow,maxColumn,maxRow}]:[];
   const gradientDirty=dirty.map(w=>({minColumn:Math.max(0,w.minColumn-1),minRow:Math.max(0,w.minRow-1),maxColumn:Math.min(field.width-1,w.maxColumn+1),maxRow:Math.min(field.height-1,w.maxRow+1)}));
   const source=sourceMap.get(key(halo));let mesh=old?.mesh;
   if(!old||old.source!==source){
    const sourceField=new HeightField(source.field);let sourceDirty=[];
    if(old){let x0=65,y0=65,x1=-1,y1=-1;for(let i=0;i<source.field.heights.length;i++){const a=source.field.heights[i],b=old.source.field.heights[i];if(a!==b&&!(Number.isNaN(a)&&Number.isNaN(b))){const x=i%65,y=Math.floor(i/65);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}}if(x1>=0)sourceDirty=[{minColumn:x0,minRow:y0,maxColumn:x1,maxRow:y1}];}
    mesh=updateTerrainMeshRegions(old?.mesh??null,sourceField,sourceDirty,{cellsPerRegion:32});meshRegionsRebuilt+=mesh.rebuilt.length;meshRegionsReused+=mesh.regions.length-mesh.rebuilt.length;
   }else meshRegionsReused+=mesh.regions.length;
   const bounds=updateTerrainPersistentBounds(old?.bounds??null,field,dirty),grid=createTerrainGradientGrid(field,{method}),gradients=updateTerrainPersistentGradients(old?.gradients??null,grid,gradientDirty);
   if(old){copiedBytes+=bounds.stats.copiedBytes+gradients.stats.copiedBytes;updates++;for(let l=0;l<bounds.levels.length;l++)if(bounds.stats.updatedNodes[l])flatCopiedBytes+=bounds.levels[l].width*bounds.levels[l].height*24;for(let l=0;l<gradients.levels.length;l++)if(gradients.stats.updatedNodes[l])flatCopiedBytes+=gradients.levels[l].width*gradients.levels[l].height*20;}
   nextStates.set(key(halo),{halo,field,grid,bounds,gradients,source,mesh});
  }
  times.push(performance.now()-start);states=nextStates;halos=nextHalos;
  for(const state of states.values()){
   if(!verifiedMeshes.has(state.mesh)){
    const full=updateTerrainMeshRegions(null,state.mesh.field,[],{cellsPerRegion:32});
    for(let r=0;r<full.regions.length;r++)for(const name of ['positions','indices','gridCoordinates']){
     const a=state.mesh.regions[r].data[name],b=full.regions[r].data[name];if(a.length!==b.length||a.some((v,i)=>v!==b[i]))throw new Error('Regional mesh full-rebuild mismatch');
    }
    verifiedMeshes.add(state.mesh);
   }
   const bounds=new HeightFieldMinMax(state.field),gradient=createTerrainGradientPyramid(state.grid);
   for(let l=0;l<state.bounds.levels.length;l++){
    const b=bounds.copyLevel(l),level=state.bounds.levels[l];for(let y=0;y<level.height;y++)for(let x=0;x<level.width;x++){const n=getTerrainHierarchyNode(level,x,y),i=y*level.width+x;verifiedNodes++;if(n.values[0]!==b.minimums[i]||n.values[1]!==b.maximums[i]||n.counts[0]!==b.populatedCellCounts[i]||n.counts[1]!==b.completeCellCounts[i])throw new Error(`Bounds mismatch ${name} step ${step}`);}
   }
   for(let l=0;l<state.gradients.levels.length;l++){
    const b=gradient.levels[l],level=state.gradients.levels[l];for(let y=0;y<level.height;y++)for(let x=0;x<level.width;x++){const n=getTerrainHierarchyNode(level,x,y),i=y*level.width+x;verifiedNodes++;if(n.values[0]!==b.gradients[2*i]||n.values[1]!==b.gradients[2*i+1]||n.counts[0]!==b.validCounts[i]||n.counts[1]!==b.sampleCounts[i])throw new Error(`Gradient mismatch ${name} step ${step}`);}
   }
  }
  for(const prior of retained)if(fingerprint(prior.states)!==prior.hash)throw new Error('Retained immutable snapshot changed');
  retained.push({states:new Map(states),hash:fingerprint(states)});if(retained.length>4)retained.shift();
  const memory=process.memoryUsage();peakHeapBytes=Math.max(peakHeapBytes,memory.heapUsed);peakArrayBufferBytes=Math.max(peakArrayBufferBytes,memory.arrayBuffers);
 }
 times.sort((a,b)=>a-b);
 console.log(JSON.stringify({name,method,source:fixture.source,sha256:fixture.sha256,steps:32,patches:16,width:257,height:257,retainedSnapshots:4,persistentUpdates:updates,reusedTiles,meshRegionsRebuilt,meshRegionsReused,verifiedNodes,copiedBlockBufferBytes:copiedBytes,flatLevelBufferCopyBytes:flatCopiedBytes,copyRatio:flatCopiedBytes?copiedBytes/flatCopiedBytes:0,p50PipelineMilliseconds:times[16],p95PipelineMilliseconds:times[30],sampledPeakHeapBytes:peakHeapBytes,sampledPeakArrayBufferBytes:peakArrayBufferBytes,processPeakRSSKiB:process.resourceUsage().maxRSS}));
}
