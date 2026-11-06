// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test as baseTest, vi} from 'vitest';
import {isBrowser} from '@math.gl/core/worker-utils/lib/env-utils/globals';
const test = baseTest.runIf(isBrowser);
import WorkerThread from '@math.gl/core/worker-utils/lib/worker-farm/worker-thread';
import {getLoadableWorkerURL} from '@math.gl/core/worker-utils/lib/worker-utils/get-loadable-worker-url';

test('module worker URLs preserve local entrypoints and import remote modules through a shim', async () => {
  for (const url of [
    '/worker.js',
    './worker.js',
    new URL('/worker.js', location.href).href,
    'data:text/javascript,export{}'
  ]) {
    expect(getLoadableWorkerURL({url, workerType: 'module'})).toBe(url);
  }
  const remote = 'https://worker.example.invalid/worker.js?name="quoted"';
  const shim = getLoadableWorkerURL({url: remote, workerType: 'module'});
  try {
    expect(shim).toMatch(/^blob:/);
    expect(await (await fetch(shim)).text()).toBe(
      `import ${JSON.stringify(new URL(remote).href)};`
    );
  } finally {
    URL.revokeObjectURL(shim);
  }
});

test.each([false, true])(
  'module worker teardown revokes its shim and preserves caller-owned blob URLs (lazy URL: %s)',
  async lazy => {
    const entrypoint = URL.createObjectURL(
      new Blob(['export {};'], {type: 'application/javascript'})
    );
    let constructed = '';
    const terminate = vi.fn();
    const constructor = vi.spyOn(globalThis, 'Worker').mockImplementation(function (url) {
      constructed = String(url);
      return {terminate} as any;
    } as any);
    try {
      const remote = new WorkerThread({
        name: 'remote',
        ...(lazy
          ? {getUrl: () => 'https://worker.example.invalid/worker.js'}
          : {url: 'https://worker.example.invalid/worker.js'}),
        workerType: 'module'
      });
      const shim = constructed;
      expect((await fetch(shim)).ok).toBe(true);
      await remote.destroy();
      await expect(fetch(shim)).rejects.toThrow();
      expect(terminate).toHaveBeenCalledOnce();
      const local = new WorkerThread({name: 'local', url: entrypoint, workerType: 'module'});
      expect(constructed).toBe(entrypoint);
      await local.destroy();
      expect((await fetch(entrypoint)).ok).toBe(true);
    } finally {
      constructor.mockRestore();
      URL.revokeObjectURL(entrypoint);
    }
  }
);

test.each([false, true])(
  'failed module worker construction releases its shim (lazy URL: %s)',
  async lazy => {
    let shim = '';
    const constructor = vi.spyOn(globalThis, 'Worker').mockImplementation(function (url) {
      shim = String(url);
      throw new Error('blocked worker');
    } as any);
    try {
      expect(
        () =>
          new WorkerThread({
            name: 'remote',
            ...(lazy
              ? {getUrl: () => 'https://worker.example.invalid/worker.js'}
              : {url: 'https://worker.example.invalid/worker.js'}),
            workerType: 'module'
          })
      ).toThrow('blocked worker');
      await expect(fetch(shim)).rejects.toThrow();
    } finally {
      constructor.mockRestore();
    }
  }
);

test('relative module entrypoints honor the document base URL', async () => {
  const base = vi
    .spyOn(document, 'baseURI', 'get')
    .mockReturnValue('https://base.example.invalid/nested/');
  let shim = '';
  try {
    shim = getLoadableWorkerURL({url: './worker.js', workerType: 'module'});
    expect(await (await fetch(shim)).text()).toBe(
      'import "https://base.example.invalid/nested/worker.js";'
    );
  } finally {
    base.mockRestore();
    URL.revokeObjectURL(shim);
  }
});

test.each([false, true])(
  'source-only module workers retain their cached source URL (constructor failure: %s)',
  async failFirst => {
    let constructed = '';
    const constructor = vi.spyOn(globalThis, 'Worker').mockImplementation(function (url) {
      constructed = String(url);
      if (failFirst) {
        failFirst = false;
        throw new Error('blocked source worker');
      }
      return {terminate() {}} as any;
    } as any);
    const source = 'export const cachedSourceWorker = true;';
    try {
      let initial: WorkerThread | undefined;
      try {
        initial = new WorkerThread({name: 'source', source, workerType: 'module'});
      } catch (error) {
        expect((error as Error).message).toBe('blocked source worker');
      }
      const cached = constructed;
      await initial?.destroy();
      expect(await (await fetch(cached)).text()).toBe(source);
      const next = new WorkerThread({name: 'source', source, workerType: 'module'});
      expect(constructed).toBe(cached);
      await next.destroy();
      expect(await (await fetch(cached)).text()).toBe(source);
    } finally {
      constructor.mockRestore();
    }
  }
);

baseTest.runIf(!isBrowser)(
  'opaque document origins retain a module shim even when the base URL matches',
  async () => {
    const {Blob} = await import('node:buffer');
    vi.stubGlobal('Blob', Blob);
    vi.stubGlobal('location', {href: 'about:blank', origin: 'null'});
    vi.stubGlobal('document', {baseURI: 'https://base.example.invalid/nested/'});
    let shim = '';
    try {
      shim = getLoadableWorkerURL({url: './worker.js', workerType: 'module'});
      expect(shim).toMatch(/^blob:/);
      expect(await (await fetch(shim)).text()).toBe(
        'import "https://base.example.invalid/nested/worker.js";'
      );
    } finally {
      vi.unstubAllGlobals();
      URL.revokeObjectURL(shim);
    }
  }
);
