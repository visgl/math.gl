// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {selectProfile} from './ci-profile.mjs';
import {checkResults} from './ci-gate.mjs';

const workflow = readFileSync(new URL('../.github/workflows/test.yml', import.meta.url), 'utf8');

test('ordinary PRs retain Chromium; nightly and manual runs exercise the full matrix', () => {
  for (const event of ['pull_request', 'push'])
    assert.deepEqual(selectProfile(event, ['modules/core/src/vector3.ts']), {
      full: false,
      browsers: ['chromium']
    });
  for (const event of ['schedule', 'workflow_dispatch'])
    assert.deepEqual(selectProfile(event), {
      full: true,
      browsers: ['chromium', 'firefox', 'webkit']
    });
});

test('changes to qualification definitions and shared tooling validate the full path on PRs', () => {
  for (const path of [
    '.github/workflows/test.yml',
    'scripts/ci-profile.mjs',
    'scripts/ci-gate.mjs',
    'scripts/ci.test.mjs',
    '.nvmrc',
    '.yarnrc.yml',
    'yarn.lock',
    'package.json',
    'vitest.config.ts',
    '.ocularrc.js',
    'test/utils/test-setup.ts',
    'modules/geospatial/projection/scripts/scorecard.mjs',
    'modules/geospatial/scripts/qualify-c8.mjs',
    'modules/geospatial/projection/test/benchmark-entry.ts',
    'modules/geospatial/projection/test/native-forward-reference.ts',
    'modules/geospatial/projection/test/fixtures/accuracy-cases.json'
  ])
    assert.equal(selectProfile('pull_request', [path]).full, true, path);
});

function results(event, full) {
  return Object.fromEntries(
    [
      'plan',
      'build',
      'checks',
      'examples',
      'coverage',
      'website',
      'node-tests',
      'projection-browsers',
      'projection-performance',
      'scorecard'
    ].map(name => [
      name,
      {
        result:
          (name === 'scorecard' && !full) ||
          (name === 'projection-performance' && event !== 'pull_request')
            ? 'skipped'
            : 'success',
        ...(name === 'plan' ? {outputs: {full: String(full)}} : {})
      }
    ])
  );
}

test('aggregate gate rejects a failed, cancelled, missing or unexpectedly skipped worker', () => {
  for (const [event, full] of [
    ['pull_request', false],
    ['pull_request', true],
    ['push', false],
    ['schedule', true],
    ['workflow_dispatch', true]
  ]) {
    const needs = results(event, full);
    assert.deepEqual(checkResults(needs, event), []);
    for (const name of Object.keys(needs))
      for (const result of ['failure', 'cancelled', 'skipped', 'success', undefined]) {
        const changed = structuredClone(needs);
        changed[name].result = result;
        assert.equal(
          checkResults(changed, event).length === 0,
          result === needs[name].result,
          `${event}/${full}/${name}/${result}`
        );
      }
  }
});

test('full qualification cannot silently disappear from scheduled runs', () => {
  assert(checkResults(results('schedule', false), 'schedule').length);
  const needs = results('pull_request', false);
  delete needs.plan.outputs.full;
  assert(checkResults(needs, 'pull_request').length);
});

test('one package build feeds current-run consumers; website stays source-only', () => {
  assert.equal((workflow.match(/run: yarn build$/gm) || []).length, 1);
  for (const job of [
    'checks',
    'examples',
    'coverage',
    'node-tests',
    'projection-browsers',
    'projection-performance',
    'scorecard'
  ]) {
    const section = workflow.split(`\n  ${job}:\n`)[1].split(/\n  [a-z][\w-]*:\n/)[0];
    assert.match(section, /name: Download current-run package build/);
    assert.match(section, /name: package-build/);
    assert.match(section, /run: tar -xf \/tmp\/package-build\/mathgl-build.tar/);
    assert.match(section, /needs:[\s\S]*?- build/);
  }
  const website = workflow.split('\n  website:\n')[1].split('\n  node-tests:\n')[0];
  assert.doesNotMatch(website, /package-build|run: yarn build/);
  assert.match(website, /WEBSITE_BASE_URL: \/math.gl\/next\//);
  assert.match(workflow, /cron: ['"]?17 7 \* \* \*/);
  assert.match(workflow, /run: node scripts\/ci-gate.mjs/);
  assert.match(workflow, /MINIMUM_LINES: 90/);
});
