// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {FullProjectionEngine} from '@math.gl/geospatial/projection';
import {createCRSProjectionDomain} from '@math.gl/geospatial/crs';
import {getMapLayout} from '@math.gl/geospatial/discontinuous';

/** Qualified unit-sphere families, not arbitrary domain inference. An injected
 * engine must implement the requested spherical operation with the same units.
 */
export function createHorizonDomain({kind='orthographic',center=[0,-90],tolerance=.001,maxAngularStep=4,maxDepth=16,engine=new FullProjectionEngine()}={}) {
  if(!['orthographic','perspective'].includes(kind)||center.length!==2||!center.every(Number.isFinite)||Math.abs(center[1])>90||
    !Number.isFinite(tolerance)||tolerance<=0||!Number.isFinite(maxAngularStep)||maxAngularStep<=0||maxAngularStep>45||
    !Number.isInteger(maxDepth)||maxDepth<0||maxDepth>20)throw new RangeError('Invalid horizon policy');
  const [lon,lat]=center;
  const definition=kind==='orthographic'?`+proj=ortho +lat_0=${lat} +lon_0=${lon} +R=1`:`+proj=tpers +lat_0=${lat} +lon_0=${lon} +R=1 +h=1 +tilt=20 +azi=0`;
  const projection=engine.createProjection({from:'WGS84',to:definition});
  const radius=(kind==='orthographic'?Math.PI/2:Math.PI/3)-1e-7,phi=lat*Math.PI/180,lambda=lon*Math.PI/180;
  let samples=0;
  const sample=bearing=>{
    if(++samples>65536)throw new RangeError('Horizon total sample budget exhausted');
    const latitude=Math.asin(Math.max(-1,Math.min(1,Math.sin(phi)*Math.cos(radius)+Math.cos(phi)*Math.sin(radius)*Math.cos(bearing))));
    const longitude=lambda+Math.atan2(Math.sin(bearing)*Math.sin(radius)*Math.cos(phi),Math.cos(radius)-Math.sin(phi)*Math.sin(latitude));
    const p=projection.project([longitude*180/Math.PI,latitude*180/Math.PI]).slice(0,2);
    if(!p.every(Number.isFinite))throw new RangeError('Invalid horizon sample');return p;
  };
  const ring=[sample(0)];
  function edge(a,b,pa,pb,depth){const middle=(a+b)/2,pm=sample(middle),error=Math.hypot(...pm.map((v,i)=>v-(pa[i]+pb[i])/2));
    if(error>tolerance){if(depth>=maxDepth)throw new RangeError('Horizon sampling budget exhausted');edge(a,middle,pa,pm,depth+1);edge(middle,b,pm,pb,depth+1);}else ring.push(pb);
  }
  const count=Math.ceil(360/maxAngularStep);if(count>16384)throw new RangeError('Horizon angular sample budget exhausted');
  for(let i=0;i<count;i++)edge(i*2*Math.PI/count,(i+1)*2*Math.PI/count,ring.at(-1),sample((i+1)*2*Math.PI/count),0);
  ring[ring.length-1]=[...ring[0]];
  return {projection,definition,domain:createCRSProjectionDomain({polygons:[{outer:ring}]}),
    policy:{tolerance,maxAngularStep,inwardAngularMargin:1e-7},
    identity:JSON.stringify({definition,tolerance,maxAngularStep,maxDepth})};
}

/** Bridge simple native map charts without deriving validity from rendering bounds.
 * Preserve separate chart IDs and inverse choices. Multi-outline regions need a
 * topology-aware adapter and are rejected rather than guessed as outers/holes.
 */
export function createMapChartDomains(map,options={}) {
  return getMapLayout(map,options).regions.map(region=>{
    if(region.outlines.length!==1)throw new RangeError('Expected one simple outline per chart');
    const ring=region.outlines[0].map(p=>[...p]);
    if(ring.length&&ring[0].some((v,i)=>v!==ring.at(-1)[i]))ring.push([...ring[0]]);
    return {id:region.id,domain:createCRSProjectionDomain({polygons:[{outer:ring}]}),
      project:p=>map.projectPoint(p,region.id),unproject:p=>map.unprojectPoint(p,region.id)};
  });
}
