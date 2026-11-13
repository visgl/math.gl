// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {resolve} = require('node:path');
const getAliases = require('./math-gl-source-aliases.cjs');

test('public entrypoints resolve to workspace source, including consolidated projection exports', () => {
  const aliases = getAliases();
  assert.equal(aliases['@math.gl/core'], resolve(__dirname, '../modules/core/src/index.ts'));
  assert.equal(aliases['@math.gl/geospatial/projection/core'],
    resolve(__dirname, '../modules/geospatial/src/projection/experimental/core.ts'));
  assert.equal(aliases['@math.gl/geospatial/projection/projections/merc'],
    resolve(__dirname, '../modules/geospatial/src/projection/experimental/entries/projections/merc.ts'));
  assert.ok(Object.keys(aliases).some(name => name.startsWith('@math.gl/expressions')));
  assert.ok(Object.values(aliases).every(path => !path.includes('/dist/')));
});

test('deck.gl custom projections use the repository projection engine', async () => {
  const {build} = require('esbuild');
  const {mkdtempSync, rmSync} = require('node:fs');
  const {tmpdir} = require('node:os');
  const {pathToFileURL} = require('node:url');
  const directory = mkdtempSync(resolve(tmpdir(), 'math-gl-deck-projection-'));
  const outfile = resolve(directory, 'projection.mjs');
  const aliases = getAliases();
  try {
    const result = await build({
      stdin: {
        contents: `
          import {_CustomProjectionView} from '@deck.gl/core';
          import {projectionEngine} from '@math.gl/geospatial/projection';
          export async function check() {
            const crs = '+proj=aea +lat_1=29.5 +lat_2=45.5 +lat_0=23 +lon_0=-96 +datum=WGS84 +units=m';
            const view = new _CustomProjectionView({id: 'albers', crs});
            const getCRS = projectionEngine.getCRS.bind(projectionEngine);
            let descriptor;
            projectionEngine.getCRS = async (...args) => {
              descriptor = await getCRS(...args);
              return descriptor;
            };
            try { await view.initialize(); } finally { projectionEngine.getCRS = getCRS; }
            const viewport = view.makeViewport({width: 800, height: 600,
              viewState: {center: [-96, 38, 0], zoom: 3}});
            return {sameEngine: viewport.crs === descriptor,
              roundTrip: viewport.unprojectPosition(viewport.projectPosition([-100, 40, 0]))};
          }`,
        resolveDir: resolve(__dirname, '..')
      },
      outfile,
      bundle: true,
      platform: 'node',
      format: 'esm',
      metafile: true,
      plugins: [{name: 'workspace-source', setup(builder) {
        builder.onResolve({filter: /^@math\.gl\//}, args => ({path: aliases[args.path]}));
      }}]
    });
    assert.ok(Object.keys(result.metafile.inputs).some(path => path.includes('modules/geospatial/src/')));
    assert.ok(!Object.keys(result.metafile.inputs).some(path => path.includes('node_modules/@math.gl/')));
    const {sameEngine, roundTrip} = await (await import(pathToFileURL(outfile))).check();
    assert.equal(sameEngine, true, 'deck.gl and the application must share the projection engine');
    assert.ok(Math.abs(roundTrip[0] + 100) < 1e-7);
    assert.ok(Math.abs(roundTrip[1] - 40) < 1e-7);
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
});
