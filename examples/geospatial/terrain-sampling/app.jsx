// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// biome-ignore lint/correctness/noUnusedImports: Standalone examples use the classic JSX transform.
import React, {useMemo, useState} from 'react';
import ExamplePanel from '../../common/example-panel';
import {createTerrain, project, sampleLabel, TerrainSampleStatus} from './model';
import './styles.css';

export default function TerrainSampling() {
  const [diagonal, setDiagonal] = useState('00-11');
  const [missing, setMissing] = useState(false);
  const [normals, setNormals] = useState(false);
  const [x, setX] = useState(35),
    [y, setY] = useState(35);
  const [interpolation, setInterpolation] = useState('bilinear');
  const terrain = useMemo(() => createTerrain(diagonal, missing), [diagonal, missing]);
  const methods = ['nearest', 'bilinear', 'triangle'];
  const samples = methods.map(method => terrain.field.sample(x, y, {interpolation: method}));
  const selected = samples[methods.indexOf(interpolation)];
  const point =
    selected.status === TerrainSampleStatus.VALID ? project([x, y, selected.height]) : null;
  const gradientValid = selected.gradientStatus === TerrainSampleStatus.VALID;
  const tip =
    point && gradientValid
      ? project([
          x + selected.normalX * 10,
          y + selected.normalY * 10,
          selected.height + selected.normalZ * 10
        ])
      : null;
  const move = event => {
    const box = event.currentTarget.getBoundingClientRect();
    setX(Math.max(0, Math.min(80, ((event.clientX - box.left) / box.width) * 80)));
    setY(Math.max(0, Math.min(80, 80 - ((event.clientY - box.top) / box.height) * 80)));
  };
  return (
    <div className="terrain-sampling">
      <div className="terrain-stage">
        <h2>Sample the surface</h2>
        <p>Local coordinates and heights in meters · Z up</p>
        <svg viewBox="0 0 700 520" role="img" aria-label="Isometric terrain mesh with sample probe">
          {terrain.triangles
            .slice()
            .sort((a, b) => b[0][0] + b[0][1] - a[0][0] - a[0][1])
            .map((triangle, index) => {
              const height = triangle.reduce((sum, vertex) => sum + vertex[2], 0) / 3;
              return (
                <polygon
                  key={index}
                  points={triangle.map(vertex => project(vertex).join(',')).join(' ')}
                  fill={`hsl(${190 - height},55%,${25 + height * 0.7}%)`}
                  stroke="#b7ecff"
                  strokeWidth="0.65"
                />
              );
            })}
          {normals &&
            Array.from({length: terrain.positions.length / 3}, (_, i) => {
              const position = Array.from(terrain.positions.slice(i * 3, i * 3 + 3));
              if (terrain.field.getHeight(i % 9, Math.floor(i / 9)) === undefined) return null;
              const start = project(position),
                end = project(position.map((value, k) => value + terrain.normals[i * 3 + k] * 7));
              return (
                <line
                  key={i}
                  x1={start[0]}
                  y1={start[1]}
                  x2={end[0]}
                  y2={end[1]}
                  stroke="#ffcb70"
                />
              );
            })}
          {point && (
            <>
              <line
                x1={point[0]}
                y1={point[1]}
                x2={project([x, y, 0])[0]}
                y2={project([x, y, 0])[1]}
                stroke="#fff"
                strokeDasharray="4 4"
              />
              {tip && (
                <line
                  x1={point[0]}
                  y1={point[1]}
                  x2={tip[0]}
                  y2={tip[1]}
                  stroke="#fff"
                  strokeWidth="3"
                />
              )}
              <circle cx={point[0]} cy={point[1]} r="6" fill="#ffbd59" stroke="#fff" />
            </>
          )}
        </svg>
        <p>
          Click or drag the plan view to move the probe. Sliders also allow sampling outside the
          grid.
        </p>
        <svg
          className="terrain-plan"
          viewBox="0 0 160 160"
          role="img"
          aria-label="Plan view: click to position probe"
          onPointerDown={event => {
            event.currentTarget.setPointerCapture(event.pointerId);
            move(event);
          }}
          onPointerMove={event => {
            if (event.buttons) move(event);
          }}
        >
          <rect width="160" height="160" fill="#113447" />
          {Array.from({length: 9}, (_, i) => (
            <g key={i}>
              <line x1={i * 20} y1="0" x2={i * 20} y2="160" stroke="#44718a" />
              <line x1="0" y1={i * 20} x2="160" y2={i * 20} stroke="#44718a" />
            </g>
          ))}
          {missing && <circle cx="80" cy="80" r="10" fill="#fa7869" />}
          <circle cx={x * 2} cy={160 - y * 2} r="5" fill="#ffcb70" />
        </svg>
      </div>
      <ExamplePanel title="Terrain sampling">
        <label>
          Interpolation
          <select value={interpolation} onChange={event => setInterpolation(event.target.value)}>
            {methods.map(method => (
              <option key={method}>{method}</option>
            ))}
          </select>
        </label>
        <label>
          Cell diagonal
          <select value={diagonal} onChange={event => setDiagonal(event.target.value)}>
            <option>00-11</option>
            <option>10-01</option>
          </select>
        </label>
        {[
          ['X', x, setX],
          ['Y', y, setY]
        ].map(([axis, value, setValue]) => (
          <label key={axis}>
            Probe {axis}: {value.toFixed(1)} m
            <input
              aria-label={`Probe ${axis}`}
              type="range"
              min="-10"
              max="90"
              step="0.5"
              value={value}
              onChange={event => setValue(Number(event.target.value))}
            />
          </label>
        ))}
        <label>
          <input
            type="checkbox"
            checked={missing}
            onChange={event => setMissing(event.target.checked)}
          />
          Missing center vertex
        </label>
        <label>
          <input
            type="checkbox"
            checked={normals}
            onChange={event => setNormals(event.target.checked)}
          />
          Show mesh normals
        </label>
        <p data-testid="sample-status">Status: {sampleLabel(selected)}</p>
        <table>
          <thead>
            <tr>
              <th>Method</th>
              <th>Height (m)</th>
            </tr>
          </thead>
          <tbody>
            {samples.map((sample, i) => (
              <tr key={methods[i]}>
                <td>{methods[i]}</td>
                <td>
                  {sample.status === TerrainSampleStatus.VALID
                    ? sample.height.toFixed(3)
                    : sampleLabel(sample)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          {gradientValid
            ? `Gradient: ${selected.gradientX.toFixed(3)}, ${selected.gradientY.toFixed(3)}`
            : 'Gradient unavailable'}
        </p>
        <p>{terrain.triangles.length} triangles</p>
        <p>
          Triangle interpolation matches the rendered mesh. Bilinear interpolation follows a
          different surface within each cell. Invalid samples are never plotted as zero height.
        </p>
      </ExamplePanel>
    </div>
  );
}
