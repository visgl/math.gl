// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// biome-ignore lint/correctness/noUnusedImports: Standalone examples use the classic JSX transform.
import React, {useMemo, useState} from 'react';
import {
  HeightField,
  createTerrainContours,
  createTerrainGradientGrid,
  createTerrainGradientPyramid,
  weldTerrainContourTiles,
  diagnoseTerrainContourBoundaries
} from '@math.gl/geospatial/terrain';

export default function TerrainAnalysis({field}) {
  const [view, setView] = useState('elevation');
  const [level, setLevel] = useState(0);
  const [enabled, setEnabled] = useState([true, true, true, true]);
  const {pyramid, contours, diagnostics} = useMemo(
    () => ({
      pyramid: createTerrainGradientPyramid(createTerrainGradientGrid(field)),
      ...createTileContours(field, enabled)
    }),
    [field, enabled]
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
      {view === 'contours' && (
        <div className="contour-tiles">
          {enabled.map((checked, i) => (
            <label key={i}>
              <input
                type="checkbox"
                aria-label={`Contour tile ${i + 1}`}
                checked={checked}
                onChange={event =>
                  setEnabled(enabled.map((value, j) => (j === i ? event.target.checked : value)))
                }
              />{' '}
              Tile {i + 1}
            </label>
          ))}
        </div>
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
          contours &&
          Array.from({length: contours.levelIndices.length}, (_, i) => {
            const a = contours.segments[2 * i],
              b = contours.segments[2 * i + 1];
            return (
              <line
                key={i}
                data-contour-segment=""
                x1={10 + contours.gridCoordinates[2 * a] * 20}
                y1={170 - contours.gridCoordinates[2 * a + 1] * 20}
                x2={10 + contours.gridCoordinates[2 * b] * 20}
                y2={170 - contours.gridCoordinates[2 * b + 1] * 20}
                stroke="#fff"
                strokeWidth="1.5"
              />
            );
          })}
        {view === 'contours' && (
          <g stroke="#ffcd70" strokeDasharray="3 3">
            <line x1="90" y1="10" x2="90" y2="170" />
            <line x1="10" y1="90" x2="170" y2="90" />
          </g>
        )}
        {view === 'contours' &&
          contours &&
          diagnostics &&
          [...diagnostics.vertexIndices].map((vertex, i) => (
            <circle
              key={vertex}
              data-boundary-diagnostic=""
              cx={10 + contours.gridCoordinates[2 * vertex] * 20}
              cy={170 - contours.gridCoordinates[2 * vertex + 1] * 20}
              r="3"
              fill={diagnostics.degrees[i] === 1 ? '#ffbd59' : '#ff5964'}
            />
          ))}
      </svg>
      <p data-testid="analysis-description">
        {view === 'slope'
          ? 'Slope of the mean gradient; faded blocks contain missing samples.'
          : view === 'contours'
            ? `Contours at 10, 20 and 30 m. ${diagnostics?.vertexIndices.length ?? 0} open endpoints or junctions on tile lines (amber: endpoint; red: junction). These can reflect dataset edges, missing tiles or nodata.`
            : 'Elevation samples in meters; gray means missing.'}
      </p>
    </section>
  );
}

function createTileContours(field, enabled) {
  const tiles = enabled.flatMap((on, i) => {
    if (!on) return [];
    const column = i % 2,
      row = Math.floor(i / 2),
      x0 = 4 * column,
      y0 = 4 * row;
    const heights = Float64Array.from(
      {length: 25},
      (_, j) => field.getHeight(x0 + (j % 5), y0 + Math.floor(j / 5)) ?? NaN
    );
    const tile = new HeightField({
      width: 5,
      height: 5,
      heights,
      origin: [
        field.origin[0] + x0 * field.columnStep[0] + y0 * field.rowStep[0],
        field.origin[1] + x0 * field.columnStep[1] + y0 * field.rowStep[1]
      ],
      columnStep: field.columnStep,
      rowStep: field.rowStep,
      diagonal: field.diagonal,
      heightReference: field.heightReference
    });
    return [{column, row, contours: createTerrainContours(tile, [10, 20, 30])}];
  });
  if (!tiles.length) return {contours: null, diagnostics: null};
  const contours = weldTerrainContourTiles(tiles, {width: 5, height: 5});
  return {contours, diagnostics: diagnoseTerrainContourBoundaries(contours, {width: 5, height: 5})};
}
