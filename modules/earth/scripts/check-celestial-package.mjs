// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtemp, mkdir, rm, symlink, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const directory = await mkdtemp(join(tmpdir(), 'math-gl-celestial-'));
try {
  const scope = join(directory, 'node_modules/@math.gl');
  await mkdir(scope, {recursive: true});
  await symlink(join(root, 'modules/earth'), join(scope, 'earth'));
  await writeFile(join(directory, 'package.json'), '{"type":"module"}');
  const assertions = `
const ticks = 1792713600000000001n;
const epoch = celestial.JulianDate.fromUnixTicks(ticks, 'ns', 37);
assert.equal(epoch.toUnixTicks('ns', 37, 'nearest'), ticks);
const frame = new celestial.CelestialFrameTransform([1,0,0,0,1,0,0,0,1], {
  from:'inertial', to:'rotating', epoch,
  rotationRate:[0,1,0,-1,0,0,0,0,0]
});
assert.deepEqual(frame.transformState({position:[2,0,0],velocity:[0,0,0]}).velocity,[0,2,0]);
`;
  await writeFile(join(directory, 'consumer.mjs'), `import assert from 'node:assert/strict';
import * as celestial from '@math.gl/earth/celestial';\n${assertions}`);
  await writeFile(join(directory, 'consumer.cjs'), `const assert = require('node:assert/strict');
const celestial = require('@math.gl/earth/celestial');\n${assertions}`);
  for (const file of ['consumer.mjs', 'consumer.cjs']) {
    execFileSync(process.execPath, [join(directory, file)], {stdio: 'inherit'});
  }
  await writeFile(join(directory, 'consumer.ts'), `
import {JulianDate, CelestialFrameTransform} from '@math.gl/earth/celestial';
import type {CelestialTimeScale, UnixTimeUnit, CartesianState} from '@math.gl/earth/celestial';
const scale: CelestialTimeScale = 'TT';
const unit: UnixTimeUnit = 'ns';
const epoch = JulianDate.fromUnixTicks(0n, unit, 42.184, scale);
const frame = new CelestialFrameTransform([1,0,0,0,1,0,0,0,1], {from:'a',to:'b',epoch});
const state: CartesianState = {position:[1,2,3] as const,velocity:[0,0,0] as const};
frame.transformPosition(state.position);
// @ts-expect-error An explicit scale-minus-UTC offset is required.
JulianDate.fromUnixTicks(0n, 'ns');
// @ts-expect-error Time scales are declared, not timezone labels.
new JulianDate(0, 0, 'UTC');
// @ts-expect-error Snapshots require an explicit epoch.
new CelestialFrameTransform([1,0,0,0,1,0,0,0,1], {from:'a',to:'b'});
// @ts-expect-error Julian coordinates are immutable.
epoch.secondsOfDay = 0;
`);
  await writeFile(join(directory, 'tsconfig.json'), JSON.stringify({compilerOptions: {
    target:'es2020', module:'NodeNext', moduleResolution:'NodeNext',strict:true,
    noEmit:true, skipLibCheck:false, types:[]
  }, include:['consumer.ts']}));
  execFileSync(process.execPath, [join(root,'node_modules/typescript/bin/tsc'), '--project', join(directory,'tsconfig.json')], {stdio:'inherit'});
  const bundle = await build({stdin: {
    contents:"export * from '@math.gl/earth/celestial';", resolveDir:directory
  }, bundle:true, write:false, metafile:true, format:'esm',platform:'browser'});
  const inputs = Object.keys(bundle.metafile.inputs);
  assert.ok(inputs.every(path => path === '<stdin>' || path.includes('/dist/celestial/')), inputs.join('\n'));
  console.log('Celestial ESM/CJS, strict types and dependency-free browser bundle passed.');
} finally {
  await rm(directory, {recursive:true, force:true});
}
