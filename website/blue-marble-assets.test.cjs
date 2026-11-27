// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
const assert = require('node:assert/strict');
const {mkdtemp, readFile, rm} = require('node:fs/promises');
const {tmpdir} = require('node:os');
const {join, resolve} = require('node:path');
const {test} = require('node:test');
const webpack = require('webpack');
const {getFileLoaderUtils} = require('@docusaurus/utils');

test('the website Blue Marble URL serves the original JPEG bytes', async () => {
  const output = await mkdtemp(join(tmpdir(), 'math-gl-blue-marble-'));
  const compiler = webpack({
    mode: 'production',
    target: 'node',
    entry: resolve(__dirname, '../examples/common/blue-marble.js'),
    output: {
      path: output,
      filename: 'overview.cjs',
      library: {type: 'commonjs2'},
      publicPath: '/math.gl/next/'
    },
    module: {rules: [getFileLoaderUtils(false).rules.images()]}
  });
  try {
    await new Promise((resolveBuild, reject) => {
      compiler.run((error, stats) => {
        if (error) reject(error);
        else if (stats.hasErrors()) reject(new Error(stats.toString({all: false, errors: true})));
        else resolveBuild();
      });
    });
    const {BLUE_MARBLE_OVERVIEW_URL: url} = require(join(output, 'overview.cjs'));
    assert.ok(url.startsWith('/math.gl/next/'));
    const emitted = await readFile(join(output, url.slice('/math.gl/next/'.length)));
    const original = await readFile(
      resolve(__dirname, '../examples/common/assets/blue-marble.jpg')
    );
    assert.deepEqual(
      emitted,
      original,
      'the URL must point to JPEG data rather than loader JavaScript'
    );
  } finally {
    await new Promise((resolveClose, reject) =>
      compiler.close((error) => (error ? reject(error) : resolveClose()))
    );
    await rm(output, {recursive: true, force: true});
  }
});
