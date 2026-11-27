// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const src=process.argv[2];
if(JSON.parse(readFileSync(src+'/../package.json','utf8')).version!=='4.0.0')throw new Error('Expected d3-geo-projection 4.0.0/src');
const d3=await import(pathToFileURL(src+'/index.js'));
const names={airy:'geoAiry',craig:'geoCraig',littrow:'geoLittrow',satellite:'geoSatellite','modified-stereographic-alaska':'geoModifiedStereographicAlaska','modified-stereographic-gs48':'geoModifiedStereographicGs48','modified-stereographic-gs50':'geoModifiedStereographicGs50','modified-stereographic-miller':'geoModifiedStereographicMiller','modified-stereographic-lee':'geoModifiedStereographicLee','chamberlin-africa':'geoChamberlinAfrica','two-point-azimuthal-usa':'geoTwoPointAzimuthalUsa','two-point-equidistant-usa':'geoTwoPointEquidistantUsa',wiechel:'geoWiechel'};
const samples={};
for(const [name,key] of Object.entries(names)){
 const p=d3[key]().scale(1).translate([0,0]).angle(0);
 samples[name]=[];
 for(let lon=-169;lon<180;lon+=20)for(let lat=-79;lat<90;lat+=20){
  let visible=false;p.stream({point:()=>{visible=true;}}).point(lon,lat);
  const xy=p([lon,lat]);
  samples[name].push({source:[lon,lat],visible,position:[xy[0],-xy[1]]});
 }
}
writeFileSync(new URL('./regional-reference.json',import.meta.url),JSON.stringify({source:'d3-geo-projection 4.0.0; native aspects and caps; unit scale; north-positive y; compare coordinate differences to remove display translation',samples},null,2)+'\n');
