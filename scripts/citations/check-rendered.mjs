// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import bibliography from './bibliography.cjs';
const root = fileURLToPath(new URL('../../website/build/', import.meta.url));
const baseUrl = process.env.WEBSITE_BASE_URL || '/math.gl/';
const html = fs.readFileSync(path.join(root, 'docs/bibliography.html'), 'utf8');
const entries = bibliography.readBibliography();
const ids = new Set([...html.matchAll(/\bid=(?:"([^"]*)"|([^\s>]+))/g)].map(m => m[1] || m[2]));
for (const key of entries.keys())
  assert(ids.has(key), `Missing rendered bibliography anchor ${key}`);
let citations = 0;
function walk(directory) {
  for (const item of fs.readdirSync(directory, {withFileTypes: true})) {
    const file = path.join(directory, item.name);
    if (item.isDirectory()) walk(file);
    else if (file.endsWith('.html')) {
      const text = fs.readFileSync(file, 'utf8');
      for (const match of text.matchAll(/href=(?:"([^"]*)"|([^\s>]+))/g)) {
        const href = match[1] || match[2];
        assert(!href.startsWith('cite:'), `Unresolved citation in ${file}`);
        if (href.includes('/docs/bibliography#')) {
          assert(
            href.startsWith(baseUrl + 'docs/bibliography#'),
            `Wrong citation base URL: ${href}`
          );
          assert(ids.has(href.split('#')[1]), `Broken citation anchor: ${href}`);
          citations++;
        }
      }
    }
  }
}
walk(root);
assert(citations > 0, 'No rendered citations found');
assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, 'references.json'), 'utf8')), [
  ...entries.values()
]);
assert.equal(
  fs.readFileSync(path.join(root, 'references.bib'), 'utf8'),
  fs.readFileSync(bibliography.bibliographyPath, 'utf8')
);
console.log(
  `Verified ${citations} rendered citation links, ${ids.size} anchors, and bibliography downloads at ${baseUrl}.`
);
