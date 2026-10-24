// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const src=process.argv[2];
if(JSON.parse(readFileSync(src+'/../package.json','utf8')).version!=='4.0.0')throw new Error('Expected d3-geo-projection 4.0.0/src');
const d3=await import(pathToFileURL(src+'/index.js'));
const excluded={geoInterrupt:'generic interruption builder',geoPolyhedral:'generic polyhedral builder',geoQuincuncial:'generic quincuncial builder',geoProject:'geometry utility',geoQuantize:'geometry utility',geoStitch:'geometry utility',geoChamberlin:'controlPoints required; createRegionalMap',geoModifiedStereographic:'coefficients required; createRegionalMap',geoTwoPointAzimuthal:'controlPoints required; createRegionalMap',geoTwoPointEquidistant:'controlPoints required; createRegionalMap'};
const aliases={geoPolyhedralButterfly:'butterfly',geoPolyhedralCollignon:'collignon-butterfly',geoPolyhedralWaterman:'waterman'};
const cases=[];
for(const name of Object.keys(d3).filter(n=>!n.endsWith('Raw')&&!excluded[n])){
 const p=d3[name]().scale(1).translate([0,0]).angle(0),points=[];
 for(let lon=-169;lon<180;lon+=20)for(let lat=-79;lat<90;lat+=20){
  let visible=false;p.stream({point:()=>{visible=true;}}).point(lon,lat);
  if(name==='geoArmadillo')visible=lat*Math.PI/180>-Math.atan2(Math.cos(lon*Math.PI/360),Math.tan(20*Math.PI/180));
  if(visible){const xy=p([lon,lat]);points.push({source:[lon,lat],position:[xy[0],-xy[1]]});}
 }
 cases.push({upstream:name,projection:aliases[name]??name.slice(3).replace(/[A-Z]/g,(c,i)=>(i?'-':'')+c.toLowerCase()),samples:Array.from({length:Math.min(12,points.length)},(_,i)=>points[Math.round(i*(points.length-1)/11)])});
}
writeFileSync(new URL('./catalog-reference.json',import.meta.url),JSON.stringify({source:'d3-geo-projection 4.0.0; all named default constructors; native geographic aspects; unit scale and angle zero; compare after one global similarity to remove display conventions',excluded,cases},null,2)+'\n');
console.log(cases.length,'named default constructors');
