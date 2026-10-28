// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import test from 'node:test';
import {nextBetaVersion, publishBeta} from './publish-beta.mjs';

function fixture({
  branch = 'master',
  dirty = false,
  changelog = '## v5.0.0-beta.1',
  failVersion = false
} = {}) {
  const calls = [];
  return {
    calls,
    root: '/repo',
    read: (path) => (path.endsWith('lerna.json') ? '{"version":"5.0.0-alpha.20"}' : changelog),
    run(command, args) {
      calls.push([command, ...args]);
      if (command === 'npx') {
        if (failVersion) throw new Error('Version command failed');
        return '';
      }
      if (args[0] === 'branch') return branch;
      if (args[0] === 'status') return dirty ? ' M package.json' : '';
      if (args[0] === 'describe') return 'v5.0.0-beta.1';
      return '';
    }
  };
}

test('switches alpha to beta.1 and increments subsequent betas', () => {
  assert.equal(nextBetaVersion('5.0.0-alpha.20'), '5.0.0-beta.1');
  assert.equal(nextBetaVersion('5.0.0-beta.1'), '5.0.0-beta.2');
  assert.throws(() => nextBetaVersion('5.0.0'));
});

test('dry run previews the explicit version without executing commands', () => {
  const f = fixture();
  assert.equal(publishBeta({...f, dryRun: true}).version, '5.0.0-beta.1');
  assert.deepEqual(f.calls, []);
});

test('rejects feature branches, dirty trees, and missing notes before versioning', () => {
  for (const options of [{branch: 'codex/prep'}, {dirty: true}, {changelog: '## Unreleased'}]) {
    const f = fixture(options);
    assert.throws(() => publishBeta(f));
    assert.ok(f.calls.every((call) => call[0] !== 'npx' && call[1] !== 'push'));
  }
});

test('pushes just the release branch and tag atomically after versioning', () => {
  const f = fixture({branch: '5.0-release'});
  publishBeta(f);
  assert.deepEqual(
    f.calls.find((call) => call[0] === 'npx'),
    [
      'npx',
      'lerna',
      'version',
      '5.0.0-beta.1',
      '--force-publish',
      '--exact',
      '--no-commit-hooks',
      '--no-push'
    ]
  );
  assert.deepEqual(f.calls.at(-1), [
    'git',
    'push',
    '--atomic',
    'origin',
    'HEAD:refs/heads/5.0-release',
    'refs/tags/v5.0.0-beta.1'
  ]);
});

test('never pushes after versioning fails', () => {
  const f = fixture({failVersion: true});
  assert.throws(() => publishBeta(f));
  assert.ok(f.calls.every((call) => call[1] !== 'push'));
});
