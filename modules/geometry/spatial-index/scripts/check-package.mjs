// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtemp, mkdir, cp, copyFile, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
const root = fileURLToPath(new URL('../../../../', import.meta.url));
const temporary = await mkdtemp(join(tmpdir(), 'math-gl-spatial-'));
try {
  const scope = join(temporary, 'node_modules/@math.gl');
  await mkdir(scope, {recursive: true});
  for (const name of ['geometry', 'core']) {
    await mkdir(join(scope, name));
    await cp(join(root, 'modules', name, 'dist'), join(scope, name, 'dist'), {recursive: true});
    await copyFile(join(root, 'modules', name, 'package.json'), join(scope, name, 'package.json'));
  }
  await writeFile(join(temporary, 'package.json'), ' {"type":"module"}');
  const assertions = `const index=new api.PointIndex({positions:[0,0,1,1],dimension:2});
assert.deepEqual(index.nearest([1,2]),{index:1,distance:1});
assert.deepEqual(index.intersectRay([1,2],[0,-2]),{index:1,distance:1});
const mesh=new api.TriangleBVH({positions:[0,0,0,1,0,0,0,1,0]});
assert.equal(mesh.intersectRay([0.2,0.2,1],[0,0,-2]).distance,1);
assert.equal(mesh.intersectRay([0.2,0.2,1],[0,0,-2],{acceptHit:()=>false}),null);
assert.equal(mesh.intersectRay([0.2,0.2,1],[0,0,-2],{filter:()=>false}),null);
assert.deepEqual(mesh.nearestQuery([0,0,1],{maxWork:0}),{result:null,complete:false,work:0});
assert.equal(mesh.intersectRayQuery([0,0,1],[0,0,-1],{maxWork:2}).complete,true);
assert.equal(mesh.intersectSphere([0.2,0.2,1],1).result.length,1);
assert.equal(mesh.intersectSphere([0.2,0.2,1],1,{maxResults:0}).complete,false);
assert.equal(mesh.nearestSegment([0.2,0.2,1],[0.2,0.2,-1]).distance,0);
assert.equal(mesh.nearestSegmentQuery([0.2,0.2,1],[0.2,0.2,-1],{maxWork:0}).complete,false);
assert.equal(mesh.intersectCapsule([0.2,0.2,1],[0.2,0.2,-1],0.1).result[0].segmentFraction,0.5);
assert.equal(index.nearestBoxQuery([0,0],[2,2]).result.distance,0);`;
  await writeFile(
    join(temporary, 'consumer.mjs'),
    `import assert from 'node:assert/strict'; import * as api from '@math.gl/geometry';
${assertions}`
  );
  await writeFile(
    join(temporary, 'consumer.cjs'),
    `const assert=require('node:assert/strict'),api=require('@math.gl/geometry');
${assertions}`
  );
  for (const file of ['consumer.mjs', 'consumer.cjs'])
    execFileSync(process.execPath, [join(temporary, file)], {stdio: 'inherit'});
  await writeFile(
    join(temporary, 'consumer.ts'),
    `import {PointIndex,TriangleBVH,type TriangleRayOptions,type RayIndexOptions,type IndexQueryResult,type IndexQueryBudget,type SearchIndexOptions,type TriangleQueryResult,type TriangleSegmentResult} from '@math.gl/geometry';
import {getClosestPointsOnSegments,getClosestPointsSegmentTriangle,type SegmentClosestPoints,type SegmentTriangleClosestPoints} from '@math.gl/geometry/culling';
const points=new PointIndex({positions:new Float64Array([0,0]),dimension:2});
const index:number|undefined=points.nearest([0,0])?.index;
const triangle=new TriangleBVH({positions:[]});
const point: [number,number,number]|undefined=triangle.nearest([0,0,0])?.point;
const options:TriangleRayOptions={filter:index=>index!==2,acceptHit:hit=>{
  const weights:readonly [number,number,number]=hit.barycentric;
  // @ts-expect-error acceptance callbacks cannot mutate query coordinates
  hit.point[0]=0;
  return hit.distance>=0&&weights[0]>=0;
}};
triangle.intersectRay([0,0,1],[0,0,-1],options);
const rayOptions:RayIndexOptions={intersectItem:(index,maximum)=>index===0?Math.min(1,maximum):null};
points.intersectRay([0,0],[1,0],rayOptions);
const budget:IndexQueryBudget={maxWork:128};
const contacts:IndexQueryResult<TriangleQueryResult[]>=triangle.intersectSphere([0,0,0],1,budget);
const searchOptions:SearchIndexOptions={...budget,maxResults:16,filter:index=>index>0};
const candidates:IndexQueryResult<number[]>=triangle.searchQuery([0,0,0],[1,1,1],searchOptions);
triangle.intersectRayQuery([0,0,1],[0,0,-1],{...options,...budget});
void [contacts,candidates];
const capsule:IndexQueryResult<TriangleSegmentResult[]>=triangle.intersectCapsule([0,0,1],[0,0,-1],1,budget);
const segment:IndexQueryResult<TriangleSegmentResult|null>=triangle.nearestSegmentQuery([0,0,1],[0,0,-1],budget);
const pair:SegmentClosestPoints=getClosestPointsOnSegments([0,0,0],[1,0,0],[0,1,0],[1,1,0]);
const face:SegmentTriangleClosestPoints=getClosestPointsSegmentTriangle([0,0,1],[0,0,-1],[0,0,0],[1,0,0],[0,1,0]);
void [capsule,segment,pair,face];
void [index,point];
// @ts-expect-error invalid dimension
new PointIndex({positions:[],dimension:4});`
  );
  await writeFile(
    join(temporary, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        target: 'es2020',
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        strict: true,
        noEmit: true,
        types: []
      },
      include: ['consumer.ts']
    })
  );
  execFileSync(
    process.execPath,
    [join(root, 'node_modules/typescript/bin/tsc'), '--project', join(temporary, 'tsconfig.json')],
    {stdio: 'inherit'}
  );
  const bundle = await build({
    stdin: {
      contents: "export {PointIndex} from '@math.gl/geometry';",
      resolveDir: temporary
    },
    bundle: true,
    format: 'esm',
    platform: 'browser',
    write: false,
    treeShaking: true
  });
  const source = bundle.outputFiles[0].text;
  assert(
    !source.includes('TriangleBVH') && !source.includes('getClosestPointOnTriangle'),
    'Box imports must exclude triangle kernels'
  );
} finally {
  await rm(temporary, {recursive: true, force: true});
}
