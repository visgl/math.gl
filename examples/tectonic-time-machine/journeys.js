// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Original example navigation; no inferred plate assignments outside source polygons.
import {unitVector,historicalRotation,futureRotation,futureRotations,rotateToLonLat} from './math.js';
export const FOLLOW_PLACES = [
  {id:'denver',name:'Denver · North America',lon:-104.99,lat:39.74},
  {id:'brasilia',name:'Brasília · South America',lon:-47.88,lat:-15.79},
  {id:'berlin',name:'Berlin · Europe',lon:13.4,lat:52.52},
  {id:'nairobi',name:'Nairobi · Africa',lon:36.82,lat:-1.29},
  {id:'delhi',name:'Delhi · India',lon:77.21,lat:28.61},
  {id:'beijing',name:'Beijing · East Asia',lon:116.4,lat:39.9},
  {id:'alice',name:'Alice Springs · Australia',lon:133.88,lat:-23.7}
];
const DEG=180/Math.PI;
const wrap=lon=>((lon+180)%360+360)%360-180;
/** Longitude-unwrapped ray casting, including holes; XYZ are present-day template coordinates. */
function inRing(xyz,start,end,lon,lat) {
  let previous=0,min=Infinity,max=-Infinity;
  for(let i=start;i<end;i++) {
    let x=Math.atan2(xyz[i*3+1],xyz[i*3])*DEG;
    if(i>start) x=previous+wrap(x-previous);
    min=Math.min(min,x);max=Math.max(max,x);previous=x;
  }
  const x=lon+360*Math.round(((min+max)/2-lon)/360);
  if(x<min||x>max) return false;
  let inside=false, firstX=0,firstY=0,px=0,py=0;
  for(let i=start;i<=end;i++) {
    let vx,vy;
    if(i===end){vx=firstX;vy=firstY;} else {
      vx=Math.atan2(xyz[i*3+1],xyz[i*3])*DEG;
      vy=Math.atan2(xyz[i*3+2],Math.hypot(xyz[i*3],xyz[i*3+1]))*DEG;
      if(i>start) vx=px+wrap(vx-px);
      else {firstX=vx;firstY=vy;}
    }
    if(i>start && ((py>lat)!==(vy>lat)) && x<(vx-px)*(lat-py)/(vy-py)+px) inside=!inside;
    px=vx;py=vy;
  }
  return inside;
}
export function containsPlace(feature,place) {
  if(!Number.isFinite(place.lon)||!Number.isFinite(place.lat)||Math.abs(place.lat)>90) return false;
  const count=feature.xyz.length/3,holes=feature.holes;
  if(!inRing(feature.xyz,0,holes.length?holes[0]/2:count,place.lon,place.lat)) return false;
  for(let i=0;i<holes.length;i++) if(inRing(feature.xyz,holes[i]/2,i+1<holes.length?holes[i+1]/2:count,place.lon,place.lat)) return false;
  return true;
}
export function createPlaceTracker() {
  let model=null,place=null,host=null,ambiguous=false,scenario=null,targets=null;
  const point=new Float64Array(3),q=new Float64Array(4),coordinate=new Float64Array(2);
  const trail=new Float64Array(66);
  const state={available:false,lon:0,lat:0,pid:null,trail,count:0,message:''};
  function resolve() {
    host=null;ambiguous=false;
    if(model&&place) {
      unitVector(place.lon,place.lat,point);
      // Never substitute a nearby plate for an unassigned point or ocean location.
      for(const feature of model.features) {
        if(feature.endAge>0||feature.beginAge<0||!containsPlace(feature,place))continue;
        if(host&&host.pid!==feature.pid){host=null;ambiguous=true;break;}
        host=feature;
      }
    }
  }
  function locate(time) {
    if(!host||!model||time < -model.source.maxAge||time < -host.beginAge || (time<=0 && time > -host.endAge)) return false;
    if(time>0) futureRotation(targets[host.region],time,q);
    else if(!historicalRotation(model.rotations,host.pid,-time,q,model.source.maxAge)) return false;
    rotateToLonLat(q,point,0,coordinate,0);
    return true;
  }
  return {
    setModel(value){model=value;resolve();},
    setPlace(value){place=value;resolve();},
    update(time,scenarioId) {
      state.available=false;state.count=0;state.pid=host?.pid??null;
      if(scenario!==scenarioId){scenario=scenarioId;targets=futureRotations(scenario);}
      if(!place){state.message='';return state;}
      if(!model){state.message='Waiting for plate geometry';return state;}
      if(!host){state.message=ambiguous?'Ambiguous present-day plate assignment; choose another place':'No present-day plate polygon covers this place';return state;}
      if(!locate(time)){state.message='Location unavailable at this age in the selected plate model';return state;}
      state.available=true;state.lon=coordinate[0];state.lat=coordinate[1];
      for(let i=0;i<33;i++) {
        if(!locate(time-i*3.125)) break;
        trail[i*2]=coordinate[0];trail[i*2+1]=coordinate[1];state.count++;
      }
      state.message=`${place.name} · plate ${host.pid} · ${state.lat.toFixed(1)}°, ${state.lon.toFixed(1)}°${time>0?' · illustrative future':''}`;
      return state;
    }
  };
}
/** Smooth cosmetic camera motion, following the shortest path across the dateline. */
export function easeCamera(camera,lon,lat,elapsedMs) {
  const dx=wrap(lon-camera.longitude),dy=Math.max(-70,Math.min(70,lat))-camera.latitude;
  if(Math.abs(dx)<.001&&Math.abs(dy)<.001) return false;
  const t=1-Math.exp(-Math.max(0,Math.min(100,elapsedMs))/350);
  camera.longitude=wrap(camera.longitude+dx*t);camera.latitude+=dy*t;
  return true;
}
export function cinematicShot(time) {
  if(time>=-4520&&time<=-4420) return THEIA_SHOT;
  if(time>=-3430&&time<=-3150) return LIFE_SHOT;
  if((time>=-717&&time<=-660)||(time>=-650&&time<=-635)) return ICE_SHOT;
  if(time>=-470&&time<=-390) return LAND_SHOT;
  if(time>0) return FUTURE_SHOT;
  return null;
}
const THEIA_SHOT={longitude:-25,latitude:15,name:'Moon formation'};
const LIFE_SHOT={longitude:35,latitude:5,name:'Microbial worlds'};
const ICE_SHOT={longitude:20,latitude:25,name:'Snowball Earth'};
const LAND_SHOT={longitude:-30,latitude:15,name:'Land colonization'};
const FUTURE_SHOT={longitude:25,latitude:30,name:'Future assembly'};
