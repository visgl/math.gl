// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {lookupTimezoneAsync} from '../src/lookup-async';

const state = vi.hoisted(() => ({loads: 0, calls: 0}));
vi.mock('@math.gl/timezone/lookup', () => {
  state.loads++;
  return {
    lookupTimezone: () => {
      state.calls++;
      return 'America/New_York';
    }
  };
});

test('concurrent and repeated lookups reuse the loaded module', async () => {
  expect(state.loads).toBe(0);
  const coordinates = [-74.006, 40.7128] as const;
  expect(
    await Promise.all([lookupTimezoneAsync(coordinates), lookupTimezoneAsync(coordinates)])
  ).toEqual(['America/New_York', 'America/New_York']);
  expect(await lookupTimezoneAsync(coordinates)).toBe('America/New_York');
  expect(state.loads).toBe(1);
  expect(state.calls).toBe(3);
});
