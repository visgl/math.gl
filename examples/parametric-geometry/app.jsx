// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, {useEffect, useMemo, useState} from 'react';
import {TorusGeometry, LatheGeometry, ParametricGeometry} from '@math.gl/geometry/parametric';
import {Geometry} from '@math.gl/geometry';
import Mesh from '../geometry-viewer/mesh';
import '../geometry-viewer/styles.css';
import '../geometry-processing/styles.css';
import './styles.css';
const functions = {
  Wave: '(u, v, a) => [(u - 0.5) * 3, a * Math.sin(u * 12) * Math.cos(v * 12), -(v - 0.5) * 3]',
  Saddle:
    '(u, v, a) => { const x = (u - 0.5) * 3, z = (v - 0.5) * 3; return [x, a * (x*x - z*z), -z]; }',
  Helicoid:
    '(u, v, a) => { const t = u * Math.PI * 4, r = 0.2 + v; return [r * Math.cos(t), a * (t - Math.PI * 2), -r * Math.sin(t)]; }'
};
const presetFunctions = {
  torus: `(u, v, a) => {
  const theta = u * Math.PI * 2;
  const phi = v * Math.PI * 2;
  const r = 1 + a * Math.cos(phi);
  return [r * Math.cos(theta), a * Math.sin(phi), -r * Math.sin(theta)];
}`,
  lathe: `(u, v, a) => {
  const profile = [[0,-1], [.55,-1], [.7,-.8], [.45,-.3], [a,.3], [.75,.8], [.8,1]];
  const t = v * (profile.length - 1);
  const i = Math.min(profile.length - 2, Math.floor(t));
  const f = t - i;
  const r = profile[i][0] * (1-f) + profile[i+1][0] * f;
  const y = profile[i][1] * (1-f) + profile[i+1][1] * f;
  const theta = u * Math.PI * 2;
  return [r * Math.cos(theta), y, -r * Math.sin(theta)];
}`,
  wave: `(u, v, a) => {
  const x = (u - 0.5) * 3;
  const z = (v - 0.5) * 3;
  return [x, a * Math.sin(x * 3) * Math.cos(z * 3), -z];
}`
};
export default function Example() {
  const [shape, setShape] = useState('torus'),
    [segments, setSegments] = useState(48),
    [amount, setAmount] = useState(0.4),
    [wireframe, setWireframe] = useState(false),
    [starter, setStarter] = useState('Wave'),
    [source, setSource] = useState(functions.Wave),
    [appliedSource, setAppliedSource] = useState(functions.Wave),
    [revision, setRevision] = useState(0),
    [customGeometry, setCustomGeometry] = useState(null),
    [error, setError] = useState(''),
    [building, setBuilding] = useState(false);
  useEffect(() => {
    if (shape !== 'function') return;
    setBuilding(true);
    setError('');
    let active = true;
    const worker = new Worker(new URL('./surface-worker.js', import.meta.url), {type: 'module'});
    const finish = message => {
      if (!active) return;
      active = false;
      clearTimeout(timeout);
      worker.terminate();
      setBuilding(false);
      if (message.error) setError(message.error);
      else {
        try {
          setCustomGeometry(new Geometry(message.geometry));
        } catch (exception) {
          setError(exception.message);
        }
      }
    };
    const timeout = setTimeout(
      () => finish({error: 'Function took too long. Simplify it and apply again.'}),
      3000
    );
    worker.onmessage = event => finish(event.data);
    worker.onerror = event => {
      event.preventDefault();
      finish({error: event.message || 'Unable to run function.'});
    };
    worker.postMessage({source: appliedSource, segments, amount});
    return () => {
      active = false;
      clearTimeout(timeout);
      worker.terminate();
    };
  }, [shape, appliedSource, revision, segments, amount]);
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
  const displayed = shape === 'function' && customGeometry ? customGeometry : geometry;
  return (
    <div className="processing-example">
      <Mesh
        geometry={displayed}
        wireframe={wireframe}
        preserveCamera
        ariaLabel="Parametric surface. Drag to orbit; scroll to zoom."
      />
      <details className="processing-info">
        <summary>Parametric geometry lab</summary>
        <p>Choose a primitive or define your own surface function over a UV grid.</p>
        <label>
          Surface
          <select
            aria-label="Surface"
            value={shape}
            onChange={e => {
              if (e.target.value === 'function') setCustomGeometry(displayed);
              setShape(e.target.value);
            }}
          >
            <option value="torus">Torus</option>
            <option value="lathe">Lathe vase</option>
            <option value="wave">Wave surface</option>
            <option value="function">Function</option>
          </select>
        </label>
        {shape !== 'function' && (
          <div className="function-editor">
            <p>Surface function · (u, v, a) → [x, y, z]</p>
            <pre>
              <code>{presetFunctions[shape]}</code>
            </pre>
            <button
              type="button"
              onClick={() => {
                setCustomGeometry(displayed);
                setStarter('');
                setSource(presetFunctions[shape]);
                setAppliedSource(presetFunctions[shape]);
                setRevision(value => value + 1);
                setShape('function');
              }}
            >
              Edit this function
            </button>
            <p>The primitive also defines its normals, seams, and sampling resolution.</p>
          </div>
        )}
        {shape === 'function' && (
          <div className="function-editor">
            <label>
              Starter function
              <select
                aria-label="Starter function"
                value={starter}
                onChange={event => {
                  setStarter(event.target.value);
                  const code = functions[event.target.value];
                  setSource(code);
                  setAppliedSource(code);
                  setRevision(value => value + 1);
                }}
              >
                <option value="" disabled>
                  Custom function
                </option>
                {Object.keys(functions).map(name => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </label>
            <label>
              Surface function
              <textarea
                aria-label="Surface function"
                value={source}
                onChange={event => {
                  setSource(event.target.value);
                  setStarter('');
                }}
                spellCheck={false}
                rows={7}
              />
            </label>
            <p>
              Enter <code>(u, v, a) =&gt; [x, y, z]</code>. UV ranges from 0 to 1; <code>a</code> is
              the shape parameter. Use <code>Math</code> for trigonometry. Runs locally in a worker.
            </p>
            <button
              type="button"
              onClick={() => {
                setAppliedSource(source);
                setRevision(value => value + 1);
              }}
            >
              Apply function
            </button>
            {building && <p role="status">Building surface…</p>}
            {error && (
              <p className="function-error" role="alert">
                {error} The previous surface is retained.
              </p>
            )}
          </div>
        )}
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
        {displayed.attributes.POSITION.value.length / 3} vertices · {displayed.vertexCount / 3}{' '}
        triangles · drag to orbit
      </div>
    </div>
  );
}
