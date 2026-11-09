// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// biome-ignore lint/correctness/noUnusedImports: Standalone examples use the classic JSX transform.
import React, {useMemo, useState} from 'react';
import {
  HeightField,
  createTerrainMixedVertexTileHalos,
  createTerrainGradientGrid
} from '@math.gl/geospatial';

export default function SeamExplorer() {
  const [ratio, setRatio] = useState(2);
  const [resident, setResident] = useState(true);
  const [missing, setMissing] = useState(false);
  const [surface, setSurface] = useState('plane');
  const [method, setMethod] = useState('horn');
  const tiles = useMemo(() => {
    const make = (column, spacing) => ({
      column,
      row: 0,
      spacing,
      field: {
        width: 9,
        height: 9,
        origin: [column, 0],
        columnStep: [spacing, 0],
        rowStep: [0, spacing],
        heights: Float64Array.from({length: 81}, (_, i) => {
          const x = column + (i % 9) * spacing,
            y = Math.floor(i / 9) * spacing;
          return surface === 'plane' ? 2 * x + y : 0.04 * x ** 3 + 0.1 * y ** 2;
        }),
        validity: Uint8Array.from({length: 81}, (_, i) =>
          missing && column < 0 && i === 17 ? 0 : 1
        )
      }
    });
    return createTerrainMixedVertexTileHalos([
      make(0, 1),
      ...(resident ? [make(-8 * ratio, ratio)] : [])
    ]).tiles;
  }, [ratio, resident, missing, surface]);
  const fine = tiles[0],
    grid = createTerrainGradientGrid(new HeightField(fine.field), {method});
  const coarseGrid = tiles[1]
    ? createTerrainGradientGrid(new HeightField(tiles[1].field), {method})
    : null;
  const colors = ['#687587', '#e97574', '#67d5b5'];
  return (
    <section
      className="terrain-analysis terrain-seam-explorer"
      aria-label="Mixed-resolution seam explorer"
    >
      <h2>Mixed-resolution seam explorer</h2>
      <p>
        Fine tile at right; coarse neighbor at left. Dots show the fine tile’s one-node halo. Green:
        valid · red: nodata · gray: not resident.
      </p>
      <label>
        Seam ratio{' '}
        <select value={ratio} onChange={e => setRatio(Number(e.target.value))}>
          <option value={2}>2:1</option>
          <option value={4}>4:1</option>
        </select>
      </label>
      <label>
        Seam surface{' '}
        <select value={surface} onChange={e => setSurface(e.target.value)}>
          <option value="plane">Plane</option>
          <option value="curved">Curved</option>
        </select>
      </label>
      <label>
        Seam derivative{' '}
        <select value={method} onChange={e => setMethod(e.target.value)}>
          <option value="horn">Horn</option>
          <option value="zevenbergen-thorne">Zevenbergen–Thorne</option>
        </select>
      </label>
      <label>
        <input type="checkbox" checked={resident} onChange={e => setResident(e.target.checked)} />
        Coarse neighbor resident
      </label>
      <label>
        <input type="checkbox" checked={missing} onChange={e => setMissing(e.target.checked)} />
        Coarse neighbor nodata
      </label>
      <svg
        viewBox="0 0 600 340"
        role="img"
        aria-label="Fine tile halo residency and derivative arrows"
      >
        <rect x="20" y="20" width="120" height="280" fill="#20394a" />
        <rect x="140" y="20" width="280" height="280" fill="#163e40" />
        <line x1="140" x2="140" y1="20" y2="300" stroke="#fff" strokeDasharray="4 4" />
        {Array.from(fine.statuses, (status, i) => {
          const x = 140 + ((i % 11) - 1) * 30,
            y = 40 + (Math.floor(i / 11) - 1) * 25;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="4" fill={colors[status]} />
              {grid.statuses[i] === 0 && (
                <line
                  x1={x}
                  y1={y}
                  x2={x + Math.max(-20, Math.min(20, grid.gradients[i * 2] * 5))}
                  y2={y + Math.max(-20, Math.min(20, grid.gradients[i * 2 + 1] * 5))}
                  stroke="#ffcb70"
                />
              )}
            </g>
          );
        })}
      </svg>
      <table>
        <thead>
          <tr>
            <th>Fine seam Y</th>
            <th>Gradient X</th>
            <th>Gradient Y</th>
            <th>Coarse gradient (X, Y)</th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4, 5, 6, 7].map(y => {
            const i = (y + 1) * 11 + 1;
            const coarseIndex = (y / ratio + 1) * 11 + 9;
            return (
              <tr key={y}>
                <td>{y}</td>
                <td>{grid.statuses[i] === 0 ? grid.gradients[i * 2].toFixed(3) : 'Unavailable'}</td>
                <td>
                  {grid.statuses[i] === 0 ? grid.gradients[i * 2 + 1].toFixed(3) : 'Unavailable'}
                </td>
                <td>
                  {y % ratio
                    ? 'No coarse node'
                    : coarseGrid?.statuses[coarseIndex] === 0
                      ? `${coarseGrid.gradients[coarseIndex * 2].toFixed(3)}, ${coarseGrid.gradients[coarseIndex * 2 + 1].toFixed(3)}`
                      : 'Unavailable'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p>
        Plane gradients remain (2, 1) across either ratio. Curved surfaces expose interpolation and
        stencil-scale differences: halos supply samples, not a guarantee of identical coarse and
        fine normals. Missing or invalid neighbors leave derivatives unavailable. Arrow components
        are clipped for display.
      </p>
    </section>
  );
}
