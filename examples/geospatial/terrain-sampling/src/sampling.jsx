// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// biome-ignore lint/correctness/noUnusedImports: Standalone examples use the classic JSX transform.
import React, {useMemo, useState} from 'react';
import TerrainControls from './terrain-controls';
import {createTerrain, project, sampleLabel, TerrainSampleStatus} from './model';
import TerrainAnalysis from './analysis';

export default function Sampling({controlsRoot}) {
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
    // SVG coordinates account for letterboxing as well as the out-of-range buffer.
    const svg = event.currentTarget;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const local = point.matrixTransform(svg.getScreenCTM().inverse());
    setX(Math.max(-10, Math.min(90, local.x / 2)));
    setY(Math.max(-10, Math.min(90, 80 - local.y / 2)));
  };
  return (
    <>
      <TerrainControls target={controlsRoot}>
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
        <p>{terrain.triangles.length} triangles</p>
        <p>
          Triangle interpolation follows the mesh; bilinear follows a different surface. Remove the
          center vertex to test missing data, or drag into the{' '}
          <span style={{color: '#e97574'}}>border</span> to sample outside the grid.
        </p>
      </TerrainControls>
      <div className="terrain-probe">
        <div className="terrain-surface">
          <svg
            viewBox="0 0 700 520"
            role="img"
            aria-label="Isometric terrain mesh with sample probe"
          >
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
          <section className="terrain-probe-readout" aria-label="Probe readings">
            <p>
              Probe: X {x.toFixed(1)} m · Y {y.toFixed(1)} m
            </p>
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
          </section>
        </div>
        <div className="terrain-analysis-grid">
          <figure className="terrain-analysis-card">
            <figcaption>
              Probe <span className="terrain-caption-hint">drag to sample</span>
            </figcaption>
            <svg
              className="terrain-plan"
              viewBox="-20 -20 200 200"
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
              <rect x="-20" y="-20" width="200" height="200" fill="#652d38" />
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
          </figure>
          <TerrainAnalysis field={terrain.field} />
        </div>
      </div>
    </>
  );
}
