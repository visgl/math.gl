// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, {useState} from 'react';
import {Matrix4, toRadians} from '@math.gl/core';
import './styles.css';

const initial = {x: 0, y: 0, z: 0, rx: 20, ry: 30, rz: 0, scale: 1, order: 'TRS'};
const vertices = [
  [-1, -1, -1],
  [1, -1, -1],
  [1, 1, -1],
  [-1, 1, -1],
  [-1, -1, 1],
  [1, -1, 1],
  [1, 1, 1],
  [-1, 1, 1]
];
const edges = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 4],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7]
];
// Fixed orthographic camera; model coordinates remain the package's actual output.
const project = ([x, y, z]) => [300 + 65 * (x - 0.5 * z), 250 - 65 * (y + 0.3 * z)];
export default function CoreTransforms() {
  const [values, setValues] = useState(initial);
  const matrix = new Matrix4();
  for (const operation of values.order) {
    if (operation === 'T') matrix.translate([values.x, values.y, values.z]);
    if (operation === 'R') matrix.rotateXYZ([values.rx, values.ry, values.rz].map(toRadians));
    if (operation === 'S') matrix.scale(values.scale);
  }
  const transformed = vertices.map((v) => matrix.transformAsPoint(v));
  const projected = [...transformed, ...vertices, [4, 0, 0], [0, 4, 0], [0, 0, 4]].map(project);
  const left = Math.min(0, ...projected.map((p) => p[0] - 20));
  const top = Math.min(0, ...projected.map((p) => p[1] - 20));
  const right = Math.max(600, ...projected.map((p) => p[0] + 20));
  const bottom = Math.max(500, ...projected.map((p) => p[1] + 20));
  const line = (a, b, props) => {
    const p = project(a),
      q = project(b);
    return <line x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} {...props} />;
  };
  const control = (key, label, min, max, step = 1) => (
    <label key={key}>
      {label}: {values[key]}
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={values[key]}
        onChange={(e) => setValues({...values, [key]: Number(e.target.value)})}
      />
    </label>
  );
  return (
    <div className="math-playground">
      <aside>
        <h2>Core transforms</h2>
        <p>Move, rotate, and scale a cube. Dashed edges show the original cube.</p>
        {['x', 'y', 'z'].map((key) => control(key, `Translate ${key.toUpperCase()}`, -2, 2, 0.1))}
        {['rx', 'ry', 'rz'].map((key, i) => control(key, `Rotate ${'XYZ'[i]} (°)`, -180, 180))}
        {control('scale', 'Scale', 0.2, 2, 0.1)}
        <label>
          Matrix composition{' '}
          <select
            aria-label="Matrix composition"
            value={values.order}
            onChange={(e) => setValues({...values, order: e.target.value})}
          >
            <option value="TRS">T × R × S</option>
            <option value="SRT">S × R × T</option>
          </select>
        </label>
        <p>Column vectors: operations apply right to left. Rotation uses rotateXYZ.</p>
        <button onClick={() => setValues(initial)}>Reset</button>
      </aside>
      <div className="core-transforms-view">
        <svg
          viewBox={`${left} ${top} ${right - left} ${bottom - top}`}
          aria-label="Cube transformed by Matrix4"
        >
          {[
            [4, 0, 0],
            [0, 4, 0],
            [0, 0, 4]
          ].map((axis, i) =>
            line([0, 0, 0], axis, {
              key: `axis${i}`,
              stroke: ['#ff8585', '#8ee6ae', '#70c7ff'][i],
              strokeWidth: 2
            })
          )}
          {[
            [4, 0, 0],
            [0, 4, 0],
            [0, 0, 4]
          ].map((axis, i) => {
            const p = project(axis);
            return (
              <text key={i} x={p[0]} y={p[1]} fill="#fff">
                {'XYZ'[i]}
              </text>
            );
          })}
          {edges.map(([a, b], i) =>
            line(vertices[a], vertices[b], {
              key: `ghost${i}`,
              stroke: '#698098',
              strokeDasharray: '4 4'
            })
          )}
          {edges.map(([a, b], i) =>
            line(transformed[a], transformed[b], {key: i, stroke: '#ffd875', strokeWidth: 3})
          )}
          {transformed.map((v, i) => {
            const p = project(v);
            return <circle key={i} cx={p[0]} cy={p[1]} r="4" fill="#fff" />;
          })}
        </svg>
        <div style={{padding: '12px 24px'}}>
          <strong>Model matrix · rows displayed, storage is column-major</strong>
          <pre data-role="matrix">
            {[0, 1, 2, 3]
              .map((row) =>
                [0, 1, 2, 3]
                  .map((column) => matrix[column * 4 + row].toFixed(2).padStart(7))
                  .join(' ')
              )
              .join('\n')}
          </pre>
          <p data-role="point">
            Vertex (1, 1, 1) → (
            {matrix
              .transformAsPoint([1, 1, 1])
              .map((v) => v.toFixed(2))
              .join(', ')}
            )
          </p>
        </div>
      </div>
    </div>
  );
}
