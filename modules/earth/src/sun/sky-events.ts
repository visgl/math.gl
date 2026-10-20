// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original bounded sampling and adaptive transition refinement.
import {validateRange} from './celestial';
/** Search any continuous visibility predicate, including Moon contrast or a terrain horizon. */
export function searchSkyVisibility(
  start: number | Date,
  end: number | Date,
  visible: (timestamp: number) => boolean,
  options: {sampleSeconds?: number; transitionSeconds?: number} = {}
) {
  const first = new Date(start).getTime(),
    last = new Date(end).getTime();
  validateRange('Start time', first, -8.64e15, 8.64e15);
  validateRange('End time', last, first + 1, 8.64e15);
  const sampleSeconds = options.sampleSeconds ?? 30;
  const transitionSeconds = options.transitionSeconds ?? 1;
  validateRange('Sample seconds', sampleSeconds, 0.1, 3600);
  validateRange('Transition seconds', transitionSeconds, 0.001, sampleSeconds);
  if ((last - first) / (sampleSeconds * 1000) > 100000)
    throw new RangeError('Search would exceed 100000 samples');
  const intervals: {start: number; end: number; startClipped: boolean; endClipped: boolean}[] = [];
  const cache = new Map<number, boolean>();
  const at = (time: number) => {
    if (!cache.has(time)) {
      const state = visible(time);
      if (typeof state !== 'boolean')
        throw new TypeError('Visibility predicate must return boolean');
      cache.set(time, state);
    }
    return cache.get(time)!;
  };
  let time = first,
    state = at(first),
    active: number | null = state ? first : null;
  while (time < last) {
    const next = Math.min(last, time + sampleSeconds * 1000),
      after = at(next);
    if (state !== after) {
      let lower = time,
        upper = next;
      while (upper - lower > transitionSeconds * 1000) {
        const middle = (lower + upper) / 2;
        if (at(middle) === state) lower = middle;
        else upper = middle;
      }
      const transition = (lower + upper) / 2;
      if (after) active = transition;
      else {
        intervals.push({
          start: active!,
          end: transition,
          startClipped: active === first,
          endClipped: false
        });
        active = null;
      }
    }
    time = next;
    state = after;
  }
  if (active !== null)
    intervals.push({start: active, end: last, startClipped: active === first, endClipped: true});
  return {intervals, evaluations: cache.size, sampleSeconds, transitionSeconds};
}
