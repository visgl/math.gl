// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// biome-ignore lint/correctness/noUnusedImports: Standalone examples use the classic JSX transform.
import React, {useMemo, useState} from 'react';
import BoundaryLab from './boundary-lab';
import TerrainControls from './terrain-controls';
import {
  HeightField,
  createTerrainMesh,
  createMartiniTerrainMesh,
  createDelatinTerrainMesh,
  boundTerrainMeshError,
  measureTerrainMeshError
} from '@math.gl/geospatial/terrain';
import {getMeshLabData, getMeshLabErrors} from './mesh-lab-data';

const algorithms = [
  {id: 'regular', title: 'Regular', build: field => createTerrainMesh(field)},
  {
    id: 'martini',
    title: 'MARTINI',
    build: (field, maxError) => createMartiniTerrainMesh(field, {maxError})
  },
  {
    id: 'delatin',
    title: 'Delatin',
    build: (field, maxError) => createDelatinTerrainMesh(field, {maxError})
  }
];

export default function MeshLab({controlsRoot}) {
  const [boundaryStudy, setBoundaryStudy] = useState(false);
  return (
    <>
      <TerrainControls target={controlsRoot}>
        <label>
          <input
            type="checkbox"
            aria-label="Boundary qualification study"
            checked={boundaryStudy}
            onChange={e => setBoundaryStudy(e.target.checked)}
          />
          Boundary qualification study
        </label>
      </TerrainControls>
      {boundaryStudy ? (
        <BoundaryLab controlsRoot={controlsRoot} />
      ) : (
        <GridMeshLab controlsRoot={controlsRoot} />
      )}
    </>
  );
}

function GridMeshLab({controlsRoot}) {
  const [heatmap, setHeatmap] = useState(false);
  const [reference, setReference] = useState('off');
  const [dataset, setDataset] = useState('mountain');
  const [tolerance, setTolerance] = useState(2);
  const {field, description} = useMemo(() => {
    const data = getMeshLabData(dataset);
    return {field: new HeightField(data), description: data.description};
  }, [dataset]);
  return (
    <section className="terrain-analysis">
      <TerrainControls target={controlsRoot}>
        <label>
          Dataset
          <select
            aria-label="Mesh dataset"
            value={dataset}
            onChange={event => setDataset(event.target.value)}
          >
            <option value="mountain">Analytical mountain</option>
            <option value="coast">Analytical coast</option>
            <option value="holes">Analytical nodata</option>
            <option value="dem">Pinned DTED crop</option>
            <option value="sierra">Sierra Nevada DEM</option>
            <option value="pacific">Pacific coast DEM</option>
          </select>
        </label>
        <label>
          Error tolerance: {tolerance.toFixed(1)} m
          <input
            aria-label="Mesh error tolerance"
            type="range"
            min="0"
            max="10"
            step="0.5"
            value={tolerance}
            onChange={event => setTolerance(Number(event.target.value))}
          />
        </label>
        <label>
          <input
            type="checkbox"
            aria-label="Mesh nodal error heatmap"
            checked={heatmap}
            onChange={event => setHeatmap(event.target.checked)}
          />
          <span>
            Nodal error heatmap (<span style={{color: '#8b9dff'}}>zero</span>;{' '}
            <span style={{color: '#ff5964'}}>tolerance</span>;{' '}
            <span style={{color: '#aaa'}}>uncovered</span>)
          </span>
        </label>
        <label>
          Continuous error reference
          <select value={reference} onChange={event => setReference(event.target.value)}>
            <option value="off">Off</option>
            <option value="triangle">Source triangles</option>
            <option value="bilinear">Bilinear cells</option>
          </select>
        </label>
        <p>
          Bounds apply where the mesh and reference overlap. The yellow dot marks the largest
          verified probe.
        </p>
      </TerrainControls>
      <div className="terrain-mesh-comparison">
        <SourceGrid field={field} description={description} />
        {algorithms.map(algorithm => (
          <MeshResult
            key={algorithm.id}
            algorithm={algorithm}
            field={field}
            tolerance={algorithm.id === 'regular' ? 0 : tolerance}
            reference={reference}
            heatmap={heatmap}
            colorTolerance={tolerance}
          />
        ))}
      </div>
    </section>
  );
}

function SourceGrid({field, description}) {
  const range = field.heightRange;
  const [min, max] = range || [0, 0];
  return (
    <figure className="terrain-mesh-result" aria-label="Source data">
      <figcaption>Source data</figcaption>
      <svg
        viewBox={`0 0 ${field.width} ${field.height}`}
        role="img"
        aria-label="Source elevation grid heatmap"
      >
        {Array.from({length: field.width * field.height}, (_, i) => {
          const x = i % field.width;
          const y = Math.floor(i / field.width);
          const height = field.getHeight(x, y);
          const value = height === undefined ? 0 : (height - min) / Math.max(max - min, 1e-9);
          return (
            <rect
              key={i}
              data-source-sample=""
              data-missing-source={height === undefined ? '' : undefined}
              x={x}
              y={field.height - y - 1}
              width="1"
              height="1"
              fill={height === undefined ? '#687587' : `hsl(${220 - value * 180},65%,45%)`}
            >
              <title>{`(${x}, ${y}): ${height === undefined ? 'Missing' : `${height.toFixed(3)} m`}`}</title>
            </rect>
          );
        })}
      </svg>
      <p>
        {field.width} × {field.height} samples
        <br />
        {range ? `${min.toFixed(2)}–${max.toFixed(2)} m` : 'No valid heights'}
        <br />
        {field.width * field.height - field.validCount} missing samples
      </p>
      <p>{description}</p>
    </figure>
  );
}

function MeshResult({algorithm, field, tolerance, heatmap, colorTolerance, reference}) {
  const {mesh, error, milliseconds, unsupported} = useMemo(() => {
    // Adaptive builders need complete grids; regular meshes retain nodata holes.
    if (algorithm.id !== 'regular' && field.validCount !== field.width * field.height)
      return {unsupported: true};
    const start = performance.now();
    const mesh = algorithm.build(field, tolerance);
    const milliseconds = performance.now() - start;
    return {mesh, milliseconds, error: measureTerrainMeshError(field, mesh)};
  }, [algorithm, field, tolerance]);
  const continuous = useMemo(() => {
    if (!mesh || reference === 'off') return null;
    try {
      return boundTerrainMeshError(field, mesh, {
        reference,
        gap: 0.2,
        maxDepth: 8,
        maxBoxes: 300000
      });
    } catch (failure) {
      return {failure: failure.message};
    }
  }, [field, mesh, reference]);
  const errors = useMemo(
    () => (heatmap && mesh ? getMeshLabErrors(field, mesh) : []),
    [field, mesh, heatmap]
  );
  return (
    <figure className="terrain-mesh-result" aria-label={`${algorithm.title} result`}>
      <figcaption>{algorithm.title}</figcaption>
      <svg viewBox="0 0 320 320" role="img" aria-label={`${algorithm.title} mesh`}>
        <rect
          width="320"
          height="320"
          fill={unsupported ? '#7f1d1d' : '#173849'}
          data-unsupported-mesh={unsupported ? '' : undefined}
        />
        {mesh &&
          Array.from({length: mesh.indices.length / 3}, (_, i) => {
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
        {errors.map(({x, y, error}) => (
          <circle
            key={y * mesh.width + x}
            data-mesh-error=""
            cx={(x * 320) / (mesh.width - 1)}
            cy={320 - (y * 320) / (mesh.height - 1)}
            r="2.5"
            fill={
              error === undefined
                ? '#aaa'
                : `hsl(${240 * (1 - Math.min(1, error / Math.max(colorTolerance, 1e-9)))},90%,60%)`
            }
          />
        ))}
        {continuous?.witness && (
          <circle
            cx={(continuous.witness[0] * 320) / (mesh.width - 1)}
            cy={320 - (continuous.witness[1] * 320) / (mesh.height - 1)}
            r="5"
            fill="#ffef72"
          />
        )}
      </svg>
      {continuous && (
        <p role="status">
          {continuous.failure ||
            (continuous.upperBound === null
              ? 'No comparable surface boxes'
              : `Continuous error: ${continuous.lowerBound.toPrecision(4)} to ${continuous.upperBound.toPrecision(4)} m. ${continuous.converged ? 'Gap reached.' : 'Depth limit reached.'}`)}
        </p>
      )}
      {unsupported ? (
        <p role="status">Incomplete data: adaptive meshing requires a complete grid.</p>
      ) : (
        <p data-testid={`mesh-lab-stats-${algorithm.id}`}>
          {mesh.indices.length / 3} triangles
          <br />
          Maximum nodal error: {error.maxSampleError.toFixed(3)} m
          <br />
          RMS nodal error: {error.rmsSampleError.toFixed(3)} m
          <br />
          {mesh.positions.byteLength + mesh.indices.byteLength + mesh.gridCoordinates.byteLength}{' '}
          output bytes
          <br />
          {milliseconds.toFixed(2)} ms build time (single run)
          <br />
          {error.uncoveredSampleCount} uncovered valid nodes
        </p>
      )}
    </figure>
  );
}
