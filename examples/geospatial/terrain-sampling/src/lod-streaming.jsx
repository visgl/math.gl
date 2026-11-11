// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// biome-ignore lint/correctness/noUnusedImports: Standalone examples use the classic JSX transform.
import React, {useMemo, useRef, useState} from 'react';
import TerrainControls from './terrain-controls';
import {updateTerrainMixedVertexTileHalos} from '@math.gl/geospatial';
import reference from './assets/sierra-reference.json';
export function TerrainStreaming({controlsRoot}) {
  const [step, setStep] = useState(0);
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
  return (
    <section className="terrain-streaming" aria-label="Terrain streaming">
      <TerrainControls target={controlsRoot}>
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
        <p data-testid="streaming-result">
          {streaming.tiles.length} resident tiles · {streaming.rebuilt.length} rebuilt halos ·{' '}
          {streaming.removed.length} evictions
        </p>
        <p>
          Steps 0–16 load a real Sierra DEM as overlapping local sample patches; 17 edits a tile, 18
          evicts it, 19 restores it. This replay uses unit sample spacing; the qualification report
          uses the declared projected frame. Mapzen/AWS Terrain Tiles; USGS 3DEP/SRTM/GMTED2010 and
          NOAA ETOPO1 provider credits apply.
        </p>
      </TerrainControls>
      <figure className="terrain-streaming-grid">
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
                fill={!resident ? '#687587' : rebuilt.has(key) ? '#ffcb70' : '#63cde2'}
              />
            );
          })}
        </svg>
        <figcaption className="terrain-streaming-legend">
          <span style={{color: '#ffcb70'}}>Rebuilt</span>
          <span style={{color: '#63cde2'}}>Reused</span>
          <span style={{color: '#91a9be'}}>Absent</span>
        </figcaption>
      </figure>
    </section>
  );
}
