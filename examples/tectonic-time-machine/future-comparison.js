// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Alternative illustrative assembly outlines, not forecast confidence envelopes.
import {cutPolylineByMercatorBounds} from '@math.gl/geometry';
import {futureRotations,futureRotation,rotateToLonLat} from './math.js';
import {transformMesh} from './geometry.js';
// Rank present-day blocks by spherical strip area, for display selection only.
// Show one major source polygon per region instead of overplotting every internal fragment.
export function majorFutureBlocks(features) {
  const largest=new Map();
  for(const feature of features) {
    if(feature.endAge>0||feature.beginAge<0)continue;
    const end=feature.holes.length?feature.holes[0]/2:feature.xyz.length/3;
    let sum=0;
    for(let i=0;i<end;i++) {
      const j=(i+1)%end;
      const a=Math.atan2(feature.xyz[i*3+1],feature.xyz[i*3]);
      const b=Math.atan2(feature.xyz[j*3+1],feature.xyz[j*3]);
      const delta=((b-a+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;
      sum+=delta*(2+feature.xyz[i*3+2]+feature.xyz[j*3+2]);
    }
    let area=Math.abs(sum)/2;if(area>2*Math.PI)area=4*Math.PI-area;
    if(area>(largest.get(feature.region)?.area||0))largest.set(feature.region,{area,feature});
  }
  return Array.from(largest.values(),entry=>entry.feature);
}
export function createFutureComparison() {
  const targets={atlantic:futureRotations('atlantic'),polar:futureRotations('polar')};
  const q=new Float64Array(4),buffers=new Map();
  let model=null,blocks=[],paths=[],globePaths=null,lastTime=NaN,lastScenario='',lastBuild=-Infinity,seamLongitude=NaN;
  function mesh(length){return {coordinates:new Float64Array(length),projected:new Float64Array(length),positions:new Float64Array(length/2*3)};}
  function project(path,latitude,weights,engines,scales) {
    transformMesh(path,weights,engines,scales,latitude);
    for(let i=0;i<path.positions.length;i++)path.positions[i]*=1.008;
    for(let i=2;i<path.positions.length;i+=3)path.positions[i]+=.004*(1-(weights.globe||0));
  }
  return {
    setModel(value){model=value;blocks=value?majorFutureBlocks(value.features):[];buffers.clear();paths=[];globePaths=null;lastTime=NaN;},
    update(time,selected,longitude,latitude,weights,engines,scales,now,force=false) {
      if(!model||time<=0) return [];
      const alternate=selected==='atlantic'?'polar':'atlantic';
      // Globe outlines have no projection seams: reuse all per-ring buffers at playback rate.
      if((weights.globe||0)>.999999) {
        if(!globePaths) {
          globePaths=[];
          for(const feature of blocks) {
            if(feature.endAge>0||feature.beginAge<0)continue;
            let start=0;
            for(let ring=0;ring<=feature.holes.length;ring++) {
              const end=ring<feature.holes.length?feature.holes[ring]:feature.xyz.length/3*2;
              globePaths.push({...mesh(end-start),feature,start});start=end;
            }
          }
        }
        for(const path of globePaths) {
          futureRotation(targets[alternate][path.feature.region],time,q);
          for(let j=0;j<path.coordinates.length;j+=2){rotateToLonLat(q,path.feature.xyz,(path.start+j)/2*3,path.coordinates,j);path.coordinates[j]-=longitude;}
          project(path,latitude,weights,engines,scales);
        }
        return globePaths;
      }
      // Map outlines need seam clipping. Cache between updates and rebuild immediately on seeks.
      const rebuild=lastScenario!==alternate||!Number.isFinite(lastTime)||
        (time!==lastTime&&(force||now-lastBuild>=150))||seamLongitude!==longitude;
      if(rebuild) {
        paths=[];
        for(const feature of blocks) {
          if(feature.endAge>0||feature.beginAge<0) continue;
          let coordinates=buffers.get(feature);
          if(!coordinates){coordinates=new Float64Array(feature.xyz.length/3*2);buffers.set(feature,coordinates);}
          futureRotation(targets[alternate][feature.region],time,q);
          for(let i=0,j=0;i<feature.xyz.length;i+=3,j+=2){rotateToLonLat(q,feature.xyz,i,coordinates,j);coordinates[j]-=longitude;}
          let start=0;
          for(let ring=0;ring<=feature.holes.length;ring++) {
            const end=ring<feature.holes.length?feature.holes[ring]:coordinates.length;
            for(const line of cutPolylineByMercatorBounds(coordinates.subarray(start,end),{maxLatitude:90})) {
              const path=mesh(line.length);path.coordinates.set(line);paths.push(path);
            }
            start=end;
          }
        }
        lastTime=time;lastScenario=alternate;lastBuild=now;seamLongitude=longitude;
      }
      for(const path of paths)project(path,latitude,weights,engines,scales);
      return paths;
    }
  };
}
