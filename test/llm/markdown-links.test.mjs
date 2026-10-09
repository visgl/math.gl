// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {test} from 'node:test';
import {extractMarkdownLinks} from '../../website/scripts/markdown-links.mjs';

test('collects image-wrapped links and nested inline labels', () => {
  assert.deepEqual(
    extractMarkdownLinks('[![Preview](preview.png)](missing.md) and [**API** `reference`](api.md)'),
    ['missing.md', 'preview.png', 'api.md']
  );
});

test('ignores fenced, indented and inline code examples', () => {
  assert.deepEqual(
    extractMarkdownLinks(
      [
        '```md',
        '[label](missing.md)',
        '```',
        '',
        '    [label](indented.md)',
        '',
        '`[label](inline.md)` and [real](exists.md)'
      ].join('\n')
    ),
    ['exists.md']
  );
});

test('resolves full, collapsed, shortcut and image references regardless of definition order', () => {
  assert.deepEqual(
    extractMarkdownLinks(
      [
        '[Full][API] [api][] [api] ![Preview][image]',
        '',
        '[api]: <reference.md> "API title"',
        '[image]: preview.png',
        '[unused]: unused.md',
        '[api]: ignored.md'
      ].join('\n')
    ),
    ['reference.md', 'reference.md', 'reference.md', 'preview.png']
  );
});

test('handles angle-bracket destinations and balanced parentheses', () => {
  assert.deepEqual(
    extractMarkdownLinks('[spaced](<file name.md>) [nested](api(v2).md) [escaped](api\\(v3\\).md)'),
    ['file name.md', 'api(v2).md', 'api(v3).md']
  );
});
