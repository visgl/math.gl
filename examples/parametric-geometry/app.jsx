// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, {useMemo, useState} from 'react';
import {TorusGeometry, LatheGeometry, ParametricGeometry} from '@math.gl/geometry/parametric';
import Mesh from '../geometry-viewer/mesh';
import '../geometry-viewer/styles.css';
import '../geometry-processing/styles.css';
export default function Example() {
  const [shape, setShape] = useState('torus'),
    [segments, setSegments] = useState(48),
    [amount, setAmount] = useState(0.4),
    [wireframe, setWireframe] = useState(false);
  const geometry = useMemo(() => {
    if (shape === 'torus')
      return new TorusGeometry({
        majorSegments: segments,
        minorSegments: Math.max(8, Math.floor(segments / 2)),
        minorRadius: amount
      });
    if (shape === 'lathe')
      return new LatheGeometry({
        segments,
        points: [
          [0, -1],
          [0.55, -1],
          [0.7, -0.8],
          [0.45, -0.3],
          [amount, 0.3],
          [0.75, 0.8],
          [0.8, 1]
        ]
      });
    return new ParametricGeometry({
      uSegments: segments,
      vSegments: segments,
      sample: (u, v) => {
        const x = (u - 0.5) * 3,
          z = (v - 0.5) * 3;
        return [x, amount * Math.sin(x * 3) * Math.cos(z * 3), -z];
      }
    });
  }, [shape, segments, amount]);
  return (
    <div className="processing-example">
      <Mesh
        geometry={geometry}
        wireframe={wireframe}
        preserveCamera
        ariaLabel="Parametric surface. Drag to orbit; scroll to zoom."
      />
      <details className="processing-info">
        <summary>Parametric geometry lab</summary>
        <p>Explore analytic torus normals, revolved profiles, and a sampled wave surface.</p>
        <label>
          Surface
          <select value={shape} onChange={e => setShape(e.target.value)}>
            <option value="torus">Torus</option>
            <option value="lathe">Lathe vase</option>
            <option value="wave">Wave surface</option>
          </select>
        </label>
        <label>
          Segments {segments}
          <input
            type="range"
            min="8"
            max="96"
            step="4"
            value={segments}
            onChange={e => setSegments(Number(e.target.value))}
          />
        </label>
        <label>
          Shape parameter {amount.toFixed(2)}
          <input
            type="range"
            min="0.1"
            max="0.8"
            step="0.05"
            value={amount}
            onChange={e => setAmount(Number(e.target.value))}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={wireframe}
            onChange={e => setWireframe(e.target.checked)}
          />{' '}
          Wireframe
        </label>
        <p>Periodic surfaces duplicate UV seams. All meshes are CPU typed arrays.</p>
      </details>
      <div className="processing-caption" role="status">
        {geometry.attributes.POSITION.value.length / 3} vertices · {geometry.vertexCount / 3}{' '}
        triangles · drag to orbit
      </div>
    </div>
  );
}
