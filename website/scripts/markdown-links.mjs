// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {unified} from 'unified';
import remarkParse from 'remark-parse';

const parser = unified().use(remarkParse);

export function extractMarkdownLinks(markdown) {
  const tree = parser.parse(markdown);
  const definitions = new Map();
  const links = [];

  function visit(node, callback) {
    callback(node);
    for (const child of node.children || []) visit(child, callback);
  }

  // References can precede their definitions; CommonMark uses the first definition.
  visit(tree, node => {
    if (node.type === 'definition' && !definitions.has(node.identifier)) {
      definitions.set(node.identifier, node.url);
    }
  });
  visit(tree, node => {
    if (node.type === 'link' || node.type === 'image') {
      links.push(node.url);
    } else if (node.type === 'linkReference' || node.type === 'imageReference') {
      const url = definitions.get(node.identifier);
      if (url !== undefined) links.push(url);
    }
  });
  return links;
}
