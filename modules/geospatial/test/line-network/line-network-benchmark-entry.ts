// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {buildLineNetwork, type BuildLineNetworkOptions} from '@math.gl/geospatial/line-network';
import {ONE_METRE, getGridSideForSegments, makeGridLines} from './line-network-fixtures';

/** One timed build case. */
export type LineNetworkBenchmarkCase = {
  /** Case name. */
  name: string;
  /** Build options. */
  options: BuildLineNetworkOptions;
};

/** The cases: the default build, interior-vertex splits, and crossings (which build the segment index). */
export const LINE_NETWORK_BENCHMARK_CASES: LineNetworkBenchmarkCase[] = [
  {name: 'default (snap 1 m, junctions 1 m)', options: {snapTolerance: 1}},
  {name: 'splitAtInteriorVertices', options: {snapTolerance: 1, splitAtInteriorVertices: true}},
  {name: 'splitAtCrossings', options: {snapTolerance: 1, splitAtCrossings: true}}
];

/** Builds a jittered street grid with at least `segments` segments. */
export function makeBenchmarkGrid(segments: number) {
  return makeGridLines({
    side: getGridSideForSegments(segments),
    jitterDegrees: 0.2 * ONE_METRE,
    seed: 3
  });
}

/** Times `samples` builds of one case. Returns the times in milliseconds and the graph size. */
export function timeLineNetworkBuild(
  lines: ReturnType<typeof makeBenchmarkGrid>,
  options: BuildLineNetworkOptions,
  samples: number
): {times: number[]; nodeCount: number; edgeCount: number} {
  const times: number[] = [];
  let nodeCount = 0;
  let edgeCount = 0;
  for (let i = 0; i < samples; i++) {
    const start = performance.now();
    const network = buildLineNetwork(lines, options);
    times.push(performance.now() - start);
    nodeCount = network.nodeCount;
    edgeCount = network.edgeCount;
  }
  return {times, nodeCount, edgeCount};
}
