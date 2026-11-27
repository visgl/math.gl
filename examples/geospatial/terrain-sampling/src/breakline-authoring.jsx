// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, {useState} from 'react';
import {splitTerrainBreaklines} from '@math.gl/geospatial/terrain';
import TerrainControls from './terrain-controls';

export default function BreaklineAuthoring({controlsRoot}) {
  const [column, setColumn] = useState(2);
  const [height, setHeight] = useState(0);
  const lines = [
    [
      [0.5, 2, 0],
      [3.5, 2, 0]
    ],
    [
      [column, 0.5, height],
      [column, 3.5, height]
    ],
    [
      [3, 2, 0],
      [3, 3, 0]
    ]
  ];
  let result, error;
  try {
    result = splitTerrainBreaklines(lines);
  } catch (failure) {
    error = failure.message;
  }
  const colors = ['#78d8ff', '#ffcc77', '#a6e79f'];
  return (
    <section aria-label="Terrain breakline authoring">
      <TerrainControls target={controlsRoot}>
        <label>
          Ridge column
          <input
            aria-label="Ridge column"
            type="range"
            min="1"
            max="2.75"
            step="0.25"
            value={column}
            onChange={e => setColumn(Number(e.target.value))}
          />
        </label>
        <label>
          Ridge height
          <input
            aria-label="Ridge height"
            type="range"
            min="0"
            max="3"
            step="0.25"
            value={height}
            onChange={e => setHeight(Number(e.target.value))}
          />
        </label>
      </TerrainControls>
      <p role="status">
        {error || `${result.segments.length} segments. Colors identify their source lines.`}
      </p>
      <svg viewBox="0 0 4 4" role="img" aria-label="Breakline intersections">
        {(result?.segments ?? lines).map(([a, b], i) => (
          <g key={i} stroke={colors[result?.sourceSegments[i] ?? i]}>
            <line x1={a[0]} y1={4 - a[1]} x2={b[0]} y2={4 - b[1]} strokeWidth="0.035" />
            <circle cx={a[0]} cy={4 - a[1]} r="0.045" />
            <circle cx={b[0]} cy={4 - b[1]} r="0.045" />
          </g>
        ))}
      </svg>
    </section>
  );
}
