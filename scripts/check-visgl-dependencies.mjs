// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {existsSync, readFileSync, readdirSync, realpathSync, statSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

// Check actual resolutions, including transitive packages rather than only direct declarations.
const lock = readFileSync(new URL('../yarn.lock', import.meta.url), 'utf8');
const packages = new Map();
for (const [, name, locator] of lock.matchAll(/^  resolution: "((?:@(?:deck\.gl(?:-community)?|luma\.gl|loaders\.gl|math\.gl|probe\.gl)\/[^@]+)|probe\.gl)@([^"]+)"$/gm)) {
  const versions = packages.get(name) || new Set();
  versions.add(locator);
  packages.set(name, versions);
}
assert.ok(packages.size > 20, 'Expected the complete vis.gl dependency graph');
for (const [name, versions] of packages) {
  assert.equal(versions.size, 1, `${name} has multiple resolutions: ${[...versions]}`);
  if (name.startsWith('@math.gl/')) {
    assert.match([...versions][0], /^workspace:modules\//, `${name} must use this repository`);
  }
}
const root = fileURLToPath(new URL('../', import.meta.url));
const visited = new Set();
function checkInstall(directory) {
  if (!existsSync(directory) || visited.has(directory)) return;
  visited.add(directory);
  for (const name of readdirSync(directory).filter(name => !name.startsWith('.'))) {
    if (name.startsWith('@')) {
      checkInstall(resolve(directory, name));
      continue;
    }
    const packageRoot = resolve(directory, name);
    const manifest = resolve(packageRoot, 'package.json');
    if (!existsSync(manifest)) continue;
    const pkg = JSON.parse(readFileSync(manifest, 'utf8'));
    const resolutions = packages.get(pkg.name);
    if (/^(@(deck\.gl(-community)?|luma\.gl|loaders\.gl|math\.gl|probe\.gl)\/|probe\.gl$)/.test(pkg.name)) {
      assert.ok(resolutions, packageRoot + ' is not in the lockfile');
    }
    if (resolutions) {
      const [locator] = resolutions;
      if (locator.startsWith('workspace:')) {
        assert.equal(realpathSync(packageRoot), realpathSync(resolve(root, locator.slice(10))),
          pkg.name + ' must resolve to the workspace');
      } else {
        assert.equal('npm:' + pkg.version, locator, packageRoot + ' has a stale installed version');
      }
    }
    checkInstall(resolve(packageRoot, 'node_modules'));
  }
}
checkInstall(resolve(root, 'node_modules'));
for (const group of ['modules', 'dev-modules', 'examples']) {
  for (const name of readdirSync(resolve(root, group))) {
    const directory = resolve(root, group, name);
    if (group === 'examples') {
      if (!statSync(directory).isDirectory()) continue;
      for (const example of readdirSync(directory)) checkInstall(resolve(directory, example, 'node_modules'));
    } else checkInstall(resolve(directory, 'node_modules'));
  }
}
checkInstall(resolve(root, 'website/node_modules'));
console.log(`Verified ${packages.size} vis.gl packages: one resolution each; math.gl uses workspaces.`);
