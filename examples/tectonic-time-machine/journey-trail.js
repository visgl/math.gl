// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Display paths preserve all available samples; map seams split, never truncate, a trail.
import {cutPolylineByMercatorBounds} from '@math.gl/geometry/polygon';
import {transformMesh} from './geometry.js';
function mesh(length) {
  return {coordinates:new Float64Array(length),projected:new Float64Array(length),positions:new Float64Array(length/2*3),count:0};
}
function fill(path,line) {
  path.count=line.length/2;path.coordinates.set(line);
  for(let i=line.length;i<path.coordinates.length;i+=2){path.coordinates[i]=line[line.length-2];path.coordinates[i+1]=line[line.length-1];}
}
export function createJourneyTrail() {
  const coordinates=new Float64Array(66),globe=mesh(66),pool=[],active=[];
  return (journey,longitude,latitude,weights,engines,scales)=>{
    active.length=0;
    if(journey.count<2)return active;
    const globeOnly=(weights.globe||0)>.999999;
    for(let i=0;i<journey.count;i++) {
      const lon=journey.trail[i*2]-longitude;
      coordinates[i*2]=globeOnly?lon:((lon+180)%360+360)%360-180;
      coordinates[i*2+1]=journey.trail[i*2+1];
    }
    const line=coordinates.subarray(0,journey.count*2);
    if(globeOnly){fill(globe,line);active.push(globe);}
    else {
      for(const segment of cutPolylineByMercatorBounds(line,{maxLatitude:90})) {
        if(segment.length<4)continue;
        let path=pool[active.length];
        if(!path||path.coordinates.length<segment.length){path=mesh(Math.max(70,segment.length));pool[active.length]=path;}
        fill(path,segment);active.push(path);
      }
    }
    for(const path of active) {
      transformMesh(path,weights,engines,scales,latitude);
      for(let i=0;i<path.positions.length;i++)path.positions[i]*=1.01;
      for(let i=2;i<path.positions.length;i+=3)path.positions[i]+=.008*(1-(weights.globe||0));
    }
    return active;
  };
}
