// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// biome-ignore lint/correctness/noUnusedImports: Standalone examples use the classic JSX transform.
import React, {useMemo, useState} from 'react';
import {
  createTerrainContours,
  createTerrainGradientGrid,
  createTerrainGradientPyramid
} from '@math.gl/geospatial/terrain';

export default function TerrainAnalysis({field}) {
  const [view, setView] = useState('elevation');
  const [level, setLevel] = useState(0);
  const {pyramid, contours} = useMemo(
    () => ({
      pyramid: createTerrainGradientPyramid(createTerrainGradientGrid(field)),
      contours: createTerrainContours(field, [10, 20, 30])
    }),
    [field]
  );
  const selected = pyramid.levels[level];
  const blocks =
    view === 'slope'
      ? Array.from({length: selected.width * selected.height}, (_, i) => {
          const x = i % selected.width,
            y = Math.floor(i / selected.width),
            size = selected.blockSize;
          const valid = selected.validCounts[i];
          const value = valid
            ? (Math.atan(Math.hypot(selected.gradients[2 * i], selected.gradients[2 * i + 1])) *
                180) /
              Math.PI
            : 0;
          return {
            x: x * size,
            y: y * size,
            w: Math.min(size, 9 - x * size),
            h: Math.min(size, 9 - y * size),
            value,
            valid,
            total: selected.sampleCounts[i]
          };
        })
      : Array.from({length: 81}, (_, i) => {
          const height = field.getHeight(i % 9, Math.floor(i / 9));
          return {
            x: i % 9,
            y: Math.floor(i / 9),
            w: 1,
            h: 1,
            value: height ?? 0,
            valid: height === undefined ? 0 : 1,
            total: 1
          };
        });
  return (
    <section className="terrain-analysis">
      <h3>Terrain analysis</h3>
      <label>
        View{' '}
        <select
          aria-label="Analysis view"
          value={view}
          onChange={event => setView(event.target.value)}
        >
          <option value="elevation">Elevation</option>
          <option value="slope">Slope</option>
          <option value="contours">Contours</option>
        </select>
      </label>
      {view === 'slope' && (
        <label>
          Gradient level{' '}
          <select
            aria-label="Gradient level"
            value={level}
            onChange={event => setLevel(Number(event.target.value))}
          >
            {pyramid.levels.map((item, i) => (
              <option key={i} value={i}>
                {i} ({item.width} × {item.height})
              </option>
            ))}
          </select>
        </label>
      )}
      <svg viewBox="0 0 180 180" role="img" aria-label={`${view} terrain analysis`}>
        {blocks.map((b, i) => (
          <rect
            key={i}
            x={20 * b.x}
            y={180 - 20 * (b.y + b.h)}
            width={20 * b.w}
            height={20 * b.h}
            fill={b.valid ? `hsl(${Math.max(0, 210 - b.value * 4)}, 65%, 45%)` : '#34434a'}
            opacity={b.valid ? 0.35 + (0.65 * b.valid) / b.total : 1}
            stroke="#10212d"
            strokeWidth="0.5"
          />
        ))}
        {view === 'contours' &&
          Array.from({length: contours.levelIndices.length}, (_, i) => {
            const a = contours.segments[2 * i],
              b = contours.segments[2 * i + 1];
            return (
              <line
                key={i}
                x1={10 + contours.positions[3 * a] * 2}
                y1={170 - contours.positions[3 * a + 1] * 2}
                x2={10 + contours.positions[3 * b] * 2}
                y2={170 - contours.positions[3 * b + 1] * 2}
                stroke="#fff"
                strokeWidth="1.5"
              />
            );
          })}
      </svg>
      <p>
        {view === 'slope'
          ? 'Slope of the mean gradient; faded blocks contain missing samples.'
          : view === 'contours'
            ? 'Contours at 10, 20 and 30 m on the triangle surface.'
            : 'Elevation samples in meters; gray means missing.'}
      </p>
    </section>
  );
}
