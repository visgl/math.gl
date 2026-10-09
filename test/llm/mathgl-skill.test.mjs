// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';

const root = new URL('../../', import.meta.url);
const skillUrl = new URL('skills/mathgl/SKILL.md', root);
const skill = readFileSync(skillUrl, 'utf8');

test('skill metadata and local references are usable', () => {
  assert.match(skill, /^---\nname: mathgl\ndescription: .+\n---\n/);
  const references = [...skill.matchAll(/\]\((references\/[^)]+)\)/g)];
  assert.ok(references.length > 0);
  for (const [, reference] of references) {
    assert.ok(existsSync(new URL(reference, skillUrl)), reference);
  }
});

test('offline evaluation cases have distinct IDs and existing canonical sources', () => {
  const cases = JSON.parse(readFileSync(new URL('test/llm/mathgl-skill-evals.json', root)));
  assert.ok(cases.length > 0);
  const ids = new Set();
  for (const item of cases) {
    assert.ok(item.id && !ids.has(item.id));
    ids.add(item.id);
    assert.ok(item.prompt && item.expected.length && item.sources.length);
    for (const source of item.sources) {
      assert.ok(!source.startsWith('/') && !source.split('/').includes('..'));
      assert.ok(existsSync(new URL(source, root)), fileURLToPath(new URL(source, root)));
    }
  }
});
