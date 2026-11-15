// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// biome-ignore lint/correctness/noUnusedImports: Standalone examples use the classic JSX transform.
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  createTerrainRegionalViewshed,
  HeightField,
  TerrainRegionalViewStatus,
  TerrainSampleStatus
} from '@math.gl/geospatial/terrain';
import data from './assets/sierra-reference.json';
import TerrainControls from './terrain-controls';

const {width, height} = data;
// Convert projected spacing to approximate local ground spacing at the window center.
const mercatorY = data.origin[1] + data.rowStep[1] * ((height - 1) / 2);
const spacing = data.columnStep[0] / Math.cosh(mercatorY / 6378137);
const grid = {width, height, origin: [0, 0], spacing: [spacing, spacing]};
const field = new HeightField({
  width,
  height,
  columnStep: [spacing, 0],
  rowStep: [0, spacing],
  heights: Float64Array.from(data.heights, z => z ?? NaN)
});
const trail = [
  [6, 23],
  [9, 22],
  [12, 18],
  [15, 16],
  [20, 12],
  [23, 9],
  [27, 8]
];
const palette = ['#53d39a', '#252d44', '#d8a057', '#737986', '#ffffff'];
const labels = ['Visible', 'Blocked', 'Unknown along sightline', 'Missing target'];

/** Sightlines from selectable waypoints on an illustrative Sierra route. */
export default function TrailPlanner({controlsRoot}) {
  const canvas = useRef(null);
  const [waypoint, setWaypoint] = useState(3);
  const [eye, setEye] = useState(2);
  const [curved, setCurved] = useState(true);
  const [evicted, setEvicted] = useState(false);
  const [column, row] = trail[waypoint];
  const result = useMemo(
    () =>
      createTerrainRegionalViewshed(
        grid,
        (x, y) => {
          if (evicted && x >= 13 * spacing && x < 19 * spacing && y < 12 * spacing)
            return {status: TerrainSampleStatus.NOT_RESIDENT, height: 0};
          const column = Math.round(x / spacing);
          const row = Math.round(y / spacing);
          if (Math.abs(x / spacing - column) < 1e-10 && Math.abs(y / spacing - row) < 1e-10) {
            const height = field.getHeight(column, row);
            return {
              status:
                height === undefined ? TerrainSampleStatus.NO_DATA : TerrainSampleStatus.VALID,
              height: height ?? 0
            };
          }
          return field.sample(x, y, {interpolation: 'triangle'});
        },
        {
          observer: [column * spacing, row * spacing, field.getHeight(column, row) + eye],
          sampleStep: spacing / 2,
          targetOffset: 2,
          radius: curved ? 6371000 : undefined
        }
      ),
    [column, row, eye, curved, evicted]
  );

  useEffect(() => {
    const context = canvas.current.getContext('2d');
    const size = 12;
    for (let i = 0; i < result.statuses.length; i++) {
      const x = i % width;
      const y = Math.floor(i / width);
      const z = data.heights[i] ?? 0;
      context.fillStyle = palette[result.statuses[i]];
      context.fillRect(x * size, y * size, size, size);
      context.fillStyle = `rgba(0,0,0,${0.32 * (1 - Math.min(1, Math.max(0, z / 3500)))})`;
      context.fillRect(x * size, y * size, size, size);
    }
    context.beginPath();
    for (const [i, [x, y]] of trail.entries()) {
      const px = (x + 0.5) * size;
      const py = (y + 0.5) * size;
      if (i === 0) context.moveTo(px, py);
      else context.lineTo(px, py);
    }
    context.strokeStyle = '#f4f6ff';
    context.lineWidth = 2;
    context.stroke();
    for (const [i, [x, y]] of trail.entries()) {
      context.beginPath();
      context.arc((x + 0.5) * size, (y + 0.5) * size, i === waypoint ? 6 : 3, 0, 2 * Math.PI);
      context.fillStyle = i === waypoint ? '#ffffff' : palette[result.statuses[y * width + x]];
      context.fill();
      context.strokeStyle = '#172534';
      context.stroke();
    }
  }, [result, waypoint]);

  const visible = trail.filter(
    ([x, y]) => result.statuses[y * width + x] === TerrainRegionalViewStatus.VISIBLE
  ).length;
  const counts = labels.map((_, status) =>
    result.statuses.reduce((sum, value) => sum + Number(value === status), 0)
  );
  return (
    <section aria-label="Sierra trail planner">
      <TerrainControls target={controlsRoot}>
        <label>
          Observer waypoint
          <select value={waypoint} onChange={event => setWaypoint(Number(event.target.value))}>
            {trail.map(([x, y], i) => (
              <option value={i} key={i}>
                {i + 1} · {Math.round(field.getHeight(x, y))} m
              </option>
            ))}
          </select>
        </label>
        <label>
          Eye height · {eye} m
          <input
            aria-label="Eye height"
            type="range"
            min="2"
            max="40"
            value={eye}
            onChange={event => setEye(Number(event.target.value))}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={curved}
            onChange={event => setCurved(event.target.checked)}
          />
          Earth curvature
        </label>
        <label>
          <input
            type="checkbox"
            checked={evicted}
            onChange={event => setEvicted(event.target.checked)}
          />
          Simulate missing tile
        </label>
      </TerrainControls>
      <h2>Sierra trail planner</h2>
      <p>
        {visible} of {trail.length - 1} other waypoints visible from waypoint {waypoint + 1}.
      </p>
      <canvas
        ref={canvas}
        width={width * 12}
        height={height * 12}
        style={{width: 'min(100%, 480px)', height: 'auto'}}
        role="img"
        aria-label="Sampled Sierra viewshed with the selected trail and observer"
      />
      <ul aria-label="Viewshed legend">
        {labels.map((label, i) => (
          <li key={label}>
            <span style={{color: palette[i]}}>■</span> {label} · {counts[i]}
          </li>
        ))}
      </ul>
      <p>
        Sampled sightlines on an illustrative route using Sierra DEM elevations and approximate
        local ground distances.
      </p>
    </section>
  );
}
