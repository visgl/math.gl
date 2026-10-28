// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {afterEach, expect, test, vi} from 'vitest';
import {loadLibrary} from '../../src/worker-utils/lib/library-utils/library-utils';

afterEach(() => vi.unstubAllGlobals());

test('WASM asset URLs with query strings return bytes and report HTTP failures', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(new Uint8Array([0, 97, 115, 109]), {status: 200}))
  );
  expect(new Uint8Array(await loadLibrary('https://example.test/a.wasm?v=1'))).toEqual(
    new Uint8Array([0, 97, 115, 109])
  );
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(null, {status: 404}))
  );
  await expect(loadLibrary('https://example.test/missing.wasm?v=1')).rejects.toThrow('HTTP 404');
});
