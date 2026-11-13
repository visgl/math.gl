// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// biome-ignore lint/correctness/noUnusedImports: Standalone examples use the classic JSX transform.
import React, {useState} from 'react';
import {createTerrainMixedVertexTileHalos} from '@math.gl/geospatial/terrain';
import data from './assets/pacific-reference.json';

const tile = (column, row, spacing, width) => ({
  column,
  row,
  spacing,
  field: {
    width,
    height: width,
    origin: [column, row],
    columnStep: [spacing, 0],
    rowStep: [0, spacing],
    heights: Float64Array.from(
      {length: width * width},
      (_, i) =>
        data.heights[
          (row + Math.floor(i / width) * spacing) * 33 + column + (i % width) * spacing
        ] ?? NaN
    )
  }
});
const coarse = tile(0, 0, 4, 9);
const fine = [tile(0, 0, 1, 17), tile(16, 0, 1, 17), tile(0, 16, 1, 17), tile(16, 16, 1, 17)];
const steps = [
  'Coarse coverage',
  'First fine tile arrives',
  'Two fine tiles',
  'Three fine tiles',
  'All fine tiles resident',
  'First fine tile evicted',
  'All fine tiles evicted'
];

export default function PacificReplay() {
  const [step, setStep] = useState(1);
  const resident = step === 5 ? fine.slice(1) : step === 6 ? [] : fine.slice(0, step);
  const {tiles} = createTerrainMixedVertexTileHalos([coarse, ...resident]);
  const finest = tiles.slice().reverse();
  let belowZero = 0;
  const cells = [];
  for (const {field, column, row, spacing} of finest) {
    for (let y = 1; y < field.height - 2; y++) {
      for (let x = 1; x < field.width - 2; x++) {
        const index = y * field.width + x;
        const z = field.heights[index];
        const gx = column + (x - 1) * spacing,
          gy = row + (y - 1) * spacing;
        if (
          spacing === 4 &&
          resident.some(t => gx >= t.column && gx < t.column + 16 && gy >= t.row && gy < t.row + 16)
        )
          continue;
        if (field.validity[index] && z < 0) belowZero++;
        const color = !field.validity[index]
          ? '#677686'
          : z < 0
            ? `hsl(208 75% ${Math.max(15, 65 + z / 70)}%)`
            : `hsl(${120 - Math.min(82, z / 25)} 45% ${Math.min(80, 38 + z / 110)}%)`;
        cells.push(
          <rect
            key={`${spacing}/${gx}/${gy}`}
            x={gx}
            y={gy}
            width={spacing}
            height={spacing}
            fill={color}
          />
        );
      }
    }
  }
  return (
    <section aria-label="Pacific bathymetry replay">
      <label>
        Pacific replay step
        <select
          aria-label="Pacific replay step"
          value={step}
          onChange={e => setStep(Number(e.target.value))}
        >
          {steps.map((label, index) => (
            <option key={label} value={index}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <p role="status">
        {tiles.length} resident tiles · {belowZero} displayed below-zero cells
      </p>
      <svg
        viewBox="0 0 32 32"
        role="img"
        aria-label="Pacific topography and bathymetry"
        style={{width: 'min(100%, 520px)', display: 'block'}}
      >
        {cells}
        {resident.map(t => (
          <rect
            key={`${t.column}/${t.row}`}
            x={t.column}
            y={t.row}
            width="16"
            height="16"
            fill="none"
            stroke="#fff1a7"
            strokeWidth=".18"
          />
        ))}
      </svg>
      <p>
        Blue shows negative elevations. Gold outlines fine tiles. Eviction reveals the coarse DEM.
      </p>
      <p>Mapzen / AWS Terrain Tiles. USGS 3DEP, SRTM and GMTED2010; NOAA ETOPO1.</p>
    </section>
  );
}
