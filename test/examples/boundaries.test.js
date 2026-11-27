// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {test} from 'node:test';
import {checkExampleBoundaries} from './check-boundaries.js';

function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), 'math-example-boundaries-'));
  const root = join(directory, 'examples');
  mkdirSync(join(root, 'common'), {recursive: true});
  t.after(() => rmSync(directory, {recursive: true, force: true}));
  const write = (name, text) => {
    const file = join(root, name);
    mkdirSync(dirname(file), {recursive: true});
    writeFileSync(file, text);
    return file;
  };
  const project = (name, dependencies = {}) =>
    write(`group/${name}/package.json`, JSON.stringify({name, dependencies}));
  return {root, write, project};
}

test('accepts own files, declared packages, builtins, and common helpers', t => {
  const {root, write, project} = fixture(t);
  project('app', {'@scope/ui': '*', engine: '*'});
  write('group/app/index.html', '<script type="module">import "./src/main.js";</script>');
  write(
    'group/app/src/main.js',
    'import "../../../common/helper.js"; const name = "engine"; import(name); new Worker(new URL("./worker.js", import.meta.url));'
  );
  write('group/app/src/worker.js', 'import "node:util";');
  write('common/helper.js', 'export {value} from "@scope/ui/controls"; import "./style.css";');
  write('common/style.css', 'div {background:url(./asset.svg)}');
  write('common/asset.svg', '<svg/>');
  assert.deepEqual(checkExampleBoundaries(root), {projects: 1, issues: []});
});

test('rejects sibling/website imports, undeclared packages, and remote module imports', t => {
  const {root, write, project} = fixture(t);
  project('app');
  project('other');
  write('group/other/src/helper.js', 'export const value = 1;');
  write('../website/frame.js', 'export default 1;');
  write(
    'group/app/src/main.js',
    'export * from "../../other/src/helper.js"; import "../../../../website/frame.js"; import "missing/subpath"; import("https://example.com/module.js");'
  );
  const {issues} = checkExampleBoundaries(root);
  assert.equal(issues.length, 4);
  assert.equal(issues.filter(issue => issue.reason.startsWith('Import is outside')).length, 2);
  assert(issues.some(issue => issue.reason.includes('missing')));
  assert(issues.some(issue => issue.reason.includes('Module URLs')));
});

test('checks common dependencies separately for each consumer', t => {
  const {root, write, project} = fixture(t);
  project('declared', {'@scope/ui': '*'});
  project('missing');
  for (const name of ['declared', 'missing'])
    write(`group/${name}/src/main.js`, 'import "../../../common/helper.js";');
  write('common/helper.js', 'import "@scope/ui";');
  const {issues} = checkExampleBoundaries(root);
  assert.equal(issues.length, 1);
  assert.equal(issues[0].project, 'group/missing');
  assert.equal(issues[0].file, 'common/helper.js');
});

test('checks CSS imports, inline HTML modules, JSDoc types, and symlink targets', t => {
  const {root, write, project} = fixture(t);
  project('app');
  write('group/app/src/style.css', '@import "../../../../website/style.css";');
  write('../website/style.css', 'div{}');
  write('group/app/index.html', '<script type="module">import "missing-inline";</script>');
  write('group/app/src/types.js', '/** @type {import("missing-types").Value} */ let value;');
  const external = write('../website/module.js', 'export default 1;');
  symlinkSync(external, join(root, 'group/app/src/linked.js'));
  write('group/app/src/main.js', 'import "./linked.js";');
  const {issues} = checkExampleBoundaries(root);
  assert.equal(issues.length, 4);
  assert(issues.some(issue => issue.specifier === 'missing-types'));
});

test('rejects mutable and parameter-based dynamic imports without confusing outer constants', t => {
  const {root, write, project} = fixture(t);
  project('app', {engine: '*'});
  write(
    'group/app/main.js',
    'const name = "engine"; function load(name) { return import(name); } import(name); let other = "engine"; import(other);'
  );
  const {issues} = checkExampleBoundaries(root);
  assert.equal(issues.length, 2);
  assert(issues.every(issue => issue.reason === 'Cannot verify a computed module import'));
});
