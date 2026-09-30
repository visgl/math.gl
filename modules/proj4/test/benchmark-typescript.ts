// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {Projection} from '@math.gl/proj4';
import {benchmarkGrid} from './benchmark-grid';
import type {BenchmarkScenario} from './live-bench-types';
let prepared = false;
export function prepare(scenario: BenchmarkScenario): () => Projection {
  if (scenario.grid && !prepared) {
    Projection.registerDatumGrid('benchmark-grid', benchmarkGrid());
    prepared = true;
  }
  const options = {from: scenario.from || 'WGS84', to: scenario.to, enforceAxis: true};
  return () => new Projection(options);
}
