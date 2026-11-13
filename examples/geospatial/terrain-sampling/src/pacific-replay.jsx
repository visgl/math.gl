// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// biome-ignore lint/correctness/noUnusedImports: Standalone examples use the classic JSX transform.
import React, {useMemo, useState} from 'react';
import {
  HeightField,
  TerrainSampleStatus,
  createTerrainMixedVertexTileHalos
} from '@math.gl/geospatial/terrain';
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
  const [azimuth, setAzimuth] = useState(35);
  const [tilt, setTilt] = useState(55);
  const {tiles, heights} = useMemo(() => {
    const active = step === 5 ? fine.slice(1) : step === 6 ? [] : fine.slice(0, step);
    const {tiles} = createTerrainMixedVertexTileHalos([coarse, ...active]);
    const fields = tiles.map(tile => ({...tile, sampler: new HeightField(tile.field)}));
    const heights = Array.from({length: 33 * 33}, (_, index) => {
      const x = index % 33,
        y = Math.floor(index / 33);
      const owner = fields.find(
        t =>
          x >= t.column &&
          y >= t.row &&
          x <= t.column + (t.field.width - 3) * t.spacing &&
          y <= t.row + (t.field.height - 3) * t.spacing
      );
      const sample = owner?.sampler.sample(x, y, {interpolation: 'triangle'});
      return sample?.status === TerrainSampleStatus.VALID ? sample.height : null;
    });
    return {tiles, heights};
  }, [step]);
  const yaw = (azimuth * Math.PI) / 180,
    pitch = (tilt * Math.PI) / 180;
  const vertices = heights.map((z, i) => {
    const x = (i % 33) - 16,
      y = Math.floor(i / 33) - 16;
    const across = x * Math.cos(yaw) - y * Math.sin(yaw);
    const forward = x * Math.sin(yaw) + y * Math.cos(yaw);
    const relief = (z ?? 0) / 500;
    return [
      across,
      forward * Math.cos(pitch) - relief * Math.sin(pitch),
      forward * Math.sin(pitch) + relief * Math.cos(pitch)
    ];
  });
  const faces = [];
  let belowZero = 0;
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const a = y * 33 + x,
        b = a + 1,
        c = a + 33,
        d = c + 1;
      if (heights[a] !== null && heights[a] < 0) belowZero++;
      for (const ids of [
        [a, b, d],
        [a, d, c]
      ]) {
        if (ids.some(id => heights[id] === null)) continue;
        const points = ids.map(id => vertices[id]);
        const z = ids.reduce((sum, id) => sum + heights[id] / 3, 0);
        const color =
          z < 0
            ? `hsl(210 78% ${Math.max(12, 66 + z / 78)}%)`
            : `hsl(${115 - Math.min(78, z / 25)} 42% ${Math.min(80, 41 + z / 115)}%)`;
        faces.push({
          id: faces.length,
          depth: points.reduce((sum, p) => sum + p[2], 0),
          points: points.map(p => `${p[0]},${p[1]}`).join(' '),
          color
        });
      }
    }
  }
  faces.sort((a, b) => a.depth - b.depth);
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
      <label>
        Rotate seafloor
        <input
          aria-label="Rotate seafloor"
          type="range"
          min="-180"
          max="180"
          value={azimuth}
          onChange={e => setAzimuth(Number(e.target.value))}
        />
      </label>
      <label>
        View tilt
        <input
          aria-label="View tilt"
          type="range"
          min="15"
          max="75"
          value={tilt}
          onChange={e => setTilt(Number(e.target.value))}
        />
      </label>
      <svg
        viewBox="-25 -21 50 44"
        role="img"
        aria-label="3D Pacific topography and bathymetry"
        style={{width: 'min(100%, 760px)', display: 'block'}}
      >
        {faces.map(face => (
          <polygon
            key={face.id}
            points={face.points}
            fill={face.color}
            stroke={face.color}
            strokeWidth=".04"
          />
        ))}
        {resident.map(t => {
          const a = t.row * 33 + t.column;
          const perimeter = [];
          for (let i = 0; i < 16; i++) perimeter.push(a + i);
          for (let i = 0; i < 16; i++) perimeter.push(a + 16 + i * 33);
          for (let i = 0; i < 16; i++) perimeter.push(a + 16 * 33 + 16 - i);
          for (let i = 0; i < 16; i++) perimeter.push(a + (16 - i) * 33);
          return (
            <polygon
              key={a}
              points={perimeter.map(i => vertices[i].slice(0, 2).join(',')).join(' ')}
              fill="none"
              stroke="#ffdf91"
              strokeWidth=".12"
            />
          );
        })}
      </svg>
      <p>
        Darker blue means deeper water. Relief is exaggerated to reveal the shape of the seafloor.
        Gold outlines resident fine tiles.
      </p>
      <p>Mapzen / AWS Terrain Tiles. USGS 3DEP, SRTM and GMTED2010; NOAA ETOPO1.</p>
    </section>
  );
}
