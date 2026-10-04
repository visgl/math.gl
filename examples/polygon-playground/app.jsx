// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, {useState} from 'react';
import {earcut, getPolygonSignedArea, getPolygonWindingDirection} from '@math.gl/polygon';
import './styles.css';

const initial = [
  [70, 70],
  [430, 70],
  [430, 330],
  [270, 280],
  [70, 330]
];
const hole = [
  [180, 140],
  [180, 210],
  [250, 210],
  [250, 140]
];
const cross = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
function intersects(a, b, c, d) {
  return (
    cross(a, b, c) * cross(a, b, d) <= 0 &&
    cross(c, d, a) * cross(c, d, b) <= 0 &&
    Math.max(a[0], b[0]) >= Math.min(c[0], d[0]) &&
    Math.max(c[0], d[0]) >= Math.min(a[0], b[0]) &&
    Math.max(a[1], b[1]) >= Math.min(c[1], d[1]) &&
    Math.max(c[1], d[1]) >= Math.min(a[1], b[1])
  );
}
function contains(ring, point) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i],
      b = ring[j];
    if (
      a[1] > point[1] !== b[1] > point[1] &&
      point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / (b[1] - a[1]) + a[0]
    )
      inside = !inside;
  }
  return inside;
}
function valid(ring, withHole) {
  for (let i = 0; i < ring.length; i++) {
    if (Math.hypot(...ring[i].map((v, k) => v - ring[(i + 1) % ring.length][k])) < 5) return false;
    for (let j = i + 1; j < ring.length; j++) {
      if (j === i + 1 || (i === 0 && j === ring.length - 1)) continue;
      if (intersects(ring[i], ring[(i + 1) % ring.length], ring[j], ring[(j + 1) % ring.length]))
        return false;
    }
    if (
      withHole &&
      hole.some((p, j) =>
        intersects(ring[i], ring[(i + 1) % ring.length], p, hole[(j + 1) % hole.length])
      )
    )
      return false;
  }
  return (
    Math.abs(getPolygonSignedArea(ring.flat())) > 10 &&
    (!withHole || hole.every((p) => contains(ring, p)))
  );
}

export default function PolygonPlayground() {
  const [ring, setRing] = useState(initial);
  const [withHole, setHole] = useState(false);
  const [edges, setEdges] = useState(true);
  const [warning, setWarning] = useState('');
  const vertices = withHole ? [...ring, ...hole] : ring;
  const indices = earcut(vertices.flat(), withHole ? [ring.length] : undefined, 2);
  const area =
    Math.abs(getPolygonSignedArea(ring.flat())) -
    (withHole ? Math.abs(getPolygonSignedArea(hole.flat())) : 0);
  const screen = (p) => `${p[0]},${400 - p[1]}`;
  const move = (index, point) => {
    const next = ring.map((p, i) =>
      i === index ? point.map((v, axis) => Math.max(20, Math.min(axis ? 380 : 480, v))) : p
    );
    if (valid(next, withHole)) {
      setRing(next);
      setWarning('');
    } else setWarning('Keep edges apart and the hole inside the outline.');
  };
  return (
    <div className="math-playground">
      <aside>
        <h2>Polygon playground</h2>
        <p>
          Drag an outline vertex, or focus it and use the arrow keys. Coordinates use an upward Y
          axis.
        </p>
        <label>
          <input
            type="checkbox"
            checked={withHole}
            onChange={(e) => {
              if (!e.target.checked || valid(ring, true)) {
                setHole(e.target.checked);
                setWarning('');
              } else setWarning('Reset the outline before adding the hole.');
            }}
          />{' '}
          Include a hole
        </label>
        <label>
          <input type="checkbox" checked={edges} onChange={(e) => setEdges(e.target.checked)} />{' '}
          Triangle edges
        </label>
        <button
          onClick={() => {
            setRing([...ring].reverse());
            setWarning('');
          }}
        >
          Reverse winding
        </button>
        <button
          onClick={() => {
            setRing(initial);
            setHole(false);
            setWarning('');
          }}
        >
          Reset
        </button>
        <p data-role="metrics">
          {indices.length / 3} triangles
          <br />
          Area: {area.toFixed(0)} square units
          <br />
          Outline: {getPolygonWindingDirection(ring.flat())}
          <br />
          Signed area: {getPolygonSignedArea(ring.flat()).toFixed(0)}
        </p>
        <p role="status">{warning}</p>
        <p>Powered by earcut, getPolygonSignedArea, and getPolygonWindingDirection.</p>
      </aside>
      <svg viewBox="0 0 500 400" aria-label="Editable triangulated polygon">
        {Array.from({length: indices.length / 3}, (_, i) => (
          <polygon
            key={i}
            points={indices
              .slice(i * 3, i * 3 + 3)
              .map((index) => screen(vertices[index]))
              .join(' ')}
            fill={`hsl(${190 + i * 17},60%,50%)`}
            fillOpacity="0.55"
            stroke={edges ? '#d8f0ff' : 'none'}
            strokeWidth="1.5"
          />
        ))}
        <polygon points={ring.map(screen).join(' ')} fill="none" stroke="#70c7ff" strokeWidth="3" />
        {withHole && (
          <polygon
            points={hole.map(screen).join(' ')}
            fill="none"
            stroke="#ffd875"
            strokeWidth="3"
          />
        )}
        {ring.map((p, index) => (
          <circle
            key={index}
            className="vertex"
            role="slider"
            aria-valuemin={20}
            aria-valuemax={480}
            aria-valuenow={p[0]}
            aria-label={`Vertex ${index + 1}`}
            aria-valuetext={`X ${p[0].toFixed(0)}, Y ${p[1].toFixed(0)}`}
            tabIndex="0"
            cx={p[0]}
            cy={400 - p[1]}
            r="7"
            fill="#ffd875"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
              const svg = e.currentTarget.ownerSVGElement;
              const point = svg.createSVGPoint();
              point.x = e.clientX;
              point.y = e.clientY;
              const local = point.matrixTransform(svg.getScreenCTM().inverse());
              move(index, [local.x, 400 - local.y]);
            }}
            onPointerUp={(e) => e.currentTarget.releasePointerCapture(e.pointerId)}
            onKeyDown={(e) => {
              const delta = {
                ArrowLeft: [-5, 0],
                ArrowRight: [5, 0],
                ArrowUp: [0, 5],
                ArrowDown: [0, -5]
              }[e.key];
              if (delta) {
                e.preventDefault();
                move(
                  index,
                  p.map((v, k) => v + delta[k])
                );
              }
            }}
          />
        ))}
      </svg>
    </div>
  );
}
