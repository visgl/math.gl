// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, {useMemo} from 'react';
import {intersectRayTriangle, getClosestPointOnTriangle} from '@math.gl/culling/queries';
import SceneCanvas from '../shared/scene-canvas';
import '../shared/query-example.css';
const triangles = [
  [
    [-4, -2, 0],
    [-1, -2, 0],
    [-2.5, 2, 1]
  ],
  [
    [-1.5, -2, 2],
    [1.5, -2, 2],
    [0, 2, 0]
  ],
  [
    [1, -2, -1],
    [4, -2, -1],
    [2.5, 2, 1]
  ]
];
export default function CullingQueries() {
  const [x, setX] = React.useState(0),
    [y, setY] = React.useState(0);
  const scene = useMemo(() => {
    const origin = [x, y, 6],
      direction = [0, 0, -1];
    const hits = triangles
      .map((triangle, index) => ({
        index,
        hit: intersectRayTriangle(origin, direction, ...triangle)
      }))
      .filter(value => value.hit)
      .sort((a, b) => a.hit.t - b.hit.t);
    const hit = hits[0];
    const rayEnd = hit ? [x, y, 6 - hit.hit.t] : [x, y, -3];
    const closest = getClosestPointOnTriangle(origin, ...triangles[1]);
    return {
      triangles: triangles.map((vertices, index) => ({
        vertices,
        color: index === hit?.index ? '#5de8fa55' : '#38658c30'
      })),
      segments: [
        {a: origin, b: rayEnd, color: '#ff73bd', width: 3},
        {a: origin, b: closest, color: '#ffc66f', width: 2}
      ],
      points: [
        {position: origin, color: '#ff73bd'},
        {position: rayEnd, color: '#ffffff'},
        {position: closest, color: '#ffc66f'}
      ],
      hit
    };
  }, [x, y]);
  return (
    <div className="query-example">
      <SceneCanvas scene={scene} />
      <details open>
        <summary>Ray & closest-point lab</summary>
        <div className="query-controls">
          <p>
            Move the pink ray across three 3D triangles. Cyan marks the first hit; gold connects the
            ray origin to the nearest point on the center triangle.
          </p>
          <label>
            Ray X · {x.toFixed(1)}
            <input
              aria-label="Ray X"
              type="range"
              min="-4"
              max="4"
              step="0.1"
              value={x}
              onChange={e => setX(Number(e.target.value))}
            />
          </label>
          <label>
            Ray Y · {y.toFixed(1)}
            <input
              aria-label="Ray Y"
              type="range"
              min="-3"
              max="3"
              step="0.1"
              value={y}
              onChange={e => setY(Number(e.target.value))}
            />
          </label>
          <p>Drag the canvas to orbit; scroll to zoom. Collapse this box to see the whole scene.</p>
        </div>
      </details>
      <div className="query-caption" role="status">
        {scene.hit
          ? `Triangle ${scene.hit.index} · hit distance ${scene.hit.hit.t.toFixed(2)} · barycentrics ${scene.hit.hit.barycentric.map(v => v.toFixed(2)).join(', ')}`
          : 'Ray misses all triangles'}
      </div>
    </div>
  );
}
