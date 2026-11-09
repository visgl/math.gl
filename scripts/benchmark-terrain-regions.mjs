// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {performance} from 'node:perf_hooks';
import {HeightField,updateTerrainMeshRegions,updateTerrainBoundsRegions,createTerrainGradientGrid,updateTerrainGradientPyramidRegions,stitchTerrainContours,simplifyTerrainContourPathsTopology,createTerrainIsobands} from '../modules/geospatial/dist/terrain/index.js';
const width=129,heights=Float64Array.from({length:width*width},(_,i)=>Math.sin(i%width/10)+Math.cos(Math.floor(i/width)/10));
const before=new HeightField({width,height:width,heights});
const initialMesh=updateTerrainMeshRegions(null,before,[],{cellsPerRegion:16}),initialBounds=updateTerrainBoundsRegions(null,before,[]),initialGradients=updateTerrainGradientPyramidRegions(null,createTerrainGradientGrid(before),[]);
heights[20*width+20]+=10;const after=new HeightField({width,height:width,heights});
const dirty=[{minColumn:20,minRow:20,maxColumn:20,maxRow:20}],expanded=[{minColumn:19,minRow:19,maxColumn:21,maxRow:21}];
const start=performance.now(),mesh=updateTerrainMeshRegions(initialMesh,after,dirty,{cellsPerRegion:16}),bounds=updateTerrainBoundsRegions(initialBounds,after,dirty),gradients=updateTerrainGradientPyramidRegions(initialGradients,createTerrainGradientGrid(after),expanded),milliseconds=performance.now()-start;
const points=[],edges=[];for(let i=0;i<2000;i++){const v=points.length/3;points.push(i*4,0,0,i*4+1,0.1,0,i*4+2,0,0);edges.push(v,v+1,v+1,v+2);}
const paths=stitchTerrainContours({positions:Float64Array.from(points),gridCoordinates:new Float64Array(points.length/3*2),segments:Uint32Array.from(edges),levelIndices:new Uint32Array(edges.length/2),levels:new Float64Array([0]),origin:[0,0,0],heightReference:'local'});
const t=performance.now(),simplified=simplifyTerrainContourPathsTopology(paths,{maxError:1,maxTopologyTests:1_000_000}),contourMilliseconds=performance.now()-t;
const fields=Array.from({length:2000},(_,i)=>new HeightField({width:2,height:2,origin:[i*3,0],heights:new Float64Array(4).fill(1)}));
const b=performance.now(),bands=createTerrainIsobands(fields,[0,2],{maxTests:1_000_000}),bandMilliseconds=performance.now()-b;
console.log(JSON.stringify({runtime:process.version,platform:`${process.platform}/${process.arch}`,scope:'One diagnostic run, not a universal complexity or latency guarantee. Hierarchy array copies and full derivative grid creation are included in update timing.',dirtyUpdate:{width,milliseconds,rebuiltMeshRegions:mesh.rebuilt.length,totalMeshRegions:mesh.regions.length,boundsUpdatedCounts:Array.from(bounds.updatedCounts),gradientUpdatedCounts:Array.from(gradients.updatedCounts)},contours:{paths:2000,milliseconds:contourMilliseconds,topologyTests:simplified.topologyTests,retainedIndices:simplified.indices.length},isobands:{patches:2000,milliseconds:bandMilliseconds,rings:bands.parents.length}},null,2));
