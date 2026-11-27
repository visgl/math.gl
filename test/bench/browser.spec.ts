// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {test} from 'vitest';
// @ts-expect-error probe.gl/bench does not expose declarations through its exports.
import {Bench} from 'probe.gl/bench';
import addBenchmarks from './modules.bench';

test('math.gl browser benchmarks', async () => {
  await addBenchmarks(new Bench(), false).calibrate().run();
}, 300_000);
