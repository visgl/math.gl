// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {makeNTv2} from './fixtures/datum-grids';

/** Smooth synthetic field spanning multiple cells; setup is excluded from timing. */
export function benchmarkGrid(): ArrayBuffer {
  return makeNTv2([{size: 65, step: 3 / 64, shift: (x, y) => [2 + x * 0.1, 1 + y * 0.2]}]);
}
