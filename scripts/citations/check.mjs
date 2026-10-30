// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {unified} from 'unified';
import remarkParse from 'remark-parse';
import bibliography from './bibliography.cjs';
import plugin from './remark-citations.cjs';
const root = fileURLToPath(new URL('../../', import.meta.url));
const entries = bibliography.readBibliography();
const generated = bibliography.renderBibliography(entries);
const output = path.join(root, 'docs/bibliography.md');
const exports = {
  'references.bib': fs.readFileSync(bibliography.bibliographyPath, 'utf8'),
  'references.json': JSON.stringify([...entries.values()], null, 2) + '\n'
};
for (const [name, content] of Object.entries(exports)) {
  const target = path.join(root, 'website/static', name);
  if (process.argv.includes('--write')) fs.writeFileSync(target, content);
  if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== content) {
    throw new Error(name + ' is stale. Run yarn citations:generate.');
  }
}
if (process.argv.includes('--write')) fs.writeFileSync(output, generated);
if (!fs.existsSync(output) || fs.readFileSync(output, 'utf8') !== generated) {
  throw new Error('Bibliography is stale. Run yarn citations:generate.');
}
let count = 0;
function walk(directory) {
  for (const item of fs.readdirSync(directory, {withFileTypes: true})) {
    const file = path.join(directory, item.name);
    if (item.isDirectory()) walk(file);
    else if (/\.mdx?$/.test(file)) {
      const tree = unified().use(remarkParse).parse(fs.readFileSync(file, 'utf8'));
      plugin.visitCitations(tree, (_, key) => {
        if (!entries.has(key))
          throw new Error(`${path.relative(root, file)}: unknown citation ${key}`);
        count++;
      });
    }
  }
}
walk(path.join(root, 'docs'));
walk(path.join(root, 'website/src/examples'));
console.log(`Validated ${entries.size} BibTeX records and ${count} citations.`);
