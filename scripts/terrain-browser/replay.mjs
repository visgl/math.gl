// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Deterministic interaction-shaped traces; these are synthetic, not recorded sessions. */
export function arrivalTrace(events, scenario) {
  if (!['brush', 'streaming'].includes(scenario)) throw new Error('Unknown trace');
  return events.map((event, i) => ({
    ...event,
    arrivalMs:
      scenario === 'brush'
        ? Math.floor(i / 4) * (1000 / 60) + Math.floor(i / 64) * 80
        : Math.floor(i / 8) * 33 + (i % 8) * 0.35 + Math.floor(i / 32) * 75
  }));
}

/** Actual independent timer arrivals, serialized revisions, bounded pending batches. */
export async function replayBrowser(handle, events, ownership, policy, frameWorkMs = 3) {
  if (!events.length || !['single', 'opportunistic', 'bounded-wait'].includes(policy)) {
    throw new Error('Nonempty events and a known policy are required');
  }
  const start = performance.now();
  const commits = [];
  const arrivals = [];
  const timers = [];
  let cursor = 0;
  let revision = 3;
  let busy = false;
  let wake;
  let frame;
  let stopped = false;
  let resolveDone;
  let rejectDone;
  const done = new Promise((resolve, reject) => {
    resolveDone = resolve;
    rejectDone = reject;
  });
  const timeout = setTimeout(() => rejectDone(new Error('Browser replay timed out')), 30000);
  /** Simulate rendering work without involving GPU execution. */
  function frameWork() {
    if (stopped) return;
    const until = performance.now() + frameWorkMs;
    while (performance.now() < until) {
      /* Controlled main-thread contention. */
    }
    frame = requestAnimationFrame(frameWork);
  }
  /** Dispatch only observed arrivals, with at most one request in flight. */
  async function pump() {
    if (stopped || busy || cursor === arrivals.length) return;
    clearTimeout(wake);
    const now = performance.now() - start;
    const first = arrivals[cursor];
    if (policy === 'bounded-wait' && arrivals.length - cursor < 8 && now < first.observedMs + 2) {
      wake = setTimeout(pump, first.observedMs + 2 - now);
      return;
    }
    busy = true;
    const end = Math.min(arrivals.length, cursor + (policy === 'single' ? 1 : 8));
    const batch = arrivals.slice(cursor, end);
    const sentMs = performance.now() - start;
    try {
      const delta = await handle.runTask(
        {revision, edits: batch.map(e => e.edit), measureStages: true},
        {outputOwnership: ownership}
      );
      const ackMs = performance.now() - start;
      if (delta.error || delta.revision !== ++revision)
        throw new Error('Worker revision/error mismatch');
      commits.push({batch, delta, sentMs, ackMs});
      cursor = end;
      busy = false;
      if (cursor === events.length) resolveDone(commits);
      else void pump();
    } catch (error) {
      rejectDone(error);
    }
  }
  try {
    frame = requestAnimationFrame(frameWork);
    for (const event of events) {
      timers.push(
        setTimeout(() => {
          arrivals.push({...event, observedMs: performance.now() - start});
          void pump();
        }, event.arrivalMs)
      );
    }
    const result = await done;
    return {commits: result, epoch: performance.timeOrigin + start};
  } finally {
    stopped = true;
    clearTimeout(timeout);
    cancelAnimationFrame(frame);
    clearTimeout(wake);
    for (const timer of timers) clearTimeout(timer);
  }
}

/** Preserve typed arrays and NaN across the Playwright JSON bridge, outside timing. */
export function encode(value) {
  if (ArrayBuffer.isView(value))
    return {typed: value.constructor.name, values: Array.from(value, encode)};
  if (typeof value === 'number' && Number.isNaN(value)) return {nan: true};
  if (Array.isArray(value)) return value.map(encode);
  if (value && typeof value === 'object')
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, encode(v)]));
  return value;
}

/** Restore the private JSON bridge representation. */
export function decode(value) {
  if (value?.typed) return new globalThis[value.typed](value.values.map(decode));
  if (value?.nan) return NaN;
  if (Array.isArray(value)) return value.map(decode);
  if (value && typeof value === 'object')
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, decode(v)]));
  return value;
}
