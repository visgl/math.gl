// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import test from 'node:test';
import {nextBetaVersion, nextRcVersion, publishBeta} from './publish-beta.mjs';

function fixture({
  branch = 'master',
  dirty = false,
  changelog = '## v5.0.0-beta.1',
  failVersion = false,
  version = '5.0.0-alpha.20',
  remoteHead = 'prepared-head',
  tagHead = 'prepared-head'
} = {}) {
  const calls = [];
  return {
    calls,
    root: '/repo',
    read: (path) => (path.endsWith('lerna.json') ? JSON.stringify({version}) : changelog),
    run(command, args) {
      calls.push([command, ...args]);
      if (command === 'npx') {
        if (failVersion) throw new Error('Version command failed');
        return '';
      }
      if (args[0] === 'branch') return branch;
      if (args[0] === 'status') return dirty ? ' M package.json' : '';
      if (args[0] === 'describe') return 'v5.0.0-beta.1';
      if (args[0] === 'ls-remote') return `${remoteHead}\trefs/heads/${branch}`;
      if (args[0] === 'rev-parse') return args[1] === 'HEAD' ? 'prepared-head' : tagHead;
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

test('publishes a landed beta prep by checking and pushing only its release tag', () => {
  const f = fixture({version: '5.0.0-beta.1'});
  assert.deepEqual(publishBeta({...f, prepared: true}), {version: '5.0.0-beta.1'});
  assert.deepEqual(f.calls.slice(-2), [
    [process.execPath, 'scripts/publish-from-git.mjs', '--check', '--tag', 'v5.0.0-beta.1'],
    ['git', 'push', 'origin', 'refs/tags/v5.0.0-beta.1']
  ]);
  assert.equal(f.calls.some(([command]) => command === 'npx'), false);
});

test('refuses to publish an unlanded or mistagged prep', () => {
  for (const mismatch of [{remoteHead: 'newer'}, {tagHead: 'old-prep'}]) {
    const f = fixture({version: '5.0.0-beta.1', ...mismatch});
    assert.throws(() => publishBeta({...f, prepared: true}));
    assert.ok(f.calls.every((call) => call[1] !== 'push'));
  }
});

test('previews rc.1 from beta and increments subsequent candidates', () => {
  assert.equal(nextRcVersion('5.0.0-rc.1'), '5.0.0-rc.2');
  assert.throws(() => nextRcVersion('5.0.0'));
  assert.throws(() => nextBetaVersion('5.0.0-rc.1'));
  const f = fixture({version: '5.0.0-beta.12', changelog: '## v5.0.0-rc.1'});
  const preview = publishBeta({...f, dryRun: true, rc: true});
  assert.equal(preview.version, '5.0.0-rc.1');
  assert.equal(preview.versionCommand[3], '5.0.0-rc.1');
  assert.deepEqual(f.calls, []);
});

test('validates and pushes only the tag for a prepared release candidate', () => {
  const f = fixture({version: '5.0.0-rc.1', changelog: '## v5.0.0-rc.1'});
  assert.equal(publishBeta({...f, prepared: true, dryRun: true}).versionCommand, null);
  assert.deepEqual(f.calls, []);
  assert.deepEqual(publishBeta({...f, prepared: true}), {version: '5.0.0-rc.1'});
  assert.deepEqual(f.calls.slice(-2), [
    [process.execPath, 'scripts/publish-from-git.mjs', '--check', '--tag', 'v5.0.0-rc.1'],
    ['git', 'push', 'origin', 'refs/tags/v5.0.0-rc.1']
  ]);
});
