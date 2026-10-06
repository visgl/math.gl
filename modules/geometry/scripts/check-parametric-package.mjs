// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, cp, copyFile, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {build} from 'esbuild';
const root = fileURLToPath(new URL('../../../', import.meta.url));
const temporary = await mkdtemp(join(tmpdir(), 'math-gl-parametric-'));
try {
  const scope = join(temporary, 'node_modules/@math.gl');
  await mkdir(scope, {recursive: true});
  for (const name of ['geometry', 'types']) {
    await mkdir(join(scope, name));
    const source =
      name === 'types' ? join(root, 'node_modules/@math.gl/types') : join(root, 'modules/geometry');
    await cp(join(source, 'dist'), join(scope, name, 'dist'), {recursive: true});
    await copyFile(join(source, 'package.json'), join(scope, name, 'package.json'));
  }
  await writeFile(join(temporary, 'package.json'), '{"type":"module"}');
  const checks = `assert.equal(new api.TorusGeometry().topology,'triangle-list');
assert.equal(new api.LatheGeometry({points:[[1,0],[1,1]]}).attributes.POSITION.size,3);
assert.equal(new api.ParametricGeometry({uSegments:1,vSegments:1,sample:(u,v)=>[u,v,0]}).vertexCount,6);`;
  await writeFile(
    join(temporary, 'consumer.mjs'),
    `import assert from 'node:assert/strict';import * as api from '@math.gl/geometry/parametric';${checks}`
  );
  await writeFile(
    join(temporary, 'consumer.cjs'),
    `const assert=require('node:assert/strict'),api=require('@math.gl/geometry/parametric');${checks}`
  );
  for (const file of ['consumer.mjs', 'consumer.cjs'])
    execFileSync(process.execPath, [join(temporary, file)], {stdio: 'inherit'});
  await writeFile(
    join(temporary, 'consumer.ts'),
    `import {ParametricGeometry,TorusGeometry,LatheGeometry,type SurfaceSampler} from '@math.gl/geometry/parametric';
const sample:SurfaceSampler=(u,v)=>new Float64Array([u,v,0]);new ParametricGeometry({sample});new TorusGeometry();new LatheGeometry({points:[[1,0],[1,1]]});`
  );
  execFileSync(
    process.execPath,
    [
      join(root, 'node_modules/typescript/bin/tsc'),
      '--strict',
      '--noEmit',
      '--module',
      'NodeNext',
      '--moduleResolution',
      'NodeNext',
      '--target',
      'ES2020',
      join(temporary, 'consumer.ts')
    ],
    {stdio: 'inherit', cwd: temporary}
  );
  const bundle = await build({
    entryPoints: [join(root, 'modules/geometry/src/index.ts')],
    bundle: true,
    write: false,
    metafile: true,
    format: 'esm'
  });
  assert.ok(Object.keys(bundle.metafile.inputs).every(path => !path.includes('/parametric/')));
  console.log('Parametric ESM, CommonJS, public types and root isolation passed');
} finally {
  await rm(temporary, {recursive: true, force: true});
}
