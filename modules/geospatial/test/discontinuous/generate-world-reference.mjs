// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
// Run from the repository root; pass d3-geo-projection@4.0.0/src.
const root=process.cwd();
const source=process.argv[2];
if (JSON.parse(readFileSync(source+'/../package.json','utf8')).version !== '4.0.0') throw new Error('Expected d3-geo-projection 4.0.0');
const text=readFileSync(root+'/modules/geospatial/src/discontinuous/world-kernels.ts','utf8');
const imports=Object.fromEntries([...text.matchAll(/import \{(\w+)\} from '\.\/world-kernels\/(\w+)\.js'/g)].map(m=>[m[1],m[2]]));
const block=text.split('export const worldKernels = {')[1].split('\n};')[0];
const result={source:'d3-geo-projection 4.0.0 raw kernels; radians, y north, no display transform',samples:{}};
for(const match of block.matchAll(/^  '?([\w-]+)'?: (.+),?$/gm)){
 const name=match[1],expression=match[2].replace(/,$/,'');
 const rawName=expression.match(/\b\w+Raw\b/)[0];
 if (!imports[rawName]) continue;
 const raw=(await import(pathToFileURL(source+'/'+imports[rawName]+'.js')))[rawName];
 const kernel=expression.startsWith('lazy')?Function(rawName,'return '+expression.slice(11,-1))(raw):raw;
 result.samples[name]=[];
 for(const lon of [-167,-91,-37,13,67,139,173])for(const lat of [-77,-43,-11,23,59,81])result.samples[name].push({source:[lon,lat],position:kernel(lon*Math.PI/180,lat*Math.PI/180)});
}
const d3 = await import(pathToFileURL(source+'/index.js'));
for (const name of ['gilbert','gringorten']) {
  const projection=d3['geo'+name[0].toUpperCase()+name.slice(1)]().scale(1).translate([0,0]).center([0,0]);
  result.samples[name]=result.samples.aitoff.map(({source})=>{const p=projection(source);return {source,position:[p[0],-p[1]]};});
}
result.aspects=Object.fromEntries(['bertin1953','sinu-mollweide'].map(name=>{
 const projection=d3[name==='bertin1953'?'geoBertin1953':'geoSinuMollweide']().scale(1).translate([0,0]).center([0,0]);
 // D3 recenters the projected origin; retain one origin offset for comparison.
 const rawOrigin=name==='bertin1953'?d3.geoBertin1953Raw()(0,0):d3.geoSinuMollweideRaw(0,0);
 return [name,result.samples.aitoff.map(({source})=>{const p=projection(source);return {source,position:[p[0]+rawOrigin[0],-p[1]+rawOrigin[1]]};})];
}));
writeFileSync(root+'/modules/geospatial/test/discontinuous/world-reference.json',JSON.stringify(result,null,2)+'\n');
console.log(Object.keys(result.samples).length);
