// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import assert from 'node:assert/strict';
import {readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {test} from 'node:test';
import {selectProfile} from './ci-profile.mjs';
import {checkResults} from './ci-gate.mjs';

const workflow = readFileSync(new URL('../.github/workflows/test.yml', import.meta.url), 'utf8');

test('ordinary PRs retain Chromium; nightly and manual runs exercise the full matrix', () => {
  for (const event of ['pull_request', 'merge_group', 'push'])
    assert.deepEqual(selectProfile(event, ['modules/core/src/vector3.ts']), {
      full: false,
      performance: ['pull_request', 'merge_group'].includes(event),
      browsers: ['chromium']
    });
  for (const event of ['schedule', 'workflow_dispatch'])
    assert.deepEqual(selectProfile(event), {
      full: true,
      performance: false,
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
    'modules/geospatial/scripts/projection/scorecard.mjs',
    'modules/geospatial/scripts/qualify-c8.mjs',
    'modules/geospatial/test/projection/benchmark-entry.ts',
    'modules/geospatial/test/projection/native-forward-reference.ts',
    'modules/geospatial/test/projection/fixtures/accuracy-cases.json'
  ])
    assert.equal(selectProfile('pull_request', [path]).full, true, path);
});

function results(event, full, performance = ['pull_request', 'merge_group'].includes(event)) {
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
          (name === 'scorecard' && !full) || (name === 'projection-performance' && !performance)
            ? 'skipped'
            : 'success',
        ...(name === 'plan'
          ? {
              outputs: {full: String(full), performance: String(performance)}
            }
          : {})
      }
    ])
  );
}

test('aggregate gate rejects a failed, cancelled, missing or unexpectedly skipped worker', () => {
  for (const [event, full, performance = ['pull_request', 'merge_group'].includes(event)] of [
    ['pull_request', false, false],
    ['pull_request', false],
    ['pull_request', true],
    ['merge_group', false],
    ['merge_group', true],
    ['push', false],
    ['schedule', true],
    ['workflow_dispatch', true]
  ]) {
    const needs = results(event, full, performance);
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

test('only documentation allowlisted PRs skip paired performance', () => {
  for (const paths of [
    ['docs/README.md'],
    ['dev-docs/ci.md', 'docs/images/diagram.png'],
    ['README.md', 'CHANGELOG.md', 'LICENSE']
  ])
    assert.equal(selectProfile('pull_request', paths).performance, false);
  for (const paths of [
    [],
    ['docs/README.md', 'modules/core/src/vector3.ts'],
    ['package.json'],
    ['yarn.lock'],
    ['.nvmrc'],
    ['.github/workflows/test.yml'],
    ['scripts/ci-profile.mjs'],
    ['modules/geospatial/README.md'],
    ['examples/geospatial/demo/main.ts']
  ])
    assert.equal(selectProfile('pull_request', paths).performance, true, JSON.stringify(paths));
  for (const event of ['push', 'schedule', 'workflow_dispatch'])
    assert.equal(selectProfile(event).performance, false);
});

test('a missing performance decision cannot silently skip comparisons', () => {
  const needs = results('pull_request', false, false);
  assert.deepEqual(checkResults(needs, 'pull_request'), []);
  delete needs.plan.outputs.performance;
  assert(checkResults(needs, 'pull_request').length);
  assert(checkResults(results('schedule', true, true), 'schedule').length);
  assert.match(
    workflow,
    /if: \(github.event_name == 'pull_request' \|\| github.event_name == 'merge_group'\) && needs.plan.outputs.performance == 'true'/
  );
});

test('renaming a qualification helper into docs retains both source-path gates', () => {
  const directory = mkdtempSync(join(tmpdir(), 'math-ci-rename-'));
  const git = (...args) =>
    execFileSync('git', args, {
      cwd: directory,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    }).trim();
  try {
    git('init');
    git('config', 'user.name', 'CI test fixture');
    git('config', 'user.email', 'fixture@example.invalid');
    git('config', 'diff.renames', 'true');
    const source = 'modules/geospatial/test/projection/native-forward-reference.ts';
    mkdirSync(join(directory, 'modules/geospatial/test/projection'), {
      recursive: true
    });
    writeFileSync(join(directory, source), 'export const reference = 42;\n');
    git('add', '.');
    git('commit', '-m', 'reference');
    const base = git('rev-parse', 'HEAD');
    mkdirSync(join(directory, 'docs'));
    git('mv', source, 'docs/reference.ts');
    git('commit', '-m', 'move reference');
    // Ensure this fixture really exercises Git's destination-only rename reporting.
    assert.equal(git('diff', '--name-only', base, 'HEAD'), 'docs/reference.ts');
    const output = join(directory, 'outputs');
    execFileSync(process.execPath, [fileURLToPath(new URL('./ci-profile.mjs', import.meta.url))], {
      cwd: directory,
      env: {
        ...process.env,
        EVENT_NAME: 'pull_request',
        BASE_SHA: base,
        GITHUB_OUTPUT: output
      }
    });
    const profile = readFileSync(output, 'utf8');
    assert.match(profile, /^performance=true$/m);
    assert.match(profile, /^full=true$/m);
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
});

test('merge groups use the combined diff base and keep independent concurrency', () => {
  assert.match(workflow, /merge_group:\n    types: \[checks_requested\]/);
  assert.match(
    workflow,
    /github.event.pull_request.base.sha \|\| github.event.merge_group.base_sha/
  );
  assert.match(workflow, /github.event_name.*github.event.pull_request.number \|\| github.ref/);
  assert.equal(selectProfile('merge_group', ['.github/workflows/test.yml']).full, true);
  assert.equal(selectProfile('merge_group', ['docs/README.md']).performance, false);
  assert.equal(selectProfile('merge_group', []).performance, true);
});
