// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import test from 'node:test';
import assert from 'node:assert/strict';
import {unified} from 'unified';
import remarkParse from 'remark-parse';
import bibliography from './bibliography.cjs';
import plugin from './remark-citations.cjs';
const record =
  '@article{example2020, author={Doe, Jane and Smith, John}, title={A {Nested} Title}, year={2020}, doi={10.1000/example}}';
test('BibTeX parses protected titles and validates required metadata and unique keys', () => {
  assert.equal(bibliography.parseBibliography(record).get('example2020').title, 'A Nested Title');
  assert.throws(() => bibliography.parseBibliography(record + '\n' + record), /Duplicate/);
  assert.throws(
    () => bibliography.parseBibliography(record.replace('year={2020},', '')),
    /issued|year/
  );
  assert.throws(
    () => bibliography.parseBibliography(record.replace('doi={10.1000/example}', 'doi={bad}')),
    /DOI/
  );
  assert.throws(() => bibliography.parseBibliography('@article{broken,'));
});
test('citations resolve at both stable and next base paths; unknown keys fail', () => {
  for (const baseUrl of ['/math.gl/', '/math.gl/next/']) {
    const tree = unified()
      .use(remarkParse)
      .parse('[cite](cite:karney2013) and [sections 3–7](cite:karney2024)');
    plugin({baseUrl})(tree, {path: 'example.md'});
    assert.equal(tree.children[0].children[0].url, baseUrl + 'docs/bibliography#karney2013');
    assert.equal(tree.children[0].children[0].children[0].value, 'Karney (2013)');
    assert.equal(tree.children[0].children[2].children[0].value, 'sections 3–7');
  }
  const tree = unified().use(remarkParse).parse('[cite](cite:missing)');
  assert.throws(() => plugin()(tree, {path: 'example.md'}), /example.md: unknown citation missing/);
});
test('code examples do not create citations', () => {
  const tree = unified()
    .use(remarkParse)
    .parse('`[cite](cite:missing)`\n\n```md\n[cite](cite:missing)\n```');
  plugin()(tree, {});
});
test('bibliography output is deterministic and contains stable IDs and DOI links', () => {
  const entries = bibliography.parseBibliography(record);
  const text = bibliography.renderBibliography(entries);
  assert.match(text, /#example2020/);
  assert.match(text, /https:\/\/doi.org\/10.1000\/example/);
  assert.equal(text, bibliography.renderBibliography(entries));
});
test('each citing page receives a deduplicated ordered References section', () => {
  const tree = unified()
    .use(remarkParse)
    .parse('[cite](cite:karney2013) and [again](cite:karney2013)');
  plugin()(tree, {});
  assert.equal(tree.children.at(-2).children[0].value, 'References');
  assert.equal(tree.children.at(-1).type, 'list');
  assert.equal(tree.children.at(-1).ordered, true);
  assert.equal(tree.children.at(-1).children.length, 1);
  assert.match(
    tree.children.at(-1).children[0].children[0].children[0].value,
    /Algorithms for geodesics/
  );
});
test('reference-style Markdown citations also resolve and validate', () => {
  const tree = unified().use(remarkParse).parse('[cite][paper]\n\n[paper]: cite:karney2013');
  plugin()(tree, {});
  assert.equal(tree.children[0].children[0].url, '/docs/bibliography#karney2013');
  assert.throws(
    () => plugin()(unified().use(remarkParse).parse('[cite][paper]\n\n[paper]: cite:unknown'), {}),
    /unknown citation/
  );
});
