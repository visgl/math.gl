// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// biome-ignore lint/correctness/noUnusedImports: Standalone examples use the classic JSX transform.
import React, {useMemo, useState} from 'react';
import TerrainControls from './terrain-controls';
import {stitchTerrainContours, simplifyTerrainContourPathsTopology} from '@math.gl/geospatial';

/** Compare sampled and topology-preserving simplified heights along the edited center row. */
export default function ContourTopology({field, controlsRoot}) {
  const [local, setLocal] = useState(false);
  const [error, setError] = useState(0);
  const row = Math.floor(field.height / 2);
  const input = useMemo(() => {
    const heights = Array.from({length: field.width}, (_, x) => field.getHeight(x, row));
    const segments = heights.flatMap((height, x) =>
      x && height !== undefined && heights[x - 1] !== undefined ? [x - 1, x] : []
    );
    // Put distance and height in XY so simplification measures error in the section plane.
    // Only connect valid adjacent samples: a missing center must remain a gap.
    return stitchTerrainContours({
      positions: Float64Array.from(heights.flatMap((height, x) => [x, height ?? 0, 0])),
      gridCoordinates: Float64Array.from(heights.flatMap((_, x) => [x, row])),
      segments: Uint32Array.from(segments),
      levels: new Float64Array([0]),
      levelIndices: new Uint32Array(segments.length / 2),
      origin: [0, 0, 0],
      heightReference: 'local-cross-section'
    });
  }, [field, row]);
  const output = useMemo(
    () =>
      simplifyTerrainContourPathsTopology(input, {
        maxError: error,
        rejection: local ? 'path' : 'batch'
      }),
    [input, error, local]
  );
  // Share the map's sample-center X coordinates and one screen scale for distance and height.
  const point = (x, height) => `${0.5 + x},${9 - height}`;
  const draw = (data, color, simplified) =>
    Array.from({length: data.closed.length}, (_, path) => (
      <polyline
        key={path}
        data-section-path={simplified ? 'simplified' : 'sampled'}
        points={Array.from(data.indices.subarray(data.offsets[path], data.offsets[path + 1]), i =>
          point(data.positions[3 * i], data.positions[3 * i + 1])
        ).join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={simplified ? 0.06 : 0.12}
      />
    ));
  return (
    <figure
      className="terrain-mesh-result terrain-cross-section"
      aria-label="Contour topology explorer"
    >
      <figcaption>Center-row cross section</figcaption>
      <TerrainControls target={controlsRoot}>
        <label>
          Contour tolerance: {error}
          <input
            aria-label="Contour topology tolerance"
            type="range"
            min="0"
            max="4"
            step="0.1"
            value={error}
            onChange={event => setError(Number(event.target.value))}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={local}
            onChange={event => setLocal(event.target.checked)}
          />
          Reject unsafe paths locally
        </label>
      </TerrainControls>
      <svg viewBox="0 0 9 9" role="img" aria-label="Sampled and simplified terrain cross section">
        <line data-section-base="" x1="0" y1="9" x2="9" y2="9" stroke="#91a9be" strokeWidth="0.04">
          <title>z = 0</title>
        </line>
        {draw(input, '#687587', false)}
        {draw(output, '#67d5b5', true)}
      </svg>
      <p data-testid="topology-result">
        {output.rejected
          ? 'Unsafe shortcut rejected; sampled profile retained.'
          : 'Safe simplification accepted.'}
        <br />
        {input.indices.length} → {output.indices.length} indices
        <br />
        {output.topologyTests} topology tests
      </p>
      <p>
        <span style={{color: '#91a9be'}}>Sampled heights</span> ·{' '}
        <span style={{color: '#67d5b5'}}>Simplified profile</span>
      </p>
    </figure>
  );
}
