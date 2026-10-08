// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {FullProjectionEngine, projectionEngine, parseNTv2Grid} from '@math.gl/projection';
import type {PreparedProjection} from '@math.gl/projection/types';
import {benchmarkGrid} from './benchmark-grid';
import type {BenchmarkScenario} from './live-bench-types';
let gridEngine: FullProjectionEngine | undefined;
export function prepare(scenario: BenchmarkScenario): () => PreparedProjection {
  if (scenario.grid && !gridEngine) {
    gridEngine = new FullProjectionEngine({
      datumGrids: {'benchmark-grid': parseNTv2Grid(benchmarkGrid())}
    });
  }
  const engine = scenario.grid ? gridEngine! : projectionEngine;
  const options = {
    from: scenario.from || 'WGS84',
    to: scenario.to,
    enforceAxis: true
  };
  return () => engine.createProjection(options);
}
