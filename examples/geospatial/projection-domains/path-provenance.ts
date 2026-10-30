// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {PathLayer,ScatterplotLayer} from '@deck.gl/layers';
import {COORDINATE_SYSTEM} from '@deck.gl/core';
import {MapEngine} from '@math.gl/geospatial/discontinuous';

/** Source distance drives dash phase across fragments; chart XY only draws it. */
export function pathProvenanceLayers(showVertices=true){
  const map=new MapEngine({version:1,id:'lineage-goode',definition:{type:'goode'}});
  const prepared=map.prepareFeatures([{geometry:{type:'LineString',coordinates:[[-110,30],[-20,30],[60,20],[130,35]]}}],
    {provenance:{sourceSegments:true,boundaries:true,distances:{metric:'spherical',radius:6371000}}});
  const hours=[0,2,5,9];
  const {paths}=prepared,p=paths.provenance!,lines:any[]=[],vertices:any[]=[];
  for(let part=0;part<paths.parts.length;part++){
    const start=paths.pathStarts[part],end=paths.pathStarts[part+1];
    for(let i=start;i<end;i++){
      const position=[paths.positions[i*2]*100,paths.positions[i*2+1]*100];
      const info={position,segment:p.sourceSegmentIndices![i],t:p.sourceSegmentParameters![i],distance:p.sourceDistances![i],original:p.sourceVertexIndices![i]!==0xffffffff,
        reason:i===start?p.startReasons![part]:i===end-1?p.endReasons![part]:'sample'};
      const segment=info.segment;
      Object.assign(info,{timeHours:hours[segment]+(hours[segment+1]-hours[segment])*info.t});
      vertices.push(info);
      if(i===start)continue;
      const a=vertices[vertices.length-2],b=info,period=800000;
      const d0=a.distance,d1=b.distance;
      if(d1<=d0)continue;
      // Split at dash boundaries in cumulative source meters, never restart per chart.
      for(let d=d0;d<d1;){const boundary=Math.min(d1,(Math.floor(d/(period/2))+1)*period/2),next=boundary>d?boundary:d1;
        if(Math.floor(d/(period/2))%2===0){const point=(distance:number)=>{const t=(distance-d0)/(d1-d0);return a.position.map((v:number,k:number)=>v+(b.position[k]-v)*t);};lines.push({...b,path:[point(d),point(next)]});}d=next;
      }
    }
  }
  const common={coordinateSystem:COORDINATE_SYSTEM.CARTESIAN,pickable:true};
  return {prepared,layers:[new PathLayer({...common,id:'provenance-dashes',data:lines,getPath:d=>d.path,getColor:d=>[255,120+100*d.timeHours/9,80],getWidth:4,widthUnits:'pixels'}),
    new ScatterplotLayer({...common,id:'provenance-vertices',data:showVertices?vertices:[],getPosition:d=>d.position,getFillColor:d=>d.original?[255,255,255]:[90,200,255],getRadius:3,radiusUnits:'pixels'})]};
}
export function provenanceTooltip(object:any){return object&&object.segment!==undefined?`Source segment ${object.segment}; t=${object.t.toFixed(4)}; distance ${(object.distance/1000).toFixed(1)} km; time +${object.timeHours.toFixed(2)} h; ${object.reason}`:null;}
