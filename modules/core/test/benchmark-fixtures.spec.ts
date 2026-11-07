// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test, expect} from 'vitest';
import {Bench} from 'probe.gl/bench';
import {config, configure} from '@math.gl/core';
import {coreBench} from './bench';

test('core benchmark cases initialize and execute with valid fixtures', async () => {
  const debug = config.debug;
  const suite = coreBench(new Bench({log: () => {}}), false);
  const cases = Object.values(
    (
      suite as unknown as {
        testCases: Record<
          string,
          {
            id: string;
            group: boolean;
            initialize?: () => unknown;
            test?: (context?: unknown) => unknown;
          }
        >;
      }
    ).testCases
  );
  try {
    for (const entry of cases) {
      if (entry.group || !entry.test) continue;
      const context = entry.initialize?.();
      for (let iteration = 0; iteration < 3; iteration++) {
        const value = await entry.test(context);
        if (typeof value === 'number') expect(Number.isFinite(value), entry.id).toBe(true);
        if (Array.isArray(value)) expect(value.every(Number.isFinite), entry.id).toBe(true);
      }
    }
  } finally {
    configure({debug});
  }
});
