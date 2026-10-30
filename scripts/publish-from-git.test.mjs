// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';
import {dirname, resolve} from 'node:path';
import {checkPublishingStack} from './check-publishing-stack.mjs';
import {
  validateRelease,
  validateRecoveryFiles,
  ensureRelease,
  publishRemaining
} from './publish-from-git.mjs';

const tag = 'v5.0.0-beta.2';
const state = (exists, tagged = exists, provenance = exists) => [
  {name: '@math.gl/test', exists, tagged, provenance}
];
const ok = () => ({status: 0, output: ''});
const noWait = async () => {};

test('validates the exact release version and refuses changed release sources', () => {
  const valid = {tag, version: '5.0.0-beta.2', versions: ['5.0.0-beta.2'], changelog: `## ${tag}`};
  validateRelease(valid);
  assert.throws(() => validateRelease({...valid, tag: 'master'}));
  assert.throws(() => validateRelease({...valid, versions: ['5.0.0-beta.3']}));
  assert.throws(() => validateRelease({...valid, changelog: '## Unreleased'}));
  validateRecoveryFiles(['scripts/publish-from-git.mjs', 'yarn.lock']);
  assert.throws(() => validateRecoveryFiles(['modules/core/src/index.ts']));
  assert.throws(() => validateRecoveryFiles(['.yarn/patches/unrelated.patch']));
});

test('reuses existing GitHub release, creates missing record, tolerates concurrent creation', async () => {
  for (const responses of [[200], [404, 201], [404, 422, 200]]) {
    const methods = [];
    await ensureRelease({
      repository: 'visgl/math.gl',
      tag,
      notes: 'notes',
      request: async (_url, options = {}) => {
        methods.push(options.method || 'GET');
        return {status: responses.shift()};
      }
    });
    assert.equal(methods[0], 'GET');
    assert.equal(responses.length, 0);
    assert.ok(!methods.includes('DELETE'));
  }
  await assert.rejects(
    ensureRelease({repository: 'visgl/math.gl', tag, request: async () => ({status: 403})})
  );
});

test('skips already published versions and never republishes just to fix a tag', async () => {
  let calls = 0;
  await publishRemaining({
    readState: async () => state(true),
    publish: () => {
      calls++;
      return ok();
    },
    wait: noWait
  });
  assert.equal(calls, 0);
  await assert.rejects(
    publishRemaining({
      readState: async () => state(true, false),
      publish: () => {
        calls++;
        return ok();
      },
      wait: noWait,
      polls: 1
    })
  );
  assert.equal(calls, 0);
  await assert.rejects(
    publishRemaining({
      readState: async () => state(true, true, false),
      publish: ok,
      wait: noWait,
      polls: 1,
      log: () => {}
    }),
    /verification incomplete/
  );
});

test('bounded provenance retries recheck registry and require final visibility', async () => {
  let publishes = 0;
  const states = [state(false), state(false), state(false), state(true)];
  await publishRemaining({
    readState: async () => states.shift(),
    publish: () =>
      ++publishes === 1 ? {status: 1, output: 'TLOG_CREATE_ENTRY_ERROR (409)'} : ok(),
    wait: noWait,
    log: () => {}
  });
  assert.equal(publishes, 2);
  await assert.rejects(
    publishRemaining({
      readState: async () => state(false),
      publish: () => ({status: 1, output: 'TLOG_CREATE_ENTRY_ERROR'}),
      wait: noWait,
      attempts: 2,
      log: () => {}
    }),
    /retries exhausted/
  );
  await assert.rejects(
    publishRemaining({
      readState: async () => state(false),
      publish: ok,
      wait: noWait,
      polls: 1,
      log: () => {}
    }),
    /verification incomplete/
  );
  await assert.rejects(
    publishRemaining({
      readState: async () => state(false),
      publish: () => ({status: 1, output: 'E403 forbidden'}),
      wait: noWait
    }),
    /Non-retryable/
  );
});

test('real patched signing client recovers only a 409 with a location and propagates failures', async () => {
  const {client, sigstorePath} = checkPublishingStack();
  const sigstoreRequire = createRequire(sigstorePath);
  const signingRoot = dirname(sigstoreRequire.resolve('@sigstore/sign'));
  const {HTTPError} = sigstoreRequire(resolve(signingRoot, 'external/error.js'));
  const entry = {uuid: 'entry', verification: {signedEntryTimestamp: 'proof'}};
  client.rekor.createEntry = async () => {
    throw new HTTPError({status: 409, location: '/api/v1/log/entries/entry'});
  };
  client.rekor.getEntry = async (uuid) => {
    assert.equal(uuid, 'entry');
    return entry;
  };
  assert.equal(await client.createEntry({}), entry);
  client.rekor.createEntry = async () => {
    throw new HTTPError({status: 409});
  };
  await assert.rejects(client.createEntry({}), /creating tlog entry/);
  client.rekor.createEntry = async () => {
    throw new HTTPError({status: 409, location: '/entries/entry'});
  };
  client.rekor.getEntry = async () => {
    throw new Error('unavailable');
  };
  await assert.rejects(client.createEntry({}), /fetching tlog entry/);
});
