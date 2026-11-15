// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// biome-ignore lint/correctness/noUnusedImports: Standalone examples use the classic JSX transform.
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  TerrainSurface,
  sweepTerrainRotatingBox,
  sweepTerrainRotatingCapsule,
  sweepTerrainRotatingSphere
} from '@math.gl/geospatial/terrain';
import TerrainControls from './terrain-controls';

const patches = [-1, 1].map(side => [
  [0, -2, 0],
  [side * 2, -2, 0],
  [side * 2, 2, 0],
  [0, 2, 0]
]);
const surface = new TerrainSurface({
  positions: Float64Array.from(patches.flat(2)),
  indices: Uint32Array.of(0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7)
});
const half = [1, 0.28, 0.25];
const boxCorners = Array.from({length: 8}, (_, i) =>
  half.map((extent, axis) => (i & (1 << axis) ? extent : -extent))
);
const turning = {
  box: {height: 0.75, angle: Math.PI / 2, axis: 1},
  seam: {height: 0.75, angle: Math.PI / 2, axis: 0},
  grazing: {height: 1.25, angle: Math.PI, axis: 1}
};

/** Visualize exact prescribed poses and the CPU sweep's first-contact interval. */
export default function ColliderReplay({controlsRoot}) {
  const canvas = useRef(null);
  const [scenario, setScenario] = useState('seam');
  const [budget, setBudget] = useState(100000);
  const [fraction, setFraction] = useState(0);
  const [yaw, setYaw] = useState(-35);
  const [playing, setPlaying] = useState(false);
  const {height, angle, axis} = turning[scenario];
  const result = useMemo(() => {
    const pivot = [0, 0, height];
    const rotation = [0, 0, 0, Math.cos(angle / 2)];
    rotation[axis] = Math.sin(angle / 2);
    const motion = {pivot, rotation, translation: [0, 0, 0]};
    const options = {maxWork: budget};
    if (scenario === 'box') return sweepTerrainRotatingBox(surface, pivot, half, motion, options);
    if (scenario === 'grazing')
      return sweepTerrainRotatingSphere(surface, [1, 0, height], 0.25, motion, options);
    return sweepTerrainRotatingCapsule(
      surface,
      [0, -1, height],
      [0, 1, height],
      0.25,
      motion,
      options
    );
  }, [scenario, height, angle, axis, budget]);

  useEffect(() => {
    if (!playing) return undefined;
    let frame;
    const start = performance.now();
    const tick = now => {
      setFraction(((now - start) / 2500) % 1);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  useEffect(() => {
    const element = canvas.current;
    const context = element.getContext('2d');
    const render = () => {
      const {width, height: pixels} = element.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      const bufferWidth = Math.round(width * ratio);
      const bufferHeight = Math.round(pixels * ratio);
      if (element.width !== bufferWidth) element.width = bufferWidth;
      if (element.height !== bufferHeight) element.height = bufferHeight;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.fillStyle = '#152133';
      context.fillRect(0, 0, width, pixels);
      const size = Math.min(width / 6.4, pixels / 4.5);
      const bearing = (yaw * Math.PI) / 180;
      const bx = Math.cos(bearing);
      const by = Math.sin(bearing);
      const project = ([x, y, z]) => [
        width / 2 + size * (bx * x - by * y),
        pixels * 0.57 + size * (0.54 * (by * x + bx * y) - 0.84 * z)
      ];
      const path = points => {
        context.beginPath();
        points
          .map(project)
          .forEach(([x, y], i) => (i ? context.lineTo(x, y) : context.moveTo(x, y)));
      };
      const line = (a, b, color, thickness = 1) => {
        path([a, b]);
        context.strokeStyle = color;
        context.lineWidth = thickness;
        context.stroke();
      };
      for (const [i, patch] of patches.entries()) {
        path(patch);
        context.closePath();
        context.fillStyle = i ? '#294e5e' : '#244154';
        context.fill();
        context.strokeStyle = '#608596';
        context.lineWidth = 1;
        context.stroke();
        line(patch[0], patch[2], '#608596');
      }
      line(patches[0][0], patches[0][3], '#7de5e1', 2);
      const sin = Math.sin(angle * fraction);
      const cos = Math.cos(angle * fraction);
      const rotate = ([x, y, z]) =>
        axis === 0
          ? [x, y * cos - z * sin, height + y * sin + z * cos]
          : [x * cos + z * sin, y, height + z * cos - x * sin];
      const color = '#ffc56a';
      if (scenario === 'box') {
        const corners = boxCorners.map(rotate);
        for (let i = 0; i < corners.length; i++) {
          for (const bit of [1, 2, 4]) {
            if (!(i & bit)) line(corners[i], corners[i | bit], color, 2);
          }
        }
      } else if (scenario === 'seam') {
        context.lineCap = 'round';
        line(rotate([0, -1, 0]), rotate([0, 1, 0]), color, size / 2);
        context.lineCap = 'butt';
      } else {
        const [x, y] = project(rotate([1, 0, 0]));
        context.beginPath();
        context.arc(x, y, size / 4, 0, 2 * Math.PI);
        context.fillStyle = color;
        context.fill();
      }
      if (result.status === 'hit' && result.contact) {
        const [x, y] = project(result.contact.point);
        context.beginPath();
        context.arc(x, y, 5, 0, 2 * Math.PI);
        context.fillStyle = '#f87c9d';
        context.fill();
      }
    };
    const resize = new ResizeObserver(render);
    resize.observe(element);
    render();
    return () => resize.disconnect();
  }, [scenario, height, angle, axis, fraction, yaw, result]);

  return (
    <>
      <TerrainControls target={controlsRoot}>
        <label>
          Collider scenario{' '}
          <select
            value={scenario}
            onChange={e => {
              setScenario(e.target.value);
              setPlaying(false);
              setFraction(0);
            }}
          >
            <option value="seam">Capsule across tile seam</option>
            <option value="grazing">Orbiting sphere grazes terrain</option>
            <option value="box">Box rotates into terrain</option>
          </select>
        </label>
        <label>
          Work budget{' '}
          <select value={budget} onChange={e => setBudget(Number(e.target.value))}>
            <option value={100000}>100,000</option>
            <option value={32}>32</option>
            <option value={6}>6</option>
            <option value={0}>0</option>
          </select>
        </label>
        <label>
          Motion fraction{' '}
          <input
            type="range"
            min="0"
            max="1"
            step="0.001"
            value={fraction}
            onChange={e => {
              setPlaying(false);
              setFraction(Number(e.target.value));
            }}
          />
        </label>
        <label>
          View angle{' '}
          <input
            type="range"
            min="-180"
            max="180"
            value={yaw}
            onChange={e => setYaw(Number(e.target.value))}
          />
        </label>
        <button type="button" onClick={() => setPlaying(!playing)}>
          {playing ? 'Pause' : 'Play'} replay
        </button>
        {result.status === 'hit' && (
          <button
            type="button"
            onClick={() => {
              setPlaying(false);
              setFraction(result.fraction);
            }}
          >
            Show contact pose
          </button>
        )}
      </TerrainControls>
      <figure style={{margin: 0, width: '100%'}}>
        <canvas
          ref={canvas}
          aria-label="Rotating collider above two terrain tiles"
          style={{display: 'block', width: '100%', height: 'clamp(240px, 55vh, 600px)'}}
        />
        <figcaption aria-live="polite" style={{padding: '0.6rem'}}>
          <strong>{result.status}</strong> · {result.work.toLocaleString()} work units
          {result.status === 'hit' && (
            <>
              {' '}
              · First contact [{result.lowerFraction.toFixed(6)}, {result.fraction.toFixed(6)}]
            </>
          )}
          {result.status === 'incomplete' && <> · Insufficient work or unresolved grazing</>}
        </figcaption>
      </figure>
    </>
  );
}
