// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// biome-ignore lint/correctness/noUnusedImports: Standalone examples use the classic JSX transform.
import React, {useMemo, useRef, useState} from 'react';
import TerrainControls from './terrain-controls';
import ContourTopology from './contour-topology';
import {
  HeightField,
  createTerrainIsobands,
  updateTerrainMeshes,
  updateTerrainBounds,
  updateTerrainGradientPyramids,
  updateTerrainMixedVertexTileHalos,
  updateTerrainMixedGradientGrids
} from '@math.gl/geospatial';
export default function BandsUpdates({controlsRoot}) {
  const [peak, setPeak] = useState(4),
    [band, setBand] = useState(2);
  const hole = peak === 0;
  const cache = useRef({meshes: null, bounds: null, pyramids: null, halos: null, gradients: null});
  const distant = useMemo(
    () => ({
      id: 'distant',
      field: new HeightField({width: 9, height: 9, origin: [20, 0], heights: new Float64Array(81)})
    }),
    []
  );
  const result = useMemo(() => {
    const heights = Float64Array.from(
      {length: 81},
      (_, i) => 4 * Math.exp(-(((i % 9) - 4) ** 2 + (Math.floor(i / 9) - 4) ** 2) / 6)
    );
    heights[40] = hole ? NaN : peak;
    const props = {width: 9, height: 9, heights},
      field = new HeightField(props),
      sources = [{id: 'brush', field}, distant];
    const prior = cache.current;
    const meshes = updateTerrainMeshes(prior.meshes, sources),
      bounds = updateTerrainBounds(prior.bounds, sources);
    const halos = updateTerrainMixedVertexTileHalos(prior.halos, [
      {column: 0, row: 0, spacing: 1, field: props},
      {
        column: 20,
        row: 0,
        spacing: 1,
        field: {width: 9, height: 9, origin: [20, 0], heights: new Float64Array(81)}
      }
    ]);
    const gradients = updateTerrainMixedGradientGrids(prior.gradients, halos),
      pyramids = updateTerrainGradientPyramids(prior.pyramids, gradients);
    cache.current = {meshes, bounds, halos, gradients, pyramids};
    return {
      field,
      range: bounds[0].data.query().heightRange,
      triangles: meshes[0].data.indices.length / 3,
      pyramidLevels: pyramids[0].data.levels.length
    };
  }, [peak, hole, distant]);
  const bands = useMemo(
    () => createTerrainIsobands([result.field], [0, band, 10]),
    [result.field, band]
  );
  const path = r =>
    Array.from(
      bands.indices.subarray(bands.offsets[r], bands.offsets[r + 1]),
      i => `${0.5 + bands.positions[2 * i]},${8.5 - bands.positions[2 * i + 1]}`
    ).join(' ');
  return (
    <section
      className="terrain-analysis terrain-seam-explorer"
      aria-label="Isobands and terrain edits"
    >
      <TerrainControls target={controlsRoot}>
        <label>
          Brush peak: {hole ? 'missing' : peak.toFixed(1)}
          <input
            aria-label="Terrain brush peak"
            type="range"
            min="0"
            max="9"
            aria-valuetext={hole ? 'Missing center sample' : String(peak)}
            step="1"
            value={peak}
            onChange={e => setPeak(Number(e.target.value))}
          />
        </label>
        <label>
          Band boundary
          <input
            aria-label="Isoband boundary"
            type="range"
            min="0.5"
            max="8"
            step="0.5"
            value={band}
            onChange={e => setBand(Number(e.target.value))}
          />
        </label>
      </TerrainControls>
      <div className="terrain-edit-comparison">
        <figure className="terrain-mesh-result">
          <figcaption>Height map</figcaption>
          <svg viewBox="0 0 9 9" role="img" aria-label="Edited terrain height map">
            {Array.from({length: 81}, (_, i) => {
              const x = i % 9;
              const y = Math.floor(i / 9);
              const height = result.field.getHeight(x, y);
              // A fixed 0–9 scale keeps unchanged samples the same color during edits.
              return (
                <rect
                  key={i}
                  x={x}
                  y={8 - y}
                  width="1"
                  height="1"
                  data-height-sample=""
                  data-edited-sample={i === 40 ? '' : undefined}
                  fill={
                    height === undefined ? '#687587' : `hsl(${220 - (height / 9) * 180},65%,45%)`
                  }
                  stroke={i === 40 ? '#fff' : '#081d2b'}
                  strokeWidth={i === 40 ? 0.08 : 0.02}
                >
                  <title>{`(${x}, ${y}): ${height === undefined ? 'Missing' : height.toFixed(3)}`}</title>
                </rect>
              );
            })}
          </svg>
          <p>Outlined center sample: {hole ? 'missing' : peak.toFixed(1)}</p>
          <p data-testid="terrain-edit-result">
            Bounds: {result.range.map(v => v.toFixed(2)).join('–')}
            <br />
            {result.pyramidLevels} derivative levels
          </p>
        </figure>
        <figure className="terrain-mesh-result">
          <figcaption>Elevation bands</figcaption>
          <svg viewBox="0 0 9 9" role="img" aria-label="Elevation bands with nodata holes">
            {/* Both squares use the same sample centers and coordinate-to-pixel scale. */}
            <rect width="9" height="9" fill="#173849" />
            {[0, 1].map(b => (
              <path
                key={b}
                d={Array.from(bands.bandIndices, (_, r) => r)
                  .filter(r => bands.bandIndices[r] === b)
                  .map(r => `M${path(r)}Z`)
                  .join(' ')}
                fill={b ? '#ffcb70' : '#367c93'}
                fillRule="evenodd"
                stroke="#fff"
                strokeWidth="0.02"
              />
            ))}
          </svg>
          <p>
            {result.triangles} triangles
            <br />
            Band cutoff: {band.toFixed(1)}
          </p>
        </figure>
        <ContourTopology field={result.field} controlsRoot={controlsRoot} />
        <p className="terrain-view-description">
          Explore how sharp elevation changes affect terrain rebuilds and profile simplification.
        </p>
      </div>
    </section>
  );
}
