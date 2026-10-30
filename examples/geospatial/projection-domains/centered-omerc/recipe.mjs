// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import proj4 from 'proj4';
import {FullProjectionEngine} from '@math.gl/geospatial/projection';
import {createCRSDescriptor, getCRSExecutionKey} from '@math.gl/geospatial/crs';

/** Qualified local Hotine oblique Mercator fixture. Neither bounds nor finite
 * round trips establish the operation's global domain or an arbitrary path branch.
 * Applications retain the math.gl descriptor contract across both engines.
 */
export function createCenteredObliqueMercator({center=[180,-17],alpha=35,backend='proj4js'}={}) {
  if(!Array.isArray(center)||center.length!==2||!center.every(Number.isFinite)||Math.abs(center[0])>180||Math.abs(center[1])>75||!Number.isFinite(alpha)||Math.abs(alpha)>80||!['proj4js','math.gl'].includes(backend)) throw new RangeError('Unsupported centered oblique Mercator parameters');
  // Canonicalize negative zero because execution identity rejects ambiguous -0.
  const [lon,lat]=center.map(x=>x===0?0:x); alpha=alpha===0?0:alpha;
  const definition=`+proj=omerc +lat_0=${lat} +lonc=${lon} +alpha=${alpha} +gamma=0 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs`;
  const operation=backend==='proj4js'?proj4('WGS84',definition):new FullProjectionEngine().createProjection({from:'WGS84',to:definition});
  const forward=p=>Array.from(backend==='proj4js'?operation.forward(p):operation.project(p));
  const inverse=p=>Array.from(backend==='proj4js'?operation.inverse(p):operation.unproject(p));
  const conversion=f=>(p,out)=>{const result=f(Array.from(p).slice(0,2));if(!result.every(Number.isFinite))throw new RangeError('Invalid projection sample');const values=[...result,...Array.from(p).slice(2)];if(!out)return values;for(let i=0;i<values.length;i++)out[i]=values[i];return out;};
  const descriptor=createCRSDescriptor({metadata:{coordinateFrame:'projected',projection:'omerc',parameters:{definition},ellipsoid:{semiMajorAxis:6378137,semiMinorAxis:6356752.314245179},axis:'enu',xUnit:{name:'metre',metersPerUnit:1},yUnit:{name:'metre',metersPerUnit:1},zUnit:{name:'metre',metersPerUnit:1},lossy:false},signature:definition,
    // An explicit local display envelope, not a mathematical validity domain.
    renderingBounds:[[-2500000,-2500000,0],[2500000,2500000,0]],renderingScale:()=>null,
    executionIdentity:{backend,version:backend==='proj4js'?'2.22.0':'math.gl-example-v1',operation:definition,revision:'centered-omerc-local-v1'},
    converter:{WGS84:{from:conversion(forward),to:conversion(inverse),normalize:conversion(p=>p)}}});
  // These are small source-space processing patches with caller-known topology.
  // Longitude is local to the center; the display may straddle geographic ±180.
  const patch=[[-18,-12],[18,-12],[18,12],[-18,12],[-18,-12]].map(([x,y])=>[lon+x,lat+y]);
  const samplePath=points=>{
    const target=[];
    for(let i=1;i<points.length;i++)for(let j=i===1?0:1;j<=32;j++){
      const t=j/32,p=points[i-1].map((v,k)=>v+(points[i][k]-v)*t),q=descriptor.converter.WGS84.from(p);
      const back=descriptor.converter.WGS84.to(q),dx=(back[0]-p[0]+540)%360-180;
      if(Math.hypot(dx,back[1]-p[1])>1e-7)throw new RangeError('Unqualified inverse branch');
      if(target.length&&Math.hypot(...q.slice(0,2).map((v,k)=>v-target.at(-1)[k]))>300000)throw new RangeError('Unresolved output branch');
      target.push(q.slice(0,2));
    }
    return target;
  };
  const graticule=[];
  for(let x=-15;x<=15;x+=5)graticule.push(samplePath([[lon+x,lat-12],[lon+x,lat+12]]));
  for(let y=-10;y<=10;y+=5)graticule.push(samplePath([[lon-18,lat+y],[lon+18,lat+y]]));
  return {descriptor,definition,key:getCRSExecutionKey(descriptor),patch:samplePath(patch),graticule,samplePath};
}

/** Reuse requires the full operation identity AND the source/sampling revision.
 * A changed center, azimuth or backend rebuilds geometry; no frame-rate claim.
 */
export function prepareCenteredFrame(options,previous) {
  const {center=[180,-17],alpha=35,backend='proj4js'}=options??{};
  const requestKey=JSON.stringify([center,alpha,backend,'native/proj4js-2.22.0-v1','graticule-v1','32-linear-source-steps']);
  if(previous?.requestKey===requestKey)return {...previous,reused:true};
  const next=createCenteredObliqueMercator(options),key=JSON.stringify([next.key,'graticule-v1','32-linear-source-steps']);
  return {...next,requestKey,cacheKey:key,reused:false};
}
