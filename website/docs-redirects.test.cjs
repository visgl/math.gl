// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
const assert = require('node:assert/strict');
const {mkdtemp, readFile, rm} = require('node:fs/promises');
const {tmpdir} = require('node:os');
const {join} = require('node:path');
const {test} = require('node:test');
const {runInNewContext} = require('node:vm');
const docsRedirects = require('./docs-redirects.cjs');

test('guide redirects preserve queries and prefer destination fragments', async () => {
  const outDir = await mkdtemp(join(tmpdir(), 'math-gl-redirects-'));
  try {
    await docsRedirects({baseUrl: '/math.gl/'}).postBuild({outDir});
    for (const [guide, hash, expected] of [
      ['external-frameworks', '', 'modules/core?source=bookmark#interoperability'],
      ['external-frameworks', '#old-heading', 'modules/core?source=bookmark#interoperability'],
      ['math/transformations', '#inspect-a-transform', 'modules/core/developer-guide/transformations?source=bookmark#inspect-a-transform'],
      ['math/transformations', '', 'modules/core/developer-guide/transformations?source=bookmark']
    ]) {
      const html = await readFile(join(outDir, `docs/developer-guide/${guide}.html`), 'utf8');
      const script = html.match(/<script>(.*?)<\/script>/)[1];
      let redirected;
      runInNewContext(script, {
        URL,
        location: {
          href: `https://math.gl/math.gl/docs/developer-guide/${guide}?source=bookmark${hash}`,
          search: '?source=bookmark',
          hash,
          replace(value) { redirected = value; }
        }
      });
      assert.equal(redirected, `https://math.gl/math.gl/docs/${expected}`);
    }
  } finally {
    await rm(outDir, {recursive: true, force: true});
  }
});
