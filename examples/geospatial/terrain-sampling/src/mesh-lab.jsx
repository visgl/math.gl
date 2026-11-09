// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// biome-ignore lint/correctness/noUnusedImports: Standalone examples use the classic JSX transform.
import React, {useMemo, useState} from 'react';
import {
  HeightField,
  createTerrainMesh,
  createMartiniTerrainMesh,
  createDelatinTerrainMesh,
  measureTerrainMeshError
} from '@math.gl/geospatial/terrain';

import {getMeshLabData, getMeshLabErrors} from './mesh-lab-data';

export default function MeshLab() {
  const [heatmap, setHeatmap] = useState(false);
  const [dataset, setDataset] = useState('mountain');
  const [algorithm, setAlgorithm] = useState('martini');
  const [tolerance, setTolerance] = useState(2);
  const {mesh, error, errors, milliseconds, description, unsupported} = useMemo(() => {
    const data = getMeshLabData(dataset);
    const field = new HeightField(data);
    if (field.validCount !== field.width * field.height && algorithm !== 'regular')
      return {unsupported: true, description: data.description};
    const start = performance.now();
    const mesh =
      algorithm === 'regular'
        ? createTerrainMesh(field)
        : algorithm === 'martini'
          ? createMartiniTerrainMesh(field, {maxError: tolerance})
          : createDelatinTerrainMesh(field, {maxError: tolerance});
    const milliseconds = performance.now() - start;
    return {
      mesh,
      error: measureTerrainMeshError(field, mesh),
      errors: getMeshLabErrors(field, mesh),
      milliseconds,
      description: data.description
    };
  }, [algorithm, tolerance, dataset]);
  return (
    <section className="terrain-analysis">
      <h3>Mesh lab</h3>
      <label>
        Dataset{' '}
        <select
          aria-label="Mesh dataset"
          value={dataset}
          onChange={e => setDataset(e.target.value)}
        >
          <option value="mountain">Analytical mountain</option>
          <option value="coast">Analytical coast</option>
          <option value="holes">Analytical nodata</option>
          <option value="dem">Pinned DTED crop</option>
          <option value="sierra">Sierra Nevada DEM</option>
          <option value="pacific">Pacific coast DEM</option>
        </select>
      </label>
      <p>{description}</p>
      <label>
        Mesh algorithm{' '}
        <select
          aria-label="Mesh algorithm"
          value={algorithm}
          onChange={e => setAlgorithm(e.target.value)}
        >
          <option value="regular">Regular</option>
          <option value="martini">MARTINI</option>
          <option value="delatin">Delatin</option>
        </select>
      </label>
      <label>
        Error tolerance: {tolerance.toFixed(1)} m{' '}
        <input
          aria-label="Mesh error tolerance"
          type="range"
          min="0"
          max="10"
          step="0.5"
          value={tolerance}
          onChange={e => setTolerance(Number(e.target.value))}
        />
      </label>
      <label>
        <input
          type="checkbox"
          aria-label="Mesh nodal error heatmap"
          checked={heatmap}
          onChange={e => setHeatmap(e.target.checked)}
        />
        Nodal error heatmap (blue: zero; red: tolerance; gray: uncovered)
      </label>
      {unsupported ? (
        <p role="status">
          Adaptive builders require complete data. Select Regular to inspect missing-data holes.
        </p>
      ) : (
        <>
          <svg viewBox="0 0 320 320" role="img" aria-label="Mesh lab wireframe">
            <rect width="320" height="320" fill="#173849" />
            {Array.from({length: mesh.indices.length / 3}, (_, i) => {
              const ids = [...mesh.indices.slice(i * 3, i * 3 + 3)];
              return (
                <polygon
                  key={i}
                  data-mesh-triangle=""
                  points={ids
                    .map(
                      id =>
                        `${(mesh.gridCoordinates[2 * id] * 320) / (mesh.width - 1)},${320 - (mesh.gridCoordinates[2 * id + 1] * 320) / (mesh.height - 1)}`
                    )
                    .join(' ')}
                  fill="none"
                  stroke="#b7ecff"
                  strokeWidth="0.7"
                />
              );
            })}
            {heatmap &&
              errors.map(({x, y, error}) => (
                <circle
                  key={y * mesh.width + x}
                  data-mesh-error=""
                  cx={(x * 320) / (mesh.width - 1)}
                  cy={320 - (y * 320) / (mesh.height - 1)}
                  r="2.5"
                  fill={
                    error === undefined
                      ? '#aaa'
                      : `hsl(${240 * (1 - Math.min(1, error / Math.max(tolerance, 1e-9)))},90%,60%)`
                  }
                />
              ))}
          </svg>
          <p data-testid="mesh-lab-stats">
            {mesh.indices.length / 3} triangles; maximum nodal error{' '}
            {error.maxSampleError.toFixed(3)} m; RMS nodal error {error.rmsSampleError.toFixed(3)}{' '}
            m.{' '}
            {mesh.positions.byteLength + mesh.indices.byteLength + mesh.gridCoordinates.byteLength}{' '}
            output bytes; {milliseconds.toFixed(2)} ms build time (single run).{' '}
            {error.uncoveredSampleCount} uncovered valid nodes.
          </p>
        </>
      )}
      <p>
        Errors are measured at source grid nodes, not a continuous-surface error bound. Output bytes
        exclude temporary allocations.
      </p>
    </section>
  );
}
