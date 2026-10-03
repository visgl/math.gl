// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import proj4 from 'proj4';
import {benchmarkGrid} from './benchmark-grid';
import type {BenchmarkScenario} from './live-bench-types';
let prepared = false;
export function prepare(scenario: BenchmarkScenario) {
  if (scenario.grid && !prepared) {
    proj4.nadgrid('benchmark-grid', benchmarkGrid());
    prepared = true;
  }
  return () => {
    const converter = proj4(scenario.from || 'WGS84', scenario.to);
    return {
      project: (point: number[]) => converter.forward(point, true),
      unproject: (point: number[]) => converter.inverse(point, true)
    };
  };
}
