// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// biome-ignore lint/correctness/noUnusedImports: Standalone examples use the classic JSX transform.
import React, {useMemo, useRef, useState} from 'react';
import {
  HeightField,
  createTerrainLodMorph,
  evaluateTerrainLodMorph,
  updateTerrainMixedVertexTileHalos
} from '@math.gl/geospatial';
import reference from './assets/sierra-reference.json';
const height = (x, y) =>
  8 * Math.exp(-((x - 7.3) ** 2 + (y - 8.1) ** 2) / 9) + Math.sin(x * 1.4) * 0.5;
export default function LodStreaming() {
  const [ratio, setRatio] = useState(2),
    [factor, setFactor] = useState(0),
    [missing, setMissing] = useState(false),
    [step, setStep] = useState(0);
  const fine = useMemo(
    () =>
      new HeightField({
        width: 17,
        height: 17,
        heights: Float64Array.from({length: 289}, (_, i) => height(i % 17, Math.floor(i / 17)))
      }),
    []
  );
  const morph = useMemo(() => {
    const size = 16 / ratio + 1,
      heights = Float64Array.from({length: size * size}, (_, i) =>
        height((i % size) * ratio, Math.floor(i / size) * ratio)
      );
    if (missing) heights[Math.floor(size / 2) * size + Math.floor(size / 2)] = NaN;
    return createTerrainLodMorph(
      fine,
      new HeightField({
        width: size,
        height: size,
        heights,
        columnStep: [ratio, 0],
        rowStep: [0, ratio]
      }),
      {ratio}
    );
  }, [fine, ratio, missing]);
  const evaluated = useMemo(() => evaluateTerrainLodMorph(morph, factor), [morph, factor]);
  const tiles = useMemo(
    () =>
      Array.from({length: 16}, (_, i) => {
        const column = (i % 4) * 8,
          row = Math.floor(i / 4) * 8;
        return {
          column,
          row,
          spacing: 1,
          field: {
            width: 9,
            height: 9,
            origin: [column, row],
            heights: Float64Array.from(
              {length: 81},
              (_, j) => reference.heights[(row + Math.floor(j / 9)) * 33 + column + (j % 9)] ?? NaN
            )
          }
        };
      }),
    []
  );
  const cache = useRef(null);
  const streaming = useMemo(() => {
    let resident = tiles.slice(0, Math.min(step, 16));
    if (step === 17) {
      const t = resident[5],
        heights = t.field.heights.slice();
      heights[40] += 100;
      resident = resident.map((v, i) => (i === 5 ? {...t, field: {...t.field, heights}} : v));
    }
    if (step === 18) resident = resident.filter((_, i) => i !== 5);
    cache.current = updateTerrainMixedVertexTileHalos(cache.current, resident);
    return cache.current;
  }, [step, tiles]);
  const rebuilt = new Set(streaming.rebuilt);
  const point = (x, z) => [20 + x * 32, 260 - z * 24];
  return (
    <section
      className="terrain-analysis terrain-seam-explorer"
      aria-label="LOD transitions and streaming"
    >
      <h2>LOD transitions and streaming</h2>
      <label>
        LOD ratio
        <select
          aria-label="LOD ratio"
          value={ratio}
          onChange={e => setRatio(Number(e.target.value))}
        >
          <option value={2}>2:1</option>
          <option value={4}>4:1</option>
        </select>
      </label>
      <label>
        Morph factor: {factor.toFixed(2)}
        <input
          aria-label="Terrain morph factor"
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={factor}
          onChange={e => setFactor(Number(e.target.value))}
        />
      </label>
      <label>
        <input type="checkbox" checked={missing} onChange={e => setMissing(e.target.checked)} />
        Missing coarse sample
      </label>
      <svg viewBox="0 0 560 290" role="img" aria-label="Fine and morphed terrain profiles">
        {Array.from({length: 16}, (_, x) => {
          const a = 8 * 17 + x,
            b = a + 1,
            p = point(x, fine.getHeight(x, 8)),
            q = point(x + 1, fine.getHeight(x + 1, 8)),
            u = point(x, evaluated.heights[a]),
            v = point(x + 1, evaluated.heights[b]);
          return (
            <g key={x}>
              <line x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke="#687587" strokeWidth="2" />
              {evaluated.validity[a] && evaluated.validity[b] ? (
                <line x1={u[0]} y1={u[1]} x2={v[0]} y2={v[1]} stroke="#ffcb70" strokeWidth="3" />
              ) : null}
            </g>
          );
        })}
      </svg>
      <p data-testid="lod-result">
        Factor {factor.toFixed(2)} · {evaluated.validity.filter(v => v).length}/289 morphable nodes
        · maximum nodal displacement {morph.maxNodalDisplacement.toFixed(3)}
      </p>
      <p>
        Gray: fine profile. Gold: uniform morph toward the coarse triangle surface. Missing coarse
        coverage leaves gaps. Nodal displacement is not a continuous error certificate; coordinated
        cross-tile morph schedules and normals are consumer responsibilities.
      </p>
      <label>
        Streaming step: {step}
        <input
          aria-label="Terrain streaming step"
          type="range"
          min="0"
          max="19"
          step="1"
          value={step}
          onChange={e => setStep(Number(e.target.value))}
        />
      </label>
      <svg viewBox="0 0 240 240" role="img" aria-label="Resident and rebuilt terrain tiles">
        {tiles.map((tile, i) => {
          const key = `1/${tile.column}/${tile.row}`,
            resident = streaming.tiles.some(t => t.column === tile.column && t.row === tile.row);
          return (
            <rect
              key={i}
              x={(i % 4) * 60 + 2}
              y={Math.floor(i / 4) * 60 + 2}
              width="56"
              height="56"
              fill={!resident ? '#687587' : rebuilt.has(key) ? '#ffcb70' : '#67d5b5'}
            />
          );
        })}
      </svg>
      <p data-testid="streaming-result">
        {streaming.tiles.length} resident tiles · {streaming.rebuilt.length} rebuilt halos ·{' '}
        {streaming.removed.length} evictions
      </p>
      <p>
        Steps 0–16 load a real Sierra DEM as overlapping local sample patches; 17 edits a tile, 18
        evicts it, 19 restores it. Gold: rebuilt, green: reused, gray: absent. This replay uses unit
        sample spacing; the qualification report uses the declared projected frame. Mapzen/AWS
        Terrain Tiles; USGS 3DEP/SRTM/GMTED2010 and NOAA ETOPO1 provider credits apply.
      </p>
    </section>
  );
}
