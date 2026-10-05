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
const root = fileURLToPath(new URL('../../../', import.meta.url));
const temporary = await mkdtemp(join(tmpdir(), 'math-gl-spatial-'));
try {
  const scope = join(temporary, 'node_modules/@math.gl');
  await mkdir(scope, {recursive: true});
  for (const name of ['spatial-index', 'culling']) {
    await mkdir(join(scope, name));
    await cp(join(root, 'modules', name, 'dist'), join(scope, name, 'dist'), {recursive: true});
    await copyFile(join(root, 'modules', name, 'package.json'), join(scope, name, 'package.json'));
  }
  await writeFile(join(temporary, 'package.json'), ' {"type":"module"}');
  const assertions = `const index=new api.PointIndex({positions:[0,0,1,1],dimension:2});
assert.deepEqual(index.nearest([1,2]),{index:1,distance:1});
const mesh=new api.TriangleBVH({positions:[0,0,0,1,0,0,0,1,0]});
assert.equal(mesh.intersectRay([0.2,0.2,1],[0,0,-2]).distance,1);`;
  await writeFile(
    join(temporary, 'consumer.mjs'),
    `import assert from 'node:assert/strict'; import * as api from '@math.gl/spatial-index';
${assertions}`
  );
  await writeFile(
    join(temporary, 'consumer.cjs'),
    `const assert=require('node:assert/strict'),api=require('@math.gl/spatial-index');
${assertions}`
  );
  for (const file of ['consumer.mjs', 'consumer.cjs'])
    execFileSync(process.execPath, [join(temporary, file)], {stdio: 'inherit'});
  await writeFile(
    join(temporary, 'consumer.ts'),
    `import {PointIndex,TriangleBVH} from '@math.gl/spatial-index';
const points=new PointIndex({positions:new Float64Array([0,0]),dimension:2});
const index:number|undefined=points.nearest([0,0])?.index;
const triangle=new TriangleBVH({positions:[]});
const point: [number,number,number]|undefined=triangle.nearest([0,0,0])?.point;
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
      contents: "export {PointIndex} from '@math.gl/spatial-index/boxes';",
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
