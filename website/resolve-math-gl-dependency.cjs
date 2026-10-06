// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
const {existsSync, realpathSync} = require('node:fs');
const {createRequire} = require('node:module');
const {resolve, sep} = require('node:path');

// Workspace dependencies use source aliases even before dist is built. Installed
// dependency versions (e.g. deck.gl's math.gl 4.x) keep their own package exports.
module.exports = function resolveMathGlDependency(request, context, modulesDir = resolve(__dirname, '../modules')) {
  const from = createRequire(resolve(context, '__math_gl_resolve__.cjs'));
  const packageName = request.split('/').slice(0, 2).join('/');
  for (const searchPath of from.resolve.paths(packageName) || []) {
    const packageDir = resolve(searchPath, packageName);
    if (!existsSync(resolve(packageDir, 'package.json'))) continue;
    if (existsSync(modulesDir) && realpathSync(packageDir).startsWith(`${realpathSync(modulesDir)}${sep}`)) return request;
    return from.resolve(request).replace(/\.cjs$/, '.js');
  }
  // Preserve an actionable module-not-found error for truly missing dependencies.
  return from.resolve(request);
};
