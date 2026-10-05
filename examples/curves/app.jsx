// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, {useEffect, useMemo, useRef} from 'react';
import {Matrix4, toRadians} from '@math.gl/core';
import {OrbitControls} from '@luma.gl/engine';
import {CatmullRomCurve, CubicBezierCurve, HermiteCurve, CurveArcLength} from '@math.gl/curves';
import './styles.css';

const CAMERA = {distance: 19, yaw: 0.65, pitch: 0.45};
const CYAN = '#5de8fa';
const PINK = '#ff73bd';

function makeScene(preset, height, parameterization) {
  let points, curve;
  const closed = preset === 'knot';
  if (closed) {
    points = Array.from({length: 24}, (_, i) => {
      const a = (i * Math.PI * 2) / 24;
      const r = 1.7 * (2 + Math.cos(3 * a));
      return [r * Math.cos(2 * a), height * Math.sin(3 * a), r * Math.sin(2 * a)];
    });
    curve = new CatmullRomCurve(points, {closed, parameterization});
  } else if (preset === 'spiral') {
    points = Array.from({length: 16}, (_, i) => {
      const a = (i * Math.PI * 4) / 15;
      const r = 0.8 + i * 0.23;
      return [r * Math.cos(a), height * ((i / 15) * 2 - 1), r * Math.sin(a)];
    });
    curve = new CatmullRomCurve(points, {parameterization});
  } else if (preset === 'bezier') {
    points = [
      [-5, -height, 0],
      [-4, height * 2, -5],
      [4, -height * 2, 5],
      [5, height, 0]
    ];
    curve = new CubicBezierCurve(...points);
  } else {
    points = [
      [-5, 0, -2],
      [5, 0, 2]
    ];
    curve = new HermiteCurve(...points, [0, height * 8, 12], [0, height * 8, -12]);
  }
  const table = new CurveArcLength(curve, 3072);
  const samples = Array.from({length: 385}, (_, i) => table.getPointAt(i / 384));
  return {points, curve, table, samples, closed};
}

function CurveCanvas({scene, paused, speed, showControls, showSamples}) {
  const canvas = useRef(null);
  const orbit = useRef(null);
  const current = useRef({scene, paused, speed, showControls, showSamples});
  current.current = {scene, paused, speed, showControls, showSamples};
  useEffect(() => {
    const element = canvas.current;
    const ctx = element.getContext('2d');
    const controls = new OrbitControls(element, {...CAMERA, minDistance: 12, maxDistance: 35});
    orbit.current = controls;
    let width = 1,
      height = 1,
      frame,
      previousTime,
      phase = 0.12,
      visible = true;
    const resize = new ResizeObserver(([entry]) => {
      width = entry.contentRect.width;
      height = entry.contentRect.height;
    });
    resize.observe(element);
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    visibility.observe(element);
    const render = time => {
      const delta = previousTime === undefined ? 0 : Math.min((time - previousTime) / 1000, 0.05);
      previousTime = time;
      const state = current.current;
      if (visible && !document.hidden && width > 0 && height > 0) {
        if (!state.paused) phase += (delta * state.speed) / 12;
        controls.update(time);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = Math.round(width * dpr),
          h = Math.round(height * dpr);
        if (element.width !== w || element.height !== h) {
          element.width = w;
          element.height = h;
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const background = ctx.createRadialGradient(
          width * 0.5,
          height * 0.4,
          0,
          width * 0.5,
          height * 0.5,
          width * 0.8
        );
        background.addColorStop(0, '#14283e');
        background.addColorStop(1, '#050d19');
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, width, height);
        const view = new Matrix4().lookAt({eye: controls.getEyePosition()});
        const projection = new Matrix4()
          .perspective({fovy: toRadians(45), aspect: width / height, near: 0.1, far: 100})
          .multiplyRight(view);
        const project = point => {
          const depth = view.transformAsPoint(point)[2];
          if (depth >= -0.1) return null;
          const q = projection.transformAsPoint(point);
          return [((q[0] + 1) * width) / 2, ((1 - q[1]) * height) / 2, depth];
        };
        const commands = [];
        const line = (a, b, color, thickness = 1, glow = 0) => {
          const p = project(a),
            q = project(b);
          if (p && q)
            commands.push({
              depth: (p[2] + q[2]) / 2,
              draw: () => {
                ctx.beginPath();
                ctx.moveTo(p[0], p[1]);
                ctx.lineTo(q[0], q[1]);
                ctx.strokeStyle = color;
                ctx.lineWidth = thickness;
                ctx.shadowColor = color;
                ctx.shadowBlur = glow;
                ctx.stroke();
                ctx.shadowBlur = 0;
              }
            });
        };
        const dot = (point, color, radius = 3, glow = 0) => {
          const p = project(point);
          if (p)
            commands.push({
              depth: p[2],
              draw: () => {
                ctx.beginPath();
                ctx.arc(p[0], p[1], radius, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.shadowColor = color;
                ctx.shadowBlur = glow;
                ctx.fill();
                ctx.shadowBlur = 0;
              }
            });
        };
        for (let i = -7; i <= 7; i++) {
          line([i, -4.5, -7], [i, -4.5, 7], '#21354b');
          line([-7, -4.5, i], [7, -4.5, i], '#21354b');
        }
        const {curve, table, samples, points, closed} = state.scene;
        for (let i = 1; i < samples.length; i++) line(samples[i - 1], samples[i], CYAN, 2.5, 6);
        if (state.showControls) {
          for (let i = 0; i < points.length; i++) {
            dot(points[i], '#ffc66f', 4);
            if (i > 0) line(points[i - 1], points[i], '#b17e4670');
          }
          if (closed) line(points.at(-1), points[0], '#b17e4670');
        }
        if (state.showSamples) {
          for (let i = 0; i < 32; i++) dot(table.getPointAt(i / 31), '#c5faff', 2.5);
        }
        const progress = closed ? phase % 1 : 1 - Math.abs(1 - (phase % 2));
        for (const [useLength, color] of [
          [true, CYAN],
          [false, PINK]
        ]) {
          const t = useLength ? table.getParameterAt(progress) : progress;
          const head = curve.getPoint(t);
          const direction = closed || phase % 2 < 1 ? 1 : -1;
          for (let j = 1; j <= 22; j++) {
            let u = progress - direction * j * 0.004;
            if (closed) u = (u + 1) % 1;
            if (u >= 0 && u <= 1)
              dot(useLength ? table.getPointAt(u) : curve.getPoint(u), color, 3 * (1 - j / 24));
          }
          dot(head, color, 6, 18);
          dot(head, '#ffffff', 2.5);
          if (useLength) {
            const tangent = curve.getTangent(t);
            const end = head.map((v, i) => v + tangent[i] * direction * 1.1);
            line(head, end, '#d6fcff', 2);
            dot(end, '#d6fcff', 2);
          }
        }
        commands.sort((a, b) => a.depth - b.depth).forEach(command => command.draw());
      }
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      visibility.disconnect();
      controls.destroy();
      orbit.current = null;
    };
  }, []);
  return (
    <div className="curves-stage">
      <canvas
        ref={canvas}
        tabIndex={0}
        aria-label="3D curve scene. Drag to orbit, scroll to zoom. Arrow keys orbit; plus and minus zoom."
        onKeyDown={event => {
          const control = orbit.current;
          if (!control) return;
          const moves = {
            ArrowLeft: [-0.1, 0],
            ArrowRight: [0.1, 0],
            ArrowUp: [0, 0.1],
            ArrowDown: [0, -0.1]
          };
          if (moves[event.key]) {
            event.preventDefault();
            control.setProps({
              yaw: control.yaw + moves[event.key][0],
              pitch: control.pitch + moves[event.key][1]
            });
          } else if (event.key === '+' || event.key === '-') {
            event.preventDefault();
            control.setProps({distance: control.distance * (event.key === '+' ? 0.9 : 1.1)});
          }
        }}
      />
      <div className="curves-scene-label">
        <span>LIVE / EUCLIDEAN 3D</span>
        <strong>{scene.closed ? 'The trefoil circuit' : 'Flight through a curve'}</strong>
      </div>
      <div className="curves-legend">
        <span>
          <i style={{background: CYAN}} />
          Constant distance
        </span>
        <span>
          <i style={{background: PINK}} />
          Constant parameter
        </span>
      </div>
      <button
        className="curves-camera"
        type="button"
        onClick={() => {
          orbit.current?.setProps(CAMERA);
          orbit.current?.reset();
        }}
      >
        Reset camera
      </button>
    </div>
  );
}

export default function CurvesExample() {
  const [preset, setPreset] = React.useState('knot');
  const [height, setHeight] = React.useState(2.4);
  const [parameterization, setParameterization] = React.useState('centripetal');
  const [paused, setPaused] = React.useState(false);
  const [speed, setSpeed] = React.useState(1);
  const [showControls, setShowControls] = React.useState(false);
  const [showSamples, setShowSamples] = React.useState(false);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setPaused(true);
  }, []);
  const scene = useMemo(
    () => makeScene(preset, height, parameterization),
    [preset, height, parameterization]
  );
  return (
    <div className="curves-example">
      <aside className="curves-panel">
        <span className="curves-eyebrow">@math.gl/curves</span>
        <h2>Curve flight lab</h2>
        <p>
          One path. Two clocks. Watch the pink traveler accelerate while cyan covers equal
          distances.
        </p>
        <label>
          Path
          <select
            aria-label="Path"
            value={preset}
            onChange={event => setPreset(event.target.value)}
          >
            <option value="knot">Trefoil knot · closed Catmull–Rom</option>
            <option value="spiral">Expanding spiral · Catmull–Rom</option>
            <option value="bezier">Cubic Bézier swoop</option>
            <option value="hermite">Hermite flight</option>
          </select>
        </label>
        {(preset === 'knot' || preset === 'spiral') && (
          <label>
            Knot spacing
            <select
              aria-label="Knot spacing"
              value={parameterization}
              onChange={event => setParameterization(event.target.value)}
            >
              <option value="centripetal">Centripetal</option>
              <option value="chordal">Chordal</option>
              <option value="uniform">Uniform</option>
            </select>
          </label>
        )}
        <label>
          Vertical reach <output>{height.toFixed(1)}</output>
          <input
            aria-label="Vertical reach"
            type="range"
            min="0.5"
            max="3.5"
            step="0.1"
            value={height}
            onChange={event => setHeight(Number(event.target.value))}
          />
        </label>
        <label>
          Flight speed <output>{speed.toFixed(1)}×</output>
          <input
            aria-label="Flight speed"
            type="range"
            min="0.2"
            max="2"
            step="0.1"
            value={speed}
            onChange={event => setSpeed(Number(event.target.value))}
          />
        </label>
        <label className="curves-check">
          <input
            type="checkbox"
            checked={showControls}
            onChange={event => setShowControls(event.target.checked)}
          />{' '}
          Control points
        </label>
        <label className="curves-check">
          <input
            type="checkbox"
            checked={showSamples}
            onChange={event => setShowSamples(event.target.checked)}
          />{' '}
          Equal-distance samples
        </label>
        <button type="button" aria-pressed={paused} onClick={() => setPaused(!paused)}>
          {paused ? 'Resume flight' : 'Pause flight'}
        </button>
        <div className="curves-metric">
          <span>Approximate path length</span>
          <strong>
            {scene.table.length.toFixed(2)} <small>units</small>
          </strong>
        </div>
        <p className="curves-hint">
          Drag to orbit · scroll to zoom
          <br />
          The white whisker shows the tangent.
        </p>
      </aside>
      <CurveCanvas {...{scene, paused, speed, showControls, showSamples}} />
    </div>
  );
}
