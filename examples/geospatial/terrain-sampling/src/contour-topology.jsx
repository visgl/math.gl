// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// biome-ignore lint/correctness/noUnusedImports: Standalone examples use the classic JSX transform.
import React, {useMemo, useState} from 'react';
import {stitchTerrainContours, simplifyTerrainContourPathsTopology} from '@math.gl/geospatial';
export default function ContourTopology() {
  const [local, setLocal] = useState(false);
  const [error, setError] = useState(0),
    [obstacle, setObstacle] = useState(true);
  const {input, output} = useMemo(() => {
    const input = stitchTerrainContours({
      positions: new Float64Array([
        0, 0, 0, 2, 3, 0, 4, 0, 0, 1.8, 1, 0, 2.2, 1, 0, 5, 0, 0, 6, 0.1, 0, 7, 0, 0
      ]),
      gridCoordinates: new Float64Array(16),
      segments: Uint32Array.from(
        obstacle ? [0, 1, 1, 2, 3, 4, 5, 6, 6, 7] : [0, 1, 1, 2, 5, 6, 6, 7]
      ),
      levels: new Float64Array([0]),
      levelIndices: new Uint32Array(obstacle ? 5 : 4),
      origin: [0, 0, 0],
      heightReference: 'local'
    });
    return {
      input,
      output: simplifyTerrainContourPathsTopology(input, {
        maxError: error,
        rejection: local ? 'path' : 'batch'
      })
    };
  }, [error, obstacle, local]);
  const draw = (data, color) =>
    Array.from({length: data.closed.length}, (_, p) => (
      <polyline
        key={p}
        points={Array.from(
          data.indices.subarray(data.offsets[p], data.offsets[p + 1]),
          i => `${30 + data.positions[3 * i] * 70},${260 - data.positions[3 * i + 1] * 70}`
        ).join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="3"
      />
    ));
  return (
    <section
      className="terrain-analysis terrain-seam-explorer"
      aria-label="Contour topology explorer"
    >
      <h2>Contour topology explorer</h2>
      <label>
        <input type="checkbox" checked={local} onChange={e => setLocal(e.target.checked)} />
        Reject unsafe paths locally
      </label>
      <label>
        Contour tolerance: {error}
        <input
          aria-label="Contour topology tolerance"
          type="range"
          min="0"
          max="4"
          step="0.1"
          value={error}
          onChange={e => setError(Number(e.target.value))}
        />
      </label>
      <label>
        <input type="checkbox" checked={obstacle} onChange={e => setObstacle(e.target.checked)} />
        Preserve neighboring component
      </label>
      <svg viewBox="0 0 600 300" role="img" aria-label="Original and topology-preserved contours">
        {draw(input, '#687587')}
        {draw(output, '#67d5b5')}
      </svg>
      <p data-testid="topology-result">
        {output.rejected
          ? 'Unsafe shortcut rejected; original geometry retained.'
          : 'Safe simplification accepted.'}{' '}
        {output.indices.length} indices · {output.topologyTests} topology tests
      </p>
      <p>
        At high tolerance, removing the peak would sweep the neighboring component. Disable that
        component to see the shortcut accepted.
      </p>
    </section>
  );
}
