// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {Deck,OrthographicView,COORDINATE_SYSTEM} from '@deck.gl/core';
import {PathLayer,ScatterplotLayer} from '@deck.gl/layers';
import {mountInfoBox} from '../../../common/info-box.js';
import {createRasterFrame,rasterFrameFixtures} from './recipe.mjs';
import '../style.css';
export function mountRasterFrame(root){
 root.innerHTML=`<section class="projection-domains"><div class="projection-map"></div><aside><p>Array indices → explicit affine frame → stored CRS components → display XY. A CRS name alone does not locate raster samples.</p><label>Fixture<select data-frame>${rasterFrameFixtures.map(f=>`<option value="${f.id}">${f.name}</option>`).join('')}</select></label><p>White dots are sample centers. Blue is the sample envelope; orange is declared cell coverage. Point registration has no inferred cell coverage.</p><p>Hover samples to inspect grid indices, CRS coordinates and inverse round-trip error. Display coordinates subtract the fixture origin and scale equally on both axes.</p></aside><output data-status aria-live="polite"></output></section>`;
 const disposeInfo=mountInfoBox(root.querySelector('aside'),{title:'Raster coordinate frames',theme:'sleek-dark',width:280});
 const deck=new Deck({parent:root.querySelector('.projection-map'),views:new OrthographicView({flipY:false}),initialViewState:{target:[160,-120,0],zoom:0},controller:true,getTooltip:({object})=>object?.index?`Sample ${object.index}; CRS XY ${object.xy.map(v=>v.toFixed(3))}; round trip ${object.error.toExponential(2)} pixels`:null});
 const select=root.querySelector('[data-frame]');
 function update(){try{
  const fixture=rasterFrameFixtures.find(f=>f.id===select.value),frame=createRasterFrame({...fixture,spatialReference:{coordinateFrame:'projected',coordinateOrder:fixture.axisOrder[0]===1?['northing','easting']:['easting','northing'],units:['metre','metre']}});
  const origin=frame.gridToCoordinate([0,0]),display=p=>p.map((v,i)=>(v-origin[i])*40),points=[];
  for(let row=0;row<frame.size[1];row++)for(let col=0;col<frame.size[0];col++){
   const index=[col,row],xy=frame.sampleToCoordinate(index),back=frame.coordinateToSample(xy);points.push({index,xy,position:display(xy),error:Math.hypot(back[0]-col,back[1]-row)});
  }
  const outlines=[{path:frame.sampleBounds.map(display),color:[100,200,240]}];if(frame.coverage)outlines.push({path:frame.coverage.map(display),color:[255,170,70]});
  deck.setProps({layers:[new PathLayer({id:'raster-frame-extents',data:outlines,getPath:d=>d.path,getColor:d=>d.color,getWidth:3,widthUnits:'pixels',coordinateSystem:COORDINATE_SYSTEM.CARTESIAN}),new ScatterplotLayer({id:'raster-frame-samples',data:points,getPosition:d=>d.position,getRadius:5,radiusUnits:'pixels',getFillColor:[245,245,245],pickable:true,coordinateSystem:COORDINATE_SYSTEM.CARTESIAN})]});
  root.querySelector('[data-status]').textContent=`${fixture.name}; ${frame.registration} registration; ${points.length} samples; max inverse error ${Math.max(...points.map(p=>p.error)).toExponential(2)} pixels. Units are declared, not inferred from CRS identifiers. No format parsing or projection-engine dependency.`;
  root.dataset.ready=fixture.id;delete root.dataset.error;
 }catch(error){root.dataset.error=String(error);root.querySelector('[data-status]').textContent=String(error);}}
 select.addEventListener('change',update);update();return async()=>{select.removeEventListener('change',update);deck.finalize();disposeInfo();root.replaceChildren();};
}
