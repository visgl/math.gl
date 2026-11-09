// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// biome-ignore lint/correctness/noUnusedImports: Standalone examples use the classic JSX transform.
import React, {useMemo, useState} from 'react';
import {
  HeightField,
  createTerrainLodMorph,
  evaluateTerrainLodMorph,
  coordinateTerrainLodMorphs,
  createTerrainMixedIsobands
} from '@math.gl/geospatial';
const z = (x, y) => 3 + 0.2 * x + Math.sin(y * 0.7) + Math.cos(x * 0.4);
export default function CoordinatedTransitions() {
  const [ratio, setRatio] = useState(2),
    [coarseFactor, setCoarseFactor] = useState(0),
    [fineFactor, setFineFactor] = useState(1),
    [missing, setMissing] = useState(false);
  const {surface, bands, corner} = useMemo(() => {
    const make = (column, row, spacing, factor) => {
      const fine = new HeightField({
        width: 5,
        height: 5,
        origin: [column, row],
        columnStep: [spacing, 0],
        rowStep: [0, spacing],
        heights: Float64Array.from({length: 25}, (_, i) =>
          z(column + (i % 5) * spacing, row + Math.floor(i / 5) * spacing)
        )
      });
      const heights = Float64Array.from({length: 9}, (_, i) =>
        z(column + (i % 3) * spacing * 2, row + Math.floor(i / 3) * spacing * 2)
      );
      if (missing && column < 0) heights[5] = NaN;
      const coarse = new HeightField({
        width: 3,
        height: 3,
        origin: [column, row],
        columnStep: [2 * spacing, 0],
        rowStep: [0, 2 * spacing],
        heights
      });
      return {column, row, spacing, morph: createTerrainLodMorph(fine, coarse, {ratio: 2}), factor};
    };
    const tiles = [
      make(-4 * ratio, 0, ratio, coarseFactor),
      make(0, 0, 1, fineFactor),
      make(0, 4, 1, 1 - fineFactor)
    ];
    const surface = coordinateTerrainLodMorphs(tiles);
    const bands = createTerrainMixedIsobands(
      tiles.map(t => ({
        column: t.column,
        row: t.row,
        spacing: t.spacing,
        field: {
          ...evaluateTerrainLodMorph(t.morph, t.factor),
          width: 5,
          height: 5,
          origin: t.morph.origin,
          columnStep: t.morph.columnStep,
          rowStep: t.morph.rowStep
        }
      })),
      [-10, 3, 5, 20],
      {maxHeightAdjustment: Infinity}
    );
    const a = surface.tiles.find(t => t.column < 0),
      b = surface.tiles.find(t => t.column === 0 && t.row === 0),
      c = surface.tiles.find(t => t.row === 4),
      ids = [4 * a.field.width + a.field.width - 1, 20, 0],
      samples = [a, b, c];
    const corner = samples.every((t, i) => t.field.validity[ids[i]])
      ? Math.max(...samples.map((t, i) => t.field.heights[ids[i]])) -
        Math.min(...samples.map((t, i) => t.field.heights[ids[i]]))
      : null;
    return {surface, bands, corner};
  }, [ratio, coarseFactor, fineFactor, missing]);
  const point = i =>
    `${20 + (bands.positions[2 * i] + 4 * ratio) * 25},${20 + bands.positions[2 * i + 1] * 25}`;
  return (
    <section
      className="terrain-analysis terrain-seam-explorer"
      aria-label="Coordinated transitions and mixed bands"
    >
      <h2>Coordinated transitions and mixed bands</h2>
      <label>
        Mixed seam ratio
        <select
          aria-label="Mixed seam ratio"
          value={ratio}
          onChange={e => setRatio(Number(e.target.value))}
        >
          <option value={2}>2:1</option>
          <option value={4}>4:1</option>
        </select>
      </label>
      {[
        ['Coarse morph factor', coarseFactor, setCoarseFactor],
        ['Fine morph factor', fineFactor, setFineFactor]
      ].map(([label, value, set]) => (
        <label key={label}>
          {label}: {value.toFixed(2)}
          <input
            aria-label={label}
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={value}
            onChange={e => set(Number(e.target.value))}
          />
        </label>
      ))}
      <label>
        <input type="checkbox" checked={missing} onChange={e => setMissing(e.target.checked)} />
        Missing shared coarse support
      </label>
      <svg
        viewBox={`0 0 ${(4 * ratio + 4) * 25 + 40} ${4 * ratio * 25 + 40}`}
        role="img"
        aria-label="Elevation bands across coordinated coarse and fine tiles"
      >
        {[0, 1, 2].map(b => (
          <path
            key={b}
            d={Array.from(bands.bandIndices, (_, r) => r)
              .filter(r => bands.bandIndices[r] === b)
              .map(
                r =>
                  `M${Array.from(bands.indices.subarray(bands.offsets[r], bands.offsets[r + 1]), point).join(' ')}Z`
              )
              .join(' ')}
            fill={['#367c93', '#67d5b5', '#ffcb70'][b]}
            fillRule="evenodd"
          />
        ))}
        <line
          x1={20 + 4 * ratio * 25}
          x2={20 + 4 * ratio * 25}
          y1="20"
          y2={20 + 4 * ratio * 25}
          stroke="#fff"
          strokeDasharray="4 4"
        />
        <line
          x1={20 + 4 * ratio * 25}
          x2={20 + (4 * ratio + 4) * 25}
          y1="120"
          y2="120"
          stroke="#fff"
          strokeDasharray="4 4"
        />
      </svg>
      <p data-testid="coordinated-result">
        Shared corner delta: {corner === null ? 'unavailable' : corner.toFixed(6)} · maximum nodal
        adjustment {surface.maxHeightAdjustment.toFixed(3)} ·{' '}
        {surface.tiles.reduce((n, t) => n + t.field.width * t.field.height, 0)} transition samples
      </p>
      <p>
        Independent factors share a coarse-owned boundary and corner. Bands describe the reconciled
        displayed surface. Missing support masks incident edges conservatively. This bounded
        reference tessellation densifies coarse patches; it does not certify normals or replace a
        sparse renderer's LOD scheduler.
      </p>
    </section>
  );
}
