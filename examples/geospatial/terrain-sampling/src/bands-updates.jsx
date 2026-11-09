// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// biome-ignore lint/correctness/noUnusedImports: Standalone examples use the classic JSX transform.
import React, {useMemo, useRef, useState} from 'react';
import {
  HeightField,
  updateTerrainPersistentBounds,
  updateTerrainPersistentGradients,
  createTerrainGradientGrid,
  updateTerrainMeshRegions,
  updateTerrainBoundsRegions,
  updateTerrainGradientPyramidRegions,
  createTerrainIsobands,
  updateTerrainMeshes,
  updateTerrainBounds,
  updateTerrainGradientPyramids,
  updateTerrainMixedVertexTileHalos,
  updateTerrainMixedGradientGrids
} from '@math.gl/geospatial';
export default function BandsUpdates() {
  const [peak, setPeak] = useState(4),
    [hole, setHole] = useState(false),
    [band, setBand] = useState(2);
  const persistentCache = useRef({bounds: null, gradients: null});
  const fineCache = useRef({mesh: null, bounds: null, gradients: null});
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
    const dirty = [{minColumn: 4, minRow: 4, maxColumn: 4, maxRow: 4}];
    const persistentBounds = updateTerrainPersistentBounds(
      persistentCache.current.bounds,
      field,
      dirty,
      {nodesPerBlock: 16}
    );
    const persistentGradients = updateTerrainPersistentGradients(
      persistentCache.current.gradients,
      createTerrainGradientGrid(field),
      [{minColumn: 3, minRow: 3, maxColumn: 5, maxRow: 5}],
      {nodesPerBlock: 16}
    );
    persistentCache.current = {bounds: persistentBounds, gradients: persistentGradients};
    const fineMesh = updateTerrainMeshRegions(fineCache.current.mesh, field, dirty, {
      cellsPerRegion: 2
    });
    const fineBounds = updateTerrainBoundsRegions(fineCache.current.bounds, field, dirty);
    const fineGradients = updateTerrainGradientPyramidRegions(
      fineCache.current.gradients,
      createTerrainGradientGrid(field),
      [{minColumn: 3, minRow: 3, maxColumn: 5, maxRow: 5}]
    );
    fineCache.current = {mesh: fineMesh, bounds: fineBounds, gradients: fineGradients};
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
    const reused = prior.meshes && meshes[1].data === prior.meshes[1].data;
    cache.current = {meshes, bounds, halos, gradients, pyramids};
    return {
      field,
      persistentBounds,
      persistentGradients,
      fineMesh,
      fineBounds,
      fineGradients,
      reused,
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
      i => `${20 + bands.positions[2 * i] * 35},${300 - bands.positions[2 * i + 1] * 35}`
    ).join(' ');
  return (
    <section
      className="terrain-analysis terrain-seam-explorer"
      aria-label="Isobands and terrain edits"
    >
      <h2>Elevation bands and terrain edits</h2>
      <p data-testid="persistent-copy-result">
        Persistent hierarchy:{' '}
        {result.persistentBounds.stats.copiedBlocks + result.persistentGradients.stats.copiedBlocks}{' '}
        blocks copied,{' '}
        {result.persistentBounds.stats.copiedBytes + result.persistentGradients.stats.copiedBytes}{' '}
        data bytes.
      </p>
      <p data-testid="dirty-region-result">
        Rebuilt {result.fineMesh.rebuilt.length}/{result.fineMesh.regions.length} mesh regions;
        recomputed {result.fineBounds.updatedCounts[0]} bounds cells and{' '}
        {result.fineGradients.updatedCounts[0]} gradient leaves.
      </p>
      <label>
        Brush peak
        <input
          aria-label="Terrain brush peak"
          type="range"
          min="1"
          max="9"
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
      <label>
        <input type="checkbox" checked={hole} onChange={e => setHole(e.target.checked)} />
        Missing brush center
      </label>
      <svg viewBox="0 0 320 320" role="img" aria-label="Elevation bands with nodata holes">
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
            strokeWidth="0.5"
          />
        ))}
      </svg>
      <p data-testid="terrain-edit-result">
        Bounds: {result.range.map(v => v.toFixed(2)).join('–')} · {result.triangles} triangles ·{' '}
        {result.pyramidLevels} derivative levels · distant mesh{' '}
        {result.reused ? 'reused' : 'initialized'}
      </p>
      <p>
        Edits rebuild the affected patch; the distant mesh is reused. Nodata triangles become holes.
        Band changes only polygonize the existing field. These are projected/local Cartesian
        footprints.
      </p>
    </section>
  );
}
