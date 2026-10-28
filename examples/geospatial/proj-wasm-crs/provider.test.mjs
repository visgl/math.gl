// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import test from 'node:test';
import assert from 'node:assert/strict';
import {createProjWasmProvider} from './provider.mjs';

function mock(overrides = {}) {
  const calls = [];
  const proj = {
    PJ_CATEGORY_CRS: 3,
    contextCreate: async () => 'context',
    projContextSetEnableNetwork: async (options) => {
      calls.push(['network', options.enabled]);
    },
    projContextGetDatabaseMetadata: async () => 'test-version',
    projCreateFromDatabase: async (options) => {
      calls.push(['lookup', options]);
      return 'pj';
    },
    projAsProjjson: async () => JSON.stringify({type: 'GeographicCRS', name: 'test'}),
    projDestroy: async () => {
      calls.push(['destroy']);
    },
    projContextDestroy: async () => {
      calls.push(['context-destroy']);
    },
    ...overrides
  };
  return {proj, calls};
}

test('provider uses authority database, disables network and releases owned resources', async () => {
  const {proj, calls} = mock();
  const backend = await createProjWasmProvider(proj);
  assert.equal(await backend.provider.resolve('https://example.org/EPSG/4326'), null);
  assert.equal((await backend.provider.resolve('EPSG:4326')).type, 'GeographicCRS');
  assert.deepEqual(calls[0], ['network', 0]);
  assert.equal(calls[1][1].auth_name, 'EPSG');
  assert.equal(calls[1][1].code, '4326');
  await backend.dispose();
  await backend.dispose();
  assert.equal(calls.filter(([name]) => name === 'context-destroy').length, 1);
  await assert.rejects(backend.provider.resolve('EPSG:4326'), /disposed/);
});

test('serialization failures release PJ objects and initialization failures release contexts', async () => {
  const {proj, calls} = mock({projAsProjjson: async () => 'invalid JSON'});
  const backend = await createProjWasmProvider(proj);
  await assert.rejects(backend.provider.resolve('EPSG:4326'));
  assert.ok(calls.some(([name]) => name === 'destroy'));
  await backend.dispose();
  const failed = mock({
    projContextSetEnableNetwork: async () => {
      throw new Error('init failed');
    }
  });
  await assert.rejects(createProjWasmProvider(failed.proj), /init failed/);
  assert.deepEqual(failed.calls, [['context-destroy']]);
});

test('disposal waits for pending lookups and prevents new ones', async () => {
  let release;
  const wait = new Promise((done) => {
    release = done;
  });
  const {proj, calls} = mock({
    projAsProjjson: async () => {
      await wait;
      return '{"type":"GeographicCRS"}';
    }
  });
  const backend = await createProjWasmProvider(proj);
  const pending = backend.provider.resolve('EPSG:4326');
  const disposing = backend.dispose();
  assert.ok(!calls.some(([name]) => name === 'context-destroy'));
  release();
  await pending;
  await disposing;
  assert.deepEqual(calls.slice(-2), [['destroy'], ['context-destroy']]);
});

test('database errors propagate and invalid definitions reject', async () => {
  const failure = new Error('database unavailable');
  const {proj} = mock({
    projCreateFromDatabase: async () => {
      throw failure;
    }
  });
  const backend = await createProjWasmProvider(proj);
  await assert.rejects(backend.provider.resolve('EPSG:0'), (error) => error === failure);
  await backend.dispose();
  for (const output of ['null', '{}']) {
    const next = await createProjWasmProvider(mock({projAsProjjson: async () => output}).proj);
    await assert.rejects(next.provider.resolve('EPSG:0'), /invalid CRS/);
    await next.dispose();
  }
});
