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

const SIZE = 33;
const field = new HeightField({
  width: SIZE,
  height: SIZE,
  heights: Float64Array.from({length: SIZE * SIZE}, (_, i) => {
    const x = ((i % SIZE) - 16) / 8,
      y = (Math.floor(i / SIZE) - 16) / 8;
    return 40 * Math.exp(-(x * x + y * y)) + 8 * Math.sin(x * 3) * Math.cos(y * 2);
  })
});

/** An inspectable synthetic surface, not an independent accuracy benchmark. */
export default function MeshLab() {
  const [algorithm, setAlgorithm] = useState('martini');
  const [tolerance, setTolerance] = useState(2);
  const {mesh, error} = useMemo(() => {
    const mesh =
      algorithm === 'regular'
        ? createTerrainMesh(field)
        : algorithm === 'martini'
          ? createMartiniTerrainMesh(field, {maxError: tolerance})
          : createDelatinTerrainMesh(field, {maxError: tolerance});
    return {mesh, error: measureTerrainMeshError(field, mesh)};
  }, [algorithm, tolerance]);
  return (
    <section className="terrain-analysis">
      <h3>Mesh lab</h3>
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
                    `${mesh.gridCoordinates[2 * id] * 10},${320 - mesh.gridCoordinates[2 * id + 1] * 10}`
                )
                .join(' ')}
              fill="none"
              stroke="#b7ecff"
              strokeWidth="0.7"
            />
          );
        })}
      </svg>
      <p data-testid="mesh-lab-stats">
        {mesh.indices.length / 3} triangles; maximum nodal error {error.maxSampleError.toFixed(3)}{' '}
        m; RMS nodal error {error.rmsSampleError.toFixed(3)} m.
      </p>
      <p>
        Errors are measured at source grid nodes, not a continuous-surface error bound. This
        synthetic terrain has complete data.
      </p>
    </section>
  );
}
