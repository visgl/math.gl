// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {performance} from 'node:perf_hooks';
import {createSkyContext} from '../dist/astronomy.js';
import {createSkyObserver} from '../dist/index.js';

const observer = createSkyObserver({latitude: 37.8, longitude: -122.4});
const context = createSkyContext(observer, {cacheSize: 48});
const dates = Array.from({length: 48}, (_, i) => Date.UTC(2024, 0, 18) + i * 3600000);
const measure = operation => {
  const start = performance.now();
  operation();
  return performance.now() - start;
};
const coldMilliseconds = measure(() => context.getSnapshots(dates));
const warmMilliseconds = measure(() => context.getSnapshots(dates));
process.stdout.write(JSON.stringify({snapshots: dates.length, coldMilliseconds, warmMilliseconds, ...context.getStatistics()}, null, 2) + '\n');
