// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, {useState} from 'react';
import {Matrix4, toRadians} from '@math.gl/core';
import Cube from './cube';
import './styles.css';

const initial = {x: 0, y: 0, z: 0, rx: 20, ry: 30, rz: 0, scale: 1, order: 'TRS'};
export default function CoreTransforms() {
  const [values, setValues] = useState(initial);
  const matrix = new Matrix4();
  for (const operation of values.order) {
    if (operation === 'T') matrix.translate([values.x, values.y, values.z]);
    if (operation === 'R') matrix.rotateXYZ([values.rx, values.ry, values.rz].map(toRadians));
    if (operation === 'S') matrix.scale(values.scale);
  }
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
        <p>
          Move, rotate, and scale a cube. Drag to orbit the camera; scroll or pinch to zoom. Dashed
          edges show the original cube.
        </p>
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
        <Cube matrix={matrix} />
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
