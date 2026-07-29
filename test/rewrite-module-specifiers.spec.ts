import {decode, encode} from '@jridgewell/sourcemap-codec';
import {mkdir, mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import test from 'tape-promise/tape';
import {rewriteModuleSpecifiers} from '../scripts/rewrite-module-specifiers.js';

test('rewriteModuleSpecifiers rewrites output and preserves source maps', async t => {
  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'mathgl-module-specifiers-'));
  const moduleDirectory = path.join(temporaryDirectory, 'module');
  const distDirectory = path.join(moduleDirectory, 'dist');

  try {
    await mkdir(distDirectory, {recursive: true});
    await writeFile(path.join(moduleDirectory, 'package.json'), '{"type":"module"}');
    await writeFile(path.join(distDirectory, 'value.js'), 'export const value = 42;\n');
    await writeFile(
      path.join(distDirectory, 'value.d.ts'),
      'export declare const value: number;\n'
    );

    const output = "export {value} from './value';\n";
    const semicolonColumn = output.indexOf(';');
    const sourceMap = {
      version: 3,
      file: 'index.js',
      sources: ['../src/index.ts'],
      names: [],
      mappings: encode([
        [
          [0, 0, 0, 0],
          [semicolonColumn, 0, 0, semicolonColumn]
        ]
      ])
    };

    await writeFile(path.join(distDirectory, 'index.js'), output);
    await writeFile(path.join(distDirectory, 'index.js.map'), JSON.stringify(sourceMap));
    await writeFile(path.join(distDirectory, 'index.d.ts'), output);
    await writeFile(path.join(distDirectory, 'index.d.ts.map'), JSON.stringify(sourceMap));

    await rewriteModuleSpecifiers([moduleDirectory]);

    t.equal(
      await readFile(path.join(distDirectory, 'index.js'), 'utf8'),
      "export {value} from './value.js';\n",
      'rewrites JavaScript output'
    );
    t.equal(
      await readFile(path.join(distDirectory, 'index.d.ts'), 'utf8'),
      "export {value} from './value.js';\n",
      'rewrites declaration output'
    );

    const rewrittenMap = JSON.parse(
      await readFile(path.join(distDirectory, 'index.js.map'), 'utf8')
    );
    const generatedColumns = decode(rewrittenMap.mappings)[0].map(segment => segment[0]);
    t.deepEqual(
      generatedColumns,
      [0, semicolonColumn + 3],
      'shifts mappings after the inserted extension'
    );

    const loadedModule = await import(pathToFileURL(path.join(distDirectory, 'index.js')).href);
    t.equal(loadedModule.value, 42, 'rewritten ESM loads in Node');
  } finally {
    await rm(temporaryDirectory, {recursive: true, force: true});
  }
});

test('rewriteModuleSpecifiers rejects unresolved output', async t => {
  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'mathgl-module-specifiers-'));
  const moduleDirectory = path.join(temporaryDirectory, 'module');
  const distDirectory = path.join(moduleDirectory, 'dist');

  try {
    await mkdir(distDirectory, {recursive: true});
    await writeFile(path.join(distDirectory, 'index.js'), "export {missing} from './missing';\n");

    try {
      await rewriteModuleSpecifiers([moduleDirectory]);
      t.fail('accepted an unresolved specifier');
    } catch (error) {
      t.ok(
        error instanceof Error && error.message.includes('./missing does not resolve'),
        'reports the unresolved emitted specifier'
      );
    }
  } finally {
    await rm(temporaryDirectory, {recursive: true, force: true});
  }
});
