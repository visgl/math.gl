// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Example provider for the pinned proj-wasm 0.1.0 public API.
 * The application initializes/shuts down the worker pool; this adapter owns one context.
 */
export async function createProjWasmProvider(proj) {
  const context = await proj.contextCreate();
  let closed = false;
  const pending = new Set();
  let disposing;
  try {
    // CRS definitions are in the bundled database. Grid/network policy is separate.
    await proj.projContextSetEnableNetwork({context, enabled: 0});
    const epsg = await proj.projContextGetDatabaseMetadata({
      context,
      key: 'EPSG.VERSION'
    });
    return {
      provider: Object.freeze({
        id: 'proj-wasm',
        version: `proj-wasm@0.1.0; EPSG:${epsg ?? 'unknown'}`,
        resolve(identifier) {
          if (closed) return Promise.reject(new Error('proj-wasm resolver is disposed'));
          // Restrict this example to AUTH:CODE. URNs/URLs are not fetched or guessed.
          const match = /^([A-Za-z][A-Za-z0-9_]*)\:([A-Za-z0-9_.-]+)$/.exec(identifier);
          if (!match) return Promise.resolve(null);
          const operation = lookup(match[1], match[2]);
          pending.add(operation);
          operation.then(
            () => pending.delete(operation),
            () => pending.delete(operation)
          );
          return operation;
        }
      }),
      dispose() {
        if (!disposing) {
          closed = true;
          disposing = Promise.allSettled([...pending]).then(() =>
            proj.projContextDestroy({context})
          );
        }
        return disposing;
      }
    };
  } catch (error) {
    await proj.projContextDestroy({context});
    throw error;
  }

  async function lookup(authority, code) {
    const pj = await proj.projCreateFromDatabase({
      context,
      auth_name: authority,
      code,
      category: proj.PJ_CATEGORY_CRS
    });
    if (!pj) throw new Error(`proj-wasm did not resolve ${authority}:${code}`);
    try {
      const json = await proj.projAsProjjson({context, pj});
      const definition = JSON.parse(json);
      if (!definition || typeof definition.type !== 'string') {
        throw new Error('proj-wasm returned an invalid CRS definition');
      }
      return definition;
    } finally {
      await proj.projDestroy({pj});
    }
  }
}
