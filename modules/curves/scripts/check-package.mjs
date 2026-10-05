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
const temporary = await mkdtemp(join(tmpdir(), 'math-gl-curves-'));
try {
  const scope = join(temporary, 'node_modules/@math.gl');
  await mkdir(scope, {recursive: true});
  await symlink(join(root, 'modules/curves'), join(scope, 'curves'));
  await symlink(join(root, 'modules/types'), join(scope, 'types'));
  await writeFile(join(temporary, 'package.json'), '{"type":"module"}');
  const assertions = `
const curve = new curves.CubicBezierCurve([0, 0], [0, 1], [0, 1], [1, 0]);
assert.deepEqual(curve.getPoint(0.5), [0.125, 0.75]);
assert.deepEqual(curve.getDerivative(0.5), [0.75, 0]);
const table = new curves.CurveArcLength(new curves.LineCurve([0, 0], [3, 4]));
assert.equal(table.length, 5);
`;
  await writeFile(
    join(temporary, 'consumer.mjs'),
    `import assert from 'node:assert/strict';
import * as curves from '@math.gl/curves';
${assertions}`
  );
  await writeFile(
    join(temporary, 'consumer.cjs'),
    `const assert = require('node:assert/strict');
const curves = require('@math.gl/curves');
${assertions}`
  );
  for (const filename of ['consumer.mjs', 'consumer.cjs']) {
    execFileSync(process.execPath, [join(temporary, filename)], {stdio: 'inherit'});
  }
  await writeFile(
    join(temporary, 'consumer.ts'),
    `
import {Curve, CubicBezierCurve, CatmullRomCurve, CurveArcLength} from '@math.gl/curves';
import type {NumericArray} from '@math.gl/types';
const curve = new CubicBezierCurve([0, 0] as const, new Float64Array(2), [1, 2], [3, 4]);
const point: number[] = curve.getPoint(0.5);
const output: Float64Array = curve.getPoint(0.5, new Float64Array(2));
const derivative: Float32Array = curve.getDerivative(0.5, new Float32Array(2));
const tangent: number[] = curve.getTangent(0.5, [0, 0]);
const table = new CurveArcLength(curve);
const at: Float64Array = table.getPointAt(0.5, output);
const samples: Float64Array = table.getSpacedPoints();
class CustomCurve extends Curve {
  constructor() { super(2); }
  protected evaluate(t: number, result: NumericArray, derivative: boolean): void {
    result[0] = derivative ? 1 : t;
    result[1] = 0;
  }
}
void [point, derivative, tangent, at, samples, new CustomCurve()];
// @ts-expect-error curve parameters are numbers
curve.getPoint('0.5');
// @ts-expect-error output element type must be numeric
curve.getPoint(0.5, ['a', 'b']);
// @ts-expect-error parameterization has a closed set of values
new CatmullRomCurve([[0, 0], [1, 1]], {parameterization: 'invalid'});
`
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
        skipLibCheck: false,
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
    stdin: {contents: "export {LineCurve} from '@math.gl/curves';", resolveDir: temporary},
    bundle: true,
    format: 'esm',
    platform: 'browser',
    write: false,
    treeShaking: true
  });
  const source = bundle.outputFiles[0].text;
  assert(!source.includes('CatmullRomCurve'), 'LineCurve imports must exclude spline code');
  assert(!source.includes('CurveArcLength'), 'LineCurve imports must exclude arc-length tables');
} finally {
  await rm(temporary, {recursive: true, force: true});
}
