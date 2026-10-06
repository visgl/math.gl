// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {ParquetSource} from 'math.gl-parquet-loader';

/** Reuse range reads from immutable, commit-pinned snapshots across column selections. */
function remoteFile(url, size, fetchFile, signal) {
  if (!Number.isSafeInteger(size) || size <= 0) throw new Error('Invalid snapshot byte length');
  const ranges = new Map();
  let buffered;
  return {
    handle: url, size,
    async read(offset, length) {
      signal.throwIfAborted();
      if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(length) ||
          offset < 0 || length < 0 || offset + length > size) throw new Error('Invalid snapshot range');
      if (!length) return new ArrayBuffer(0);
      if (buffered) return buffered.slice(offset, offset + length);
      const key = `${offset}:${length}`;
      let pending = ranges.get(key);
      if (!pending) {
        pending = (async () => {
          const response = await fetchFile(url, {signal, headers: {Range: `bytes=${offset}-${offset + length - 1}`}});
          if (response.status !== 206 && response.status !== 200)
            throw new Error(`Snapshot returned HTTP ${response.status}`);
          const data = await response.arrayBuffer();
          signal.throwIfAborted();
          if (response.status === 200) {
            if (data.byteLength !== size) throw new Error('Incomplete snapshot download');
            buffered = data; // Servers without range support still work for these small files.
            ranges.clear();
            return data.slice(offset, offset + length);
          }
          // GitHub media supports ranges but does not expose Content-Range through CORS.
          const contentRange = response.headers.get('Content-Range');
          if (data.byteLength !== length || (contentRange &&
              contentRange !== `bytes ${offset}-${offset + length - 1}/${size}`))
            throw new Error('Unexpected snapshot byte range');
          return data;
        })();
        ranges.set(key, pending);
        pending.catch(() => {if (ranges.get(key) === pending) ranges.delete(key);});
      }
      const data = await pending;
      signal.throwIfAborted();
      return data;
    }
  };
}

/** Stream selected columns and row groups through loaders.gl's TypeScript decoder. */
export function createParquetReader(fetchFile = fetch, {worker = true, workerUrl, onTelemetry} = {}) {
  const files = new Map();
  return async function* parquetBatches(url, {columns, rowGroups, byteLength, signal}) {
    signal.throwIfAborted();
    let file = files.get(url);
    if (!file) {
      const transport = remoteFile(url, byteLength, fetchFile, signal);
      file = new ParquetSource(url, {
        core: {worker, fetch: async (_url, options) => {
          const range = new Headers(options.headers).get('Range');
          const match = /^bytes=(\d+)-(\d+)$/.exec(range);
          if (!match) throw new Error('Expected snapshot range request');
          const start = Number(match[1]), end = Number(match[2]);
          const data = await transport.read(start, end - start + 1);
          return new Response(data, {status: 206, headers: {
            'Content-Range': `bytes ${start}-${end}/${byteLength}`
          }});
        }},
        parquet: {workerUrl, onTelemetry}
      });
      files.set(url, file);
      signal.addEventListener('abort', () => {file.close().catch(() => {});}, {once: true});
    }
    for await (const batch of file.read({
      columns, rowGroups, batchSize: 4096, concurrency: 2, signal
    })) {
      signal.throwIfAborted();
      yield batch;
      // Let rendering and controls run between decoded batches.
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  };
}

/** Start at the current pose, then fill younger history in playback order. */
export function rotationGroups(index, time, maxAge) {
  const age = Math.max(0, -time);
  const low = Math.floor(age / 10) * 10, high = Math.min(maxAge, Math.ceil(age / 10) * 10);
  const rotations = index.filter(entry => entry.recordType === 'rotation');
  const required = rotations.filter(entry =>
    (entry.minAge <= low && entry.maxAge >= low) || (entry.minAge <= high && entry.maxAge >= high)
  );
  const rest = rotations.filter(entry => !required.includes(entry));
  return [...required, ...rest.filter(entry => entry.maxAge < low).sort((a,b) => b.minAge-a.minAge),
    ...rest.filter(entry => entry.minAge > high).sort((a,b) => a.minAge-b.minAge)]
    .map(entry => entry.rowGroup);
}
