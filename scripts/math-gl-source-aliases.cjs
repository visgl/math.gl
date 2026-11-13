// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
const {existsSync, readdirSync, readFileSync} = require('node:fs');
const {resolve} = require('node:path');

/** Resolve every public workspace entry point to source, including dependency imports. */
module.exports = function getMathGlSourceAliases() {
  const modules = resolve(__dirname, '../modules');
  const aliases = {};
  for (const directory of readdirSync(modules)) {
    const root = resolve(modules, directory);
    if (!existsSync(resolve(root, 'package.json'))) continue;
    const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
    for (const [subpath, entry] of Object.entries(pkg.exports)) {
      const published = typeof entry === 'string' ? entry : entry.import;
      const source = (typeof entry === 'object' && entry.source) ||
        published.replace(/^\.\/dist\//, './src/').replace(/\.js$/, '.ts');
      const target = resolve(root, source);
      if (!existsSync(target)) throw new Error(`Missing source for ${pkg.name}${subpath.slice(1)}`);
      aliases[pkg.name + (subpath === '.' ? '' : subpath.slice(1))] = target;
    }
  }
  return aliases;
};
