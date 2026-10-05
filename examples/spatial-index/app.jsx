// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, {useEffect, useMemo, useRef} from 'react';
import {BoxIndex, PointIndex} from '@math.gl/spatial-index';
import '../shared/query-example.css';
const records = Array.from({length: 1200}, (_, i) => {
  const x = (((i * 7919) % 997) / 997) * 180 - 90,
    y = (((i * 3571) % 991) / 991) * 180 - 90;
  return [x, y, x + 1 + (i % 5), y + 1 + (i % 3)];
});
export default function SpatialIndexExample() {
  const [point, setPoint] = React.useState([0, 0]),
    [radius, setRadius] = React.useState(15),
    [mode, setMode] = React.useState('range'),
    [source, setSource] = React.useState('boxes');
  const canvas = useRef(null);
  const index = useMemo(
    () =>
      source === 'boxes'
        ? new BoxIndex({bounds: records.flat(), dimension: 2})
        : new PointIndex({positions: records.flatMap(row => row.slice(0, 2)), dimension: 2}),
    [source]
  );
  const result = useMemo(
    () => ({
      rows:
        mode === 'range'
          ? index.search(
              point.map(v => v - radius),
              point.map(v => v + radius)
            )
          : index.searchRay(point, [1, 0.3], 160).map(hit => hit.index),
      nearest: index.nearest(point)
    }),
    [index, point, radius, mode]
  );
  useEffect(() => {
    const element = canvas.current,
      ctx = element.getContext('2d');
    const draw = () => {
      const {width, height} = element.getBoundingClientRect(),
        dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (!width || !height) return;
      element.width = width * dpr;
      element.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#071321';
      ctx.fillRect(0, 0, width, height);
      const project = p => [((p[0] + 100) / 200) * width, ((100 - p[1]) / 200) * height];
      const selected = new Set(result.rows);
      records.forEach((row, i) => {
        const a = project(row),
          b = project(row.slice(2));
        ctx.fillStyle =
          i === result.nearest?.index ? '#ff73bd' : selected.has(i) ? '#5de8fa' : '#29445e';
        ctx.globalAlpha = selected.has(i) || i === result.nearest?.index ? 1 : 0.5;
        if (source === 'points') {
          ctx.beginPath();
          ctx.arc(...a, selected.has(i) ? 3 : 1.8, 0, Math.PI * 2);
          ctx.fill();
        } else ctx.fillRect(a[0], b[1], Math.max(2, b[0] - a[0]), Math.max(2, a[1] - b[1]));
      });
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#ffc66f';
      ctx.lineWidth = 2;
      if (mode === 'range') {
        const a = project(point.map(v => v - radius)),
          b = project(point.map(v => v + radius));
        ctx.strokeRect(a[0], b[1], b[0] - a[0], a[1] - b[1]);
      } else {
        const a = project(point),
          b = project([point[0] + 160 / Math.hypot(1, 0.3), point[1] + 48 / Math.hypot(1, 0.3)]);
        ctx.beginPath();
        ctx.moveTo(...a);
        ctx.lineTo(...b);
        ctx.stroke();
      }
      const p = project(point);
      ctx.beginPath();
      ctx.arc(...p, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
    };
    const resize = new ResizeObserver(draw);
    resize.observe(element);
    draw();
    return () => resize.disconnect();
  }, [point, radius, result, mode, source]);
  return (
    <div className="query-example">
      <canvas
        ref={canvas}
        aria-label="Spatial query field"
        style={{position: 'absolute', inset: 0, width: '100%', height: '100%', touchAction: 'none'}}
        onPointerMove={event => {
          const rect = event.currentTarget.getBoundingClientRect();
          setPoint([
            ((event.clientX - rect.left) / rect.width) * 200 - 100,
            100 - ((event.clientY - rect.top) / rect.height) * 200
          ]);
        }}
      />
      <details>
        <summary>Spatial query explorer</summary>
        <div className="query-controls">
          <p>
            Move across 1,200 objects. Cyan marks query candidates; pink is the nearest row. The
            same APIs work with 3D boxes and points.
          </p>
          <label>
            Objects
            <select aria-label="Objects" value={source} onChange={e => setSource(e.target.value)}>
              <option value="boxes">Boxes</option>
              <option value="points">Points</option>
            </select>
          </label>
          <label>
            Query
            <select aria-label="Query" value={mode} onChange={e => setMode(e.target.value)}>
              <option value="range">Range overlap</option>
              <option value="ray">Ray candidates</option>
            </select>
          </label>
          <label>
            Range radius · {radius}
            <input
              aria-label="Range radius"
              type="range"
              min="2"
              max="40"
              value={radius}
              onChange={e => setRadius(Number(e.target.value))}
            />
          </label>
          <label>
            Query X
            <input
              aria-label="Query X"
              type="range"
              min="-90"
              max="90"
              value={point[0]}
              onChange={e => setPoint([Number(e.target.value), point[1]])}
            />
          </label>
          <label>
            Query Y
            <input
              aria-label="Query Y"
              type="range"
              min="-90"
              max="90"
              value={point[1]}
              onChange={e => setPoint([point[0], Number(e.target.value)])}
            />
          </label>
        </div>
      </details>
      <div className="query-caption" role="status">
        {result.rows.length} / 1,200 candidates · nearest row {result.nearest?.index} · distance{' '}
        {result.nearest?.distance.toFixed(2)}
      </div>
    </div>
  );
}
