// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {
  createMap,
  prepareDiscontinuousGrid,
  MYRIAHEDRAL_VIEWS,
} from "./discontinuous-views.js";

const cache = new Map();

/** Browser preparation with a cancellable worker for static segmented maps. */
export async function prepareMapGrid(view, step, { signal } = {}) {
  signal?.throwIfAborted();
  const key = `${view}:${step}`;
  if (cache.has(key)) return cache.get(key);
  // Complex chart clipping and adaptive layout sampling can themselves be long
  // operations. Keep static map preparation entirely off the browser UI thread.
  if (typeof Worker !== "undefined" && !MYRIAHEDRAL_VIEWS[view]) {
    const data = await new Promise((resolve, reject) => {
      const worker = new Worker(
        new URL("./discontinuous-grid-worker.js", import.meta.url),
        { type: "module" },
      );
      const finish = (error, result) => {
        worker.terminate();
        signal?.removeEventListener("abort", abort);
        if (error) reject(error);
        else resolve(result);
      };
      const abort = () => finish(signal.reason);
      signal?.addEventListener("abort", abort, { once: true });
      worker.onmessage = ({ data }) =>
        data.error ? finish(new Error(data.error)) : finish(null, data);
      worker.onerror = (event) =>
        finish(new Error(event.message || "Map preparation failed"));
      worker.postMessage({ view, step });
    });
    signal?.throwIfAborted();
    const result = { ...data, map: createMap(view) };
    if (cache.size >= 3) cache.delete(cache.keys().next().value);
    cache.set(key, result);
    return result;
  }
  return prepareDiscontinuousGrid(view, step, { signal });
}
