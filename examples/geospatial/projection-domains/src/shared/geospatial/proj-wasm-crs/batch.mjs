// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

// Application recipe for the pinned asynchronous proj-wasm API. The application owns
// proj.init/shutdown; this processor owns one context and normalized operation.
export async function createProjWasmBatchProcessor(proj, {
  sourceCRS, targetCRS, chunkSize = 1024, maxPoints = 1000000
}) {
  if (![sourceCRS, targetCRS].every(s => typeof s === 'string' && s.trim()) ||
    !Number.isSafeInteger(chunkSize) || chunkSize < 1 || chunkSize > 65536 ||
    !Number.isSafeInteger(maxPoints) || maxPoints < 0 || maxPoints > 1000000)
    throw new RangeError('Invalid batch configuration');
  let context, operation, normalized, closed = false, tail = Promise.resolve(), disposal;
  async function release() {
    // Attempt every cleanup even if an earlier release fails.
    try {if (normalized) await proj.projDestroy({pj: normalized});}
    finally {try {if (operation) await proj.projDestroy({pj: operation});}
      finally {if (context) await proj.projContextDestroy({context});}}
  }
  try {
    context = await proj.contextCreate();
    await proj.projContextSetEnableNetwork({context, enabled: 0});
    operation = await proj.projCreateCrsToCrs({context, source_crs: sourceCRS, target_crs: targetCRS});
    normalized = await proj.projNormalizeForVisualization({context, obj: operation});
  } catch (error) {await release(); throw error;}
  return {
    async transform({positions, sourceRowIndices}, {direction = 'forward', signal} = {}) {
      if (closed) throw new Error('Batch processor disposed');
      if (!(positions instanceof Float64Array) || positions.length % 3 ||
        positions.length / 3 > maxPoints || !positions.every(Number.isFinite) ||
        !(sourceRowIndices instanceof Uint32Array) || sourceRowIndices.length !== positions.length / 3 ||
        !['forward', 'inverse'].includes(direction)) throw new RangeError('Invalid XYZ batch');
      // Snapshot before queueing so later caller mutations cannot alter accepted work.
      const source = positions.slice(), rows = sourceRowIndices.slice();
      const pending = tail.then(async () => {
        aborted(signal);
        const output = new Float64Array(source.length);
        for (let start = 0; start < rows.length; start += chunkSize) {
          aborted(signal);
          const count = Math.min(chunkSize, rows.length - start);
          const coords = await proj.coordArray(count);
          const tuples = Array.from({length: count}, (_, i) => [...source.slice((start + i) * 3, (start + i + 1) * 3), 0]);
          await proj.setCoords(coords, tuples);
          aborted(signal);
          const code = await proj.projTransArray({p: normalized,
            direction: direction === 'forward' ? proj.PJ_FWD : proj.PJ_INV, n: count, coord: coords});
          aborted(signal);
          if (code !== 0) throw new Error(`PROJ batch transformation failed (${code})`);
          for (let i = 0; i < count; i++) {
            const coordinate = await proj.getCoords(coords, i);
            if (!coordinate || coordinate.length < 3 || !coordinate.slice(0, 3).every(Number.isFinite))
              throw new Error('PROJ returned invalid coordinates');
            output.set(coordinate.slice(0, 3), (start + i) * 3);
          }
        }
        aborted(signal);
        return {positions: output, sourceRowIndices: rows};
      });
      // Rejections must not poison subsequent work; disposal waits for all accepted jobs.
      tail = pending.catch(() => {});
      return pending;
    },
    dispose() {
      if (!disposal) {closed = true; disposal = tail.then(release);}
      return disposal;
    }
  };
}
function aborted(signal) {
  if (signal?.aborted) throw signal.reason ?? new Error('Batch aborted');
}

/** Latest-view policy: superseded results/errors are discarded, current errors propagate.
 * Cancellation is cooperative between async calls, not preemption of a native PROJ call.
 */
export function createLatestBatchRunner(processor) {
  let generation = 0, controller;
  return {
    async run(batch, options = {}) {
      const current = ++generation;
      controller?.abort();
      const requestController = new AbortController();
      controller = requestController;
      const callerSignal = options.signal;
      const abortFromCaller = () => requestController.abort(callerSignal.reason);
      if (callerSignal?.aborted) abortFromCaller();
      else callerSignal?.addEventListener('abort', abortFromCaller, {once: true});
      try {
        aborted(requestController.signal);
        const result = await processor.transform(batch, {...options, signal: requestController.signal});
        if (current !== generation) return null;
        aborted(requestController.signal);
        return result;
      } catch (error) {if (current !== generation) return null; throw error;}
      finally {callerSignal?.removeEventListener('abort', abortFromCaller);}
    },
    cancel() {generation++; controller?.abort();}
  };
}
