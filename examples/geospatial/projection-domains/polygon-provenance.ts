// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {SolidPolygonLayer,PathLayer} from '@deck.gl/layers';
import {COORDINATE_SYSTEM} from '@deck.gl/core';
import {MapEngine} from '@math.gl/geospatial/discontinuous';
import {elasticI} from '@math.gl/geospatial/elastic';
export function polygonProvenanceLayers(showGenerated=false,wrapper='goode',atlas=false){
  const map=new MapEngine({version:1,id:'polygon-lineage-goode',definition:wrapper==='mercator'?{type:'mercator',maxLatitude:45}:wrapper==='satellite'?{type:'regional',projection:'satellite'}:wrapper==='armadillo'?{type:'regional',projection:'armadillo'}:wrapper==='elastic'?{type:'elastic',data:elasticI}:{type:'goode'}});
  const prepared=map.prepareFeatures([{geometry:{type:'Polygon',coordinates:wrapper!=='goode'?[
    [[-30,-30],[80,-30],[80,60],[-30,60],[-30,-30]],
    [[-5,5],[5,5],[5,15],[-5,15],[-5,5]]
  ]:[
    [[-75,20],[-5,20],[-5,65],[-75,65],[-75,20]],
    [[-55,30],[-55,45],[-25,45],[-25,30],[-55,30]]
  ]}}],{polygonOutlines:false,provenance:{polygonEdges:true},...(atlas?{sphericalCuts:{interior:'left' as const}}:{})});
  const {polygons}=prepared,edges=polygons.edgeProvenance!,fills:any[]=[],outlines:any[]=[];
  const point=(i:number)=>[polygons.positions[i*2]*100,polygons.positions[i*2+1]*100];
  for(let part=0;part<polygons.parts.length;part++){
    const rings=[];
    for(let ring=polygons.polygonStarts[part];ring<polygons.polygonStarts[part+1];ring++){
      const start=polygons.ringStarts[ring],end=polygons.ringStarts[ring+1];rings.push(Array.from({length:end-start},(_,j)=>point(start+j)));
      for(let i=start;i<end-1;i++)if(edges.kinds[i]===1||showGenerated)outlines.push({path:[point(i),point(i+1)],kind:edges.kinds[i],ring:edges.sourceRingIndices[i],segment:edges.sourceSegmentIndices[i],range:Array.from(edges.sourceParameterRanges.slice(i*2,i*2+2))});
    }
    fills.push({rings});
  }
  return {prepared,layers:[new SolidPolygonLayer({id:'provenance-fill',data:fills,getPolygon:d=>d.rings,getFillColor:[80,150,220,160],coordinateSystem:COORDINATE_SYSTEM.CARTESIAN}),
    new PathLayer({id:'provenance-boundaries',data:outlines,getPath:d=>d.path,getColor:d=>d.kind===1?[255,255,255]:[255,130,60],getWidth:3,widthUnits:'pixels',coordinateSystem:COORDINATE_SYSTEM.CARTESIAN,pickable:true})]};
}
export function polygonProvenanceTooltip(object:any){return object?.kind?`${['','Source boundary','Coverage boundary','Chart cut','Continuous chart join'][object.kind]}${object.kind===1?`; ring ${object.ring}, segment ${object.segment}, t=${object.range.map((v:number)=>v.toFixed(4)).join('→')}`:''}`:null;}
