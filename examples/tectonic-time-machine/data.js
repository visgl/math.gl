// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Original adapter. Scientific snapshots retain their CC-BY-4.0 attribution.
import {regionFor} from './math.js';
import {sourceFor, rotationBracket} from './sources.js';
import {createParquetReader, rotationGroups} from './parquet-stream.js';
import {snapshotRequest} from './snapshot-request.js';

const GEOMETRY_COLUMNS = ['featureId', 'plateId', 'name', 'beginAge', 'endAge', 'geometry'];
const ROTATION_COLUMNS = ['age', 'plateId', 'available', 'w', 'x', 'y', 'z'];

/** Read the snapshot's little-endian WKB Polygon, preserving holes and closure. */
export function polygonFeature(row) {
  const bytes = row.geometry;
  if (!(bytes instanceof Uint8Array)) throw new Error('Missing polygon geometry');
  const data = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length < 9 || data.getUint8(0) !== 1 || data.getUint32(1, true) !== 3)
    throw new Error('Expected little-endian WKB Polygon');
  const ringCount = data.getUint32(5, true), rings = [];
  if (!ringCount) throw new Error('Polygon has no rings');
  let offset = 9;
  for (let ringIndex = 0; ringIndex < ringCount; ringIndex++) {
    if (offset + 4 > bytes.length) throw new Error('Truncated polygon');
    const count = data.getUint32(offset, true);
    offset += 4;
    if (count < 4 || count > (bytes.length-offset)/16) throw new Error('Invalid polygon ring');
    const ring = [];
    let lastLon = Infinity, lastLat = Infinity;
    for (let index = 0; index < count; index++, offset += 16) {
      const lon = data.getFloat64(offset, true), lat = data.getFloat64(offset+8, true);
      if (!Number.isFinite(lon) || !Number.isFinite(lat) || Math.abs(lon)>180 || Math.abs(lat)>90)
        throw new Error('Invalid geographic coordinate');
      if (index === 0 || index === count-1 ||
          Math.hypot((lon-lastLon)*Math.cos(lat*Math.PI/180), lat-lastLat)>0.35) {
        ring.push(lon,lat); lastLon=lon; lastLat=lat;
      }
    }
    const end = offset-16, start = offset-count*16;
    if (data.getFloat64(start,true)!==data.getFloat64(end,true) ||
        data.getFloat64(start+8,true)!==data.getFloat64(end+8,true)) throw new Error('Unclosed polygon');
    // Tiny rings retain all original vertices rather than collapsing to a line.
    if (ring.length < 8) {
      ring.length=0;
      for (let index=0; index<count; index++)
        ring.push(data.getFloat64(start+index*16,true),data.getFloat64(start+index*16+8,true));
    }
    rings.push(ring);
  }
  if (offset!==bytes.length) throw new Error('Trailing polygon bytes');
  if (!Number.isSafeInteger(row.plateId) || !(row.beginAge>=row.endAge))
    throw new Error('Invalid polygon metadata');
  const count = rings.reduce((total,ring) => total+ring.length/2,0);
  const xyz = new Float64Array(count*3), positions = new Float64Array(count*2), holes=[];
  let vertex=0;
  for (let r=0; r<rings.length; r++) {
    if (r) holes.push(vertex*2);
    for (let i=0; i<rings[r].length; i+=2,vertex++) {
      const lon=rings[r][i]*Math.PI/180, lat=rings[r][i+1]*Math.PI/180, cos=Math.cos(lat);
      xyz[vertex*3]=cos*Math.cos(lon); xyz[vertex*3+1]=cos*Math.sin(lon); xyz[vertex*3+2]=Math.sin(lat);
    }
  }
  return {id:row.featureId,pid:row.plateId,name:row.name,beginAge:row.beginAge,endAge:row.endAge,
    xyz,positions,holes};
}
function assignRegions(features) {
  const centers = new Map();
  for (const f of features) {
    let c = centers.get(f.pid);
    if (!c) {c=new Float64Array(3);centers.set(f.pid,c);}
    for (let i=0;i<f.xyz.length;i+=3) {c[0]+=f.xyz[i];c[1]+=f.xyz[i+1];c[2]+=f.xyz[i+2];}
  }
  for (const f of features) {
    const c=centers.get(f.pid);
    f.region=regionFor(Math.atan2(c[1],c[0])*180/Math.PI,Math.atan2(c[2],Math.hypot(c[0],c[1]))*180/Math.PI);
  }
}
function columns(table,names) {
  return names.map(name => {
    const column=table.getChild(name);
    if (!column) throw new Error(`Missing Parquet column: ${name}`);
    return column;
  });
}

/** All devices stream the same history; publish only complete plate sets. */
export function createRotationCache(pids,source,stream) {
  if (!pids.length || new Set(pids).size!==pids.length) throw new Error('Invalid plate IDs');
  const rotations={},loaded=new Set(),listeners=new Set(),progress=new Set();
  const indices=new Map(pids.map((pid,index) => [pid,index]));
  let running=null, failure=null;
  function hasTime(time) {return rotationBracket(time,source.maxAge).every(age => loaded.has(age));}
  function notify() {for (const callback of listeners) callback();for (const callback of progress) callback();}
  function start(options) {
    if (running) return running;
    if (loaded.size===source.maxAge/10+1) return Promise.resolve();
    failure=null;
    const pending=new Map(),previouslyLoaded=new Set(loaded);
    running=(async () => {
      options.signal.throwIfAborted();
      for await (const batch of stream(options)) {
        options.signal.throwIfAborted();
        const [ages,plates,available,...quaternions]=columns(batch.data,ROTATION_COLUMNS);
        for (let row=0;row<batch.data.numRows;row++) {
          const age=ages.get(row),pid=plates.get(row),index=indices.get(pid);
          if (!Number.isInteger(age) || age<0 || age>source.maxAge || age%10 || index===undefined)
            throw new Error('Unexpected rotation sample');
          if (loaded.has(age)) {
            if (previouslyLoaded.has(age)) continue; // Preserve valid samples on retry.
            throw new Error('Duplicate rotation sample');
          }
          let sample=pending.get(age);
          if (!sample) {
            sample={values:new Float64Array(pids.length*4),available:new Uint8Array(pids.length),
              seen:new Uint8Array(pids.length),count:0};pending.set(age,sample);
          }
          if (sample.seen[index]) throw new Error('Duplicate rotation sample');
          const exists=available.get(row),w=quaternions[0].get(row),x=quaternions[1].get(row),
            y=quaternions[2].get(row),z=quaternions[3].get(row);
          if (exists===false) {
            if (w!==null || x!==null || y!==null || z!==null) throw new Error('Missing rotation must have null quaternion');
          } else {
            const norm=Math.hypot(w,x,y,z);
            if (exists!==true || !Number.isFinite(w) || !Number.isFinite(x) ||
                !Number.isFinite(y) || !Number.isFinite(z) || Math.abs(norm-1)>1e-12)
              throw new Error('Invalid rotation quaternion');
            sample.values[index*4]=w/norm;sample.values[index*4+1]=x/norm;
            sample.values[index*4+2]=y/norm;sample.values[index*4+3]=z/norm;
            sample.available[index]=1;
          }
          sample.seen[index]=1;sample.count++;
          if (sample.count===pids.length) {
            rotations[age]={values:sample.values,available:sample.available,indices};
            pending.delete(age);loaded.add(age);notify();
          }
        }
      }
      if (loaded.size!==source.maxAge/10+1) throw new Error('Incomplete rotation history');
    })().catch(error=>{failure=error;notify();throw error;}).finally(()=>{running=null;});
    // A background failure is also observed by ensureHistory or a waiting pose.
    running.catch(()=>{});
    return running;
  }
  return {
    rotations,hasTime,
    get loadedSamples() {return loaded.size;}, totalSamples:source.maxAge/10+1,
    async ensureHistory(_time,options) {
      const update=options.onStatus || (()=>{});progress.add(update);
      try {await start(options);} finally {progress.delete(update);}
    },
    waitForTime(time,{signal,lifetimeSignal=signal,onStatus=()=>{}}) {
      signal.throwIfAborted();
      if (hasTime(time)) return Promise.resolve();
      return new Promise((resolve,reject) => {
        function cleanup() {listeners.delete(check);signal.removeEventListener('abort',cancel);}
        function cancel() {cleanup();reject(signal.reason);}
        function check() {
          onStatus(`Waiting for pose · ${loaded.size}/${source.maxAge/10+1} historical samples loaded`);
          if (hasTime(time)) {cleanup();resolve();}
          else if (failure) {cleanup();reject(failure);}
        }
        listeners.add(check);signal.addEventListener('abort',cancel,{once:true});
        check();start({signal:lifetimeSignal}).catch(()=>{});
      });
    }
  };
}
export async function loadModel({sourceId,time,signal,onStatus=()=>{},readBatches,fetchManifest=fetch,workerUrl,requestTimeout = 45000}) {
  const source=sourceFor(sourceId);
  readBatches ||= createParquetReader(fetch, {workerUrl,requestTimeout});
  onStatus(`Loading ${source.citation} Parquet snapshots…`);
  const manifest=await snapshotRequest(source.manifest, {
    signal,fetchFile:fetchManifest,timeoutMs:requestTimeout
  }, async response => {
    if (!response.ok) throw new Error(`Snapshot manifest returned HTTP ${response.status}`);
    return await response.json();
  });
  if (manifest.model!==source.id || manifest.version!==source.version || manifest.license!=='CC-BY-4.0' ||
      manifest.referenceFrame!==source.referenceFrame || manifest.anchorPlateId!==0 ||
      JSON.stringify(manifest.quaternionOrder)!==JSON.stringify(['w','x','y','z']) ||
      manifest.ages.min!==0 || manifest.ages.max!==source.maxAge || manifest.ages.step!==10)
    throw new Error('Snapshot model or coordinate conventions changed');
  const geometryFile=manifest.files.find(file=>file.rowGroupIndex.some(group=>group.recordType==='geometry'));
  const rotationFile=manifest.files.find(file=>file.rowGroupIndex.some(group=>group.recordType==='rotation'));
  if (!geometryFile || !rotationFile) throw new Error('Incomplete snapshot manifest');
  const url=file => `${source.snapshot}/${file.path}`;
  const features=[];
  for await (const batch of readBatches(url(geometryFile),{
    signal,columns:GEOMETRY_COLUMNS,byteLength:geometryFile.bytes,
    rowGroups:geometryFile.rowGroupIndex.filter(group=>group.recordType==='geometry').map(group=>group.rowGroup)
  })) {
    signal.throwIfAborted();
    const fields=columns(batch.data,GEOMETRY_COLUMNS);
    for (let row=0;row<batch.data.numRows;row++)
      features.push(polygonFeature(Object.fromEntries(GEOMETRY_COLUMNS.map((name,index)=>[name,fields[index].get(row)]))));
  }
  const pids=[...new Set(features.map(f=>f.pid))];
  if (features.length!==manifest.polygonRows || pids.length!==manifest.plateCount)
    throw new Error('Incomplete snapshot geometry');
  assignRegions(features);
  const cache=createRotationCache(pids,source,options => readBatches(url(rotationFile),{
    signal:options.signal,columns:ROTATION_COLUMNS,byteLength:rotationFile.bytes,
    rowGroups:rotationGroups(rotationFile.rowGroupIndex,time,source.maxAge)
  }));
  await cache.waitForTime(time,{signal,onStatus});
  return Object.assign(cache,{features,pids,source,signal});
}
