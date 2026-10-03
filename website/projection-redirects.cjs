// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
const {mkdir, writeFile} = require('node:fs/promises');
const {dirname, join} = require('node:path');

// Keep links to the former alpha module working on the deployed documentation site.
module.exports = function projectionRedirects(context) {
  return {
    name: 'projection-module-redirects',
    async postBuild({outDir, routesPaths}) {
      const prefix = context.baseUrl + 'docs/modules/projection';
      const renamedPages = {
        '/projection-engine': '/typescript-engine',
        '/support': '/typescript-support',
        '/api-reference/projection-engine': '/api-reference/typescript-projection',
        '/api-reference/projection': '/api-reference/proj4-projection'
      };
      for (const route of routesPaths) {
        if (route !== prefix && !route.startsWith(prefix + '/')) continue;
        const suffix = route.slice(prefix.length).replace(/\/$/, '');
        const oldSuffix = renamedPages[suffix] || suffix;
        const oldRoute = context.baseUrl + 'docs/modules/proj4' + oldSuffix;
        const target = JSON.stringify(route);
        const file = join(outDir, oldRoute.slice(context.baseUrl.length) + '.html');
        await mkdir(dirname(file), {recursive: true});
        await writeFile(
          file,
          `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Projection documentation moved</title><link rel="canonical" href="${route}"><meta http-equiv="refresh" content="0;url=${route}"><script>location.replace(${target}+location.search+location.hash);</script></head><body><a href="${route}">Continue to the projection documentation</a></body></html>`
        );
      }
    }
  };
};
