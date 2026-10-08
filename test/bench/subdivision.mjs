// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {performance} from 'node:perf_hooks';
import {subdivideTriangleMesh} from '@math.gl/polygon';

// Run after yarn build. Timings are descriptive, never test assertions.
// These policies perform different work and do not offer equal accuracy guarantees.
const trials = 9;
const warmups = 3;
const maximumEdgeLength = (4096 * 4 * 4) / 360;

/** Compare edge-only and sampled-error policies for an affine tile transform. */
function measureSubdivision(extent, refinement) {
  const mesh = {
    positions: [0, 0, extent, 0, extent, extent, 0, extent],
    indices: [0, 1, 2, 0, 2, 3]
  };
  const options =
    refinement === 'source-edge'
      ? {refinement, maxEdgeLength: maximumEdgeLength}
      : {refinement, maxEdgeLength: maximumEdgeLength, tolerance: 1e-9};
  const times = [];
  let calls = 0;
  let result;
  for (let trial = -warmups; trial < trials; trial++) {
    calls = 0;
    const start = performance.now();
    result = subdivideTriangleMesh(mesh, {
      ...options,
      transform(position) {
        calls++;
        return position;
      }
    });
    if (trial >= 0) times.push(performance.now() - start);
  }
  times.sort((a, b) => a - b);
  return {
    extent,
    refinement,
    medianMilliseconds: Number(times[Math.floor(trials / 2)].toFixed(3)),
    vertices: result.positions.length / 2,
    triangles: result.indices.length / 3,
    transformCalls: calls,
    outputBytes: Object.values(result).reduce((sum, array) => sum + array.byteLength, 0)
  };
}

console.table(
  [128, 4096].flatMap(extent =>
    ['transform-error', 'source-edge'].map(refinement => measureSubdivision(extent, refinement))
  )
);
