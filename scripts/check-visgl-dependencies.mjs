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
/**
 * Published versions consumed by pinned deck.gl, luma.gl and loaders.gl packages.
 * Their old imports resolve through their own dependency tree.
 */
const publishedVersions = new Map([
  ['@math.gl/core', ['5.0.0-beta.8', '5.0.0-beta.10', '5.0.0-beta.11']],
  ['@math.gl/dggs', ['5.0.0-beta.8']],
  ['@math.gl/earth', ['5.0.0-beta.8']],
  ['@math.gl/geospatial', ['5.0.0-beta.8']],
  ['@math.gl/geometry', ['5.0.0-beta.8', '5.0.0-beta.10', '5.0.0-beta.11']],
  ['@math.gl/expressions', ['5.0.0-beta.10']],
  ['@math.gl/arrow', ['5.0.0-beta.11']],
  ['@math.gl/web-mercator', ['5.0.0-beta.8']]
]);
const workspacePackages = new Set(['core', 'dggs', 'earth', 'geospatial', 'geometry', 'sql', 'tasks']);
for (const [name, versions] of packages) {
  if (!name.startsWith('@math.gl/')) {
    assert.equal(versions.size, 1, `${name} has multiple resolutions: ${[...versions]}`);
    continue;
  }
  const module = name.split('/')[1];
  const expected = (publishedVersions.get(name) || []).map(version => 'npm:' + version);
  if (workspacePackages.has(module)) expected.push('workspace:modules/' + module);
  assert.deepEqual(versions, new Set(expected), `${name} has unexpected resolutions`);
}
const root = fileURLToPath(new URL('../', import.meta.url));
for (const name of workspacePackages) {
  assert.equal(
    realpathSync(resolve(root, 'node_modules/@math.gl', name)),
    realpathSync(resolve(root, 'modules', name)),
    `Root @math.gl/${name} must resolve to the workspace`
  );
}
const visited = new Set();
/** Verifies installed package locations and versions recursively. */
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
      const installedLocator = [...resolutions].find(locator =>
        locator.startsWith('workspace:') &&
        realpathSync(packageRoot) === realpathSync(resolve(root, locator.slice('workspace:'.length)))
      ) || 'npm:' + pkg.version;
      assert(resolutions.has(installedLocator), packageRoot + ' has a stale installed version');
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
console.log(`Verified ${packages.size} vis.gl packages and pinned legacy dependencies.`);
