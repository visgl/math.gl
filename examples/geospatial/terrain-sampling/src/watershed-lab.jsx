// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// biome-ignore lint/correctness/noUnusedImports: Standalone examples use the classic JSX transform.
import React, {useMemo, useState} from 'react';
import {HeightField, createTerrainRegionalWatersheds} from '@math.gl/geospatial/terrain';
import data from './assets/sierra-watershed.json';
import TerrainControls from './terrain-controls';

const {width, height} = data;
const tileSize = 8;
const samples = Float64Array.from(data.heights, value => value ?? NaN);
const outlets = [samples.findIndex(Number.isFinite), samples.findLastIndex(Number.isFinite)];
const tiles = [];
for (let row = 0; row < height; row += tileSize) {
  for (let column = 0; column < width; column += tileSize) {
    tiles.push({
      column,
      row,
      field: new HeightField({
        width: tileSize,
        height: tileSize,
        registration: 'cell',
        origin: [
          column * data.columnStep[0] + row * data.rowStep[0],
          column * data.columnStep[1] + row * data.rowStep[1]
        ],
        columnStep: data.columnStep,
        rowStep: data.rowStep,
        heightReference: data.heightReference,
        heights: samples,
        offset: row * width + column,
        stride: width
      })
    });
  }
}

/** Color valid samples by contributing area or elevation added by conditioning. */
function cellColor(result, i, mode) {
  if (result.coverage[i] === 0) return '#633e84';
  if (result.coverage[i] === 1) return '#252932';
  if (result.terminal[i] < 0) return '#925b36';
  if (mode === 'Coverage') return result.touchesUnknown[i] ? '#e2ad63' : '#55a9a8';
  const raise = result.field.getHeight(i % width, Math.floor(i / width)) - samples[i];
  const level =
    mode === 'Fill depth'
      ? Math.min(1, Math.log1p(raise) / Math.log1p(100))
      : Math.log1p(result.contributingCells[i]) / Math.log1p(width * height);
  return `hsl(${mode === 'Fill depth' ? 32 : 195} 75% ${22 + 55 * level}%)`;
}

/** Explore conditioning, outlet accumulation and gaps in a pinned Sierra DEM crop. */
export default function WatershedLab({controlsRoot}) {
  const [selection, setSelection] = useState('Both outlets');
  const [gap, setGap] = useState(false);
  const [mode, setMode] = useState('Contributing area');
  const active =
    selection === 'Both outlets' ? outlets : [outlets[selection === 'First outlet' ? 0 : 1]];
  const result = useMemo(
    () =>
      createTerrainRegionalWatersheds(
        gap ? tiles.filter(tile => tile.column !== 16 || tile.row !== 8) : tiles,
        {
          width,
          height,
          origin: [0, 0],
          outlets:
            selection === 'Both outlets' ? outlets : [outlets[selection === 'First outlet' ? 0 : 1]]
        }
      ),
    [gap, selection]
  );
  const paths = useMemo(() => {
    const byColor = new Map();
    for (let i = 0; i < result.coverage.length; i++) {
      const color = cellColor(result, i, mode);
      byColor.set(
        color,
        (byColor.get(color) ?? '') + `M${i % width} ${Math.floor(i / width)}h1v1h-1z`
      );
    }
    return [...byColor];
  }, [result, mode]);
  const area = Math.abs(
    data.columnStep[0] * data.rowStep[1] - data.columnStep[1] * data.rowStep[0]
  );
  return (
    <>
      <TerrainControls target={controlsRoot}>
        <label>
          Watershed outlets
          <select value={selection} onChange={event => setSelection(event.target.value)}>
            {['Both outlets', 'First outlet', 'Second outlet'].map(value => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          Watershed display
          <select value={mode} onChange={event => setMode(event.target.value)}>
            {['Contributing area', 'Fill depth', 'Coverage'].map(value => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label>
          <input type="checkbox" checked={gap} onChange={event => setGap(event.target.checked)} />{' '}
          Remove interior tile
        </label>
      </TerrainControls>
      <h2>Sierra watershed explorer</h2>
      <svg
        viewBox={`-1 -1 ${width + 2} ${height + 2}`}
        role="img"
        aria-label="Sierra watershed map"
      >
        {paths.map(([color, d]) => (
          <path key={color} fill={color} d={d} />
        ))}
        {active.map(index => (
          <circle
            key={index}
            cx={(index % width) + 0.5}
            cy={Math.floor(index / width) + 0.5}
            r={0.8}
            fill="#fff"
            stroke="#111"
            strokeWidth={0.2}
          />
        ))}
      </svg>
      <p data-testid="watershed-coverage">
        {result.coverage.filter(value => value === 0).length} missing cells ·{' '}
        {result.coverage.filter(value => value === 1).length} nodata cells ·{' '}
        {result.touchesUnknown.filter(Boolean).length} valid cells connected to gaps
      </p>
      <p>
        Violet marks missing coverage, charcoal marks known nodata, and brown marks cells
        disconnected from the selected outlets. In Coverage mode, amber marks outlet-connected cells
        whose results may change as gaps fill.
      </p>
      <ul>
        {active.map(index => (
          <li key={index}>
            Outlet at column {index % width}, row {Math.floor(index / width)}:{' '}
            {result.contributingCells[index]} cells (
            {((result.contributingCells[index] * area) / 1e6).toFixed(3)} km²)
          </li>
        ))}
      </ul>
      <p>
        Projected cell area from the pinned Sierra DEM. Flow uses four face neighbors and the window
        edge is closed.
      </p>
    </>
  );
}
