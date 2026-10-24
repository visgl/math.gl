// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {readFileSync, readdirSync, existsSync} from 'node:fs';
import {resolve, dirname, basename} from 'node:path';
import {fileURLToPath} from 'node:url';

// Check locally resolvable provenance, independently of network availability.
// This validates the inventory; it cannot discover unattributed copied code.
const errors = [];
const read = path => readFileSync(path, 'utf8');
const assert = (condition, message) => {
  if (!condition) errors.push(message);
};
function* files(directory) {
  for (const item of readdirSync(directory, {withFileTypes: true})) {
    const path = resolve(directory, item.name);
    if (item.isDirectory()) yield* files(path);
    else yield path;
  }
}
const modules = fileURLToPath(new URL('../modules/', import.meta.url));
let packages = 0,
  references = 0;
for (const module of readdirSync(modules)) {
  const root = resolve(modules, module);
  if (!existsSync(resolve(root, 'package.json'))) continue;
  const manifest = JSON.parse(read(resolve(root, 'package.json')));
  if (manifest.private) continue;
  packages++;
  const packaged = manifest.files ?? [];
  const notice = resolve(root, 'THIRD-PARTY-NOTICES.md');
  assert(existsSync(notice), `${module}: missing notice index`);
  assert(packaged.includes('THIRD-PARTY-NOTICES.md'), `${module}: notice index not packaged`);
  assert(packaged.includes('LICENSE'), `${module}: package license not packaged`);
  if (existsSync(notice)) {
    for (const match of read(notice).matchAll(/\]\((\.\.?\/[^)#]+)(?:#[^)]*)?\)/g)) {
      const target = resolve(root, match[1]);
      references++;
      assert(existsSync(target), `${module}: missing ${match[1]}`);
      const relative = match[1].replace(/^\.\//, '');
      assert(
        packaged.some(entry => relative === entry || relative.startsWith(`${entry}/`)),
        `${module}: notice target not in package files: ${relative}`
      );
    }
  }
  for (const path of files(resolve(root, 'src'))) {
    if (!/\.[jt]s$/.test(path)) continue;
    const header = read(path).split('\n').slice(0, 30).join('\n');
    for (const match of header.matchAll(
      /(?:\.\.\/)+(?:[A-Za-z0-9_./-]*)(?:LICENSE|NOTICES)[A-Za-z0-9_.-]*/g
    )) {
      const relative = match[0].replace(/\.$/, '');
      references++;
      assert(
        existsSync(resolve(dirname(path), relative)),
        `${module}/${basename(path)}: stale ${relative}`
      );
    }
  }
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else
  console.log(
    `Attribution links and package declarations checked: ${packages} packages, ${references} references.`
  );
