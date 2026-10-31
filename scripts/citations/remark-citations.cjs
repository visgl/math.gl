// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
const {readBibliography, label, authorName, sourceUrl} = require('./bibliography.cjs');

function visitCitations(tree, callback) {
  const definitions = new Map();
  function collect(node) {
    if (node.type === 'definition') definitions.set(node.identifier, {url: node.url, title: node.title});
    for (const child of node.children || []) collect(child);
  }
  collect(tree);
  function visit(node) {
    const link = node.type === 'linkReference' ? definitions.get(node.identifier) : node;
    const marker = link?.title;
    if (link?.url?.startsWith('cite:')) {
      throw new Error('Citation links must use an HTTP(S) source URL and a cite: title');
    }
    if ((node.type === 'link' || node.type === 'linkReference') && marker?.startsWith('cite:')) {
      if (!/^https?:\/\//.test(link.url)) throw new Error('Citation source URL must use HTTP(S)');
      node.type = 'link';
      node.url = link.url;
      delete node.identifier;
      delete node.referenceType;
      delete node.label;
      callback(node, marker.slice(5));
    }
    for (const child of node.children || []) visit(child);
  }
  visit(tree);
}
function referenceItem(entry) {
  const authors = entry.author.map(a => authorName(a)).join(', ');
  const venue = [
    entry['container-title'] || entry.publisher,
    entry.volume,
    entry.issue ? `(${entry.issue})` : '',
    entry.page
  ]
    .filter(Boolean)
    .join(', ');
  const text = `${authors} (${entry.issued['date-parts'][0][0]}). ${entry.title.replace(/<[^>]*>/g, '')}. ${venue ? venue + '. ' : ''}`;
  const children = [{type: 'text', value: text}];
  if (entry.DOI)
    children.push({
      type: 'link',
      url: `https://doi.org/${entry.DOI}`,
      children: [{type: 'text', value: `doi:${entry.DOI}`}]
    });
  if (sourceUrl(entry))
    children.push(
      {type: 'text', value: ' '},
      {type: 'link', url: entry.URL, children: [{type: 'text', value: 'Source'}]}
    );
  return {type: 'listItem', spread: false, children: [{type: 'paragraph', children}]};
}
function remarkCitations({baseUrl = '/'} = {}) {
  // Read on each compilation so edits in development cannot leave stale metadata.
  return (tree, file) => {
    const entries = readBibliography();
    const cited = new Map();
    visitCitations(tree, (node, key) => {
      const entry = entries.get(key);
      if (!entry) throw new Error(`${file.path || 'Markdown'}: unknown citation ${key}`);
      node.url = `${baseUrl.replace(/\/$/, '')}/docs/bibliography#${key}`;
      if (node.children.length === 1 && node.children[0].value === 'cite') {
        node.children = [{type: 'text', value: label(entry)}];
      }
      cited.set(key, entry);
      node.title = entry.title.replace(/<[^>]*>/g, '');
    });
    if (cited.size) {
      tree.children.push({
        type: 'heading',
        depth: 2,
        children: [{type: 'text', value: 'References'}]
      });
      tree.children.push({
        type: 'list',
        ordered: true,
        start: 1,
        spread: false,
        children: [...cited.values()].map(referenceItem)
      });
    }
  };
}
module.exports = remarkCitations;
module.exports.visitCitations = visitCitations;

module.exports.referenceItem = referenceItem;
