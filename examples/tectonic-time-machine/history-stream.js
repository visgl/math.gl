// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
export function waitForRetry(milliseconds, signal) {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    function cleanup() {clearTimeout(timer); signal.removeEventListener('abort', cancel);}
    function cancel() {cleanup(); reject(signal.reason);}
    const timer = setTimeout(() => {cleanup(); resolve();}, milliseconds);
    signal.addEventListener('abort', cancel, {once: true});
  });
}
/** Continue preloading while idle, preserving playable samples during service interruptions. */
export async function maintainHistory(model, getTime, {
  signal, onStatus, retryDelay = 30000, wait = waitForRetry
}) {
  function progress() {
    onStatus(`Streaming history · ${model.loadedSamples}/${model.totalSamples} samples`);
  }
  while (true) {
    signal.throwIfAborted();
    progress();
    try {
      await model.ensureHistory(getTime(), {signal, onStatus: progress});
      signal.throwIfAborted();
      onStatus(`All ${model.totalSamples} historical samples loaded`);
      return;
    } catch (error) {
      signal.throwIfAborted();
      onStatus(`History preload interrupted: ${error.message} · retrying in ${retryDelay / 1000}s`);
      await wait(retryDelay, signal);
    }
  }
}
