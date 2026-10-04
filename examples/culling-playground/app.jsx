// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, {useMemo, useState} from 'react';
import Mesh from '../geometry-viewer/mesh';
import '../geometry-viewer/styles.css';
import {initial, makeScene} from './scene';
import './styles.css';

export default function CullingExample() {
  const [state, setState] = useState(initial);
  const scene = useMemo(() => makeScene(state), [state]);
  const update = (name, value) => setState(previous => ({...previous, [name]: value}));
  return (
    <div className="geometry-example culling-example">
      <aside className="geometry-panel">
        <h2>Frustum culling</h2>
        <label>
          Bounding volume
          <select value={state.type} onChange={event => update('type', event.target.value)}>
            <option value="sphere">BoundingSphere</option>
            <option value="aabb">AxisAlignedBoundingBox</option>
            <option value="obb">OrientedBoundingBox</option>
          </select>
        </label>
        {[
          ['x', 'Center X', -4, 4],
          ['y', 'Center Y', -3, 3],
          ['z', 'Center Z', -4, 4],
          ['size', 'Size', 0.2, 1.2],
          ['fov', 'Vertical FOV', 30, 80],
          ...(state.type === 'obb' ? [['angle', 'Box rotation', 0, 180]] : [])
        ].map(([name, label, min, max]) => (
          <label key={name}>
            {label}{' '}
            <output>
              {state[name].toFixed(name === 'fov' || name === 'angle' ? 0 : 2)}
              {name === 'fov' || name === 'angle' ? '°' : ''}
            </output>
            <input
              aria-label={label}
              type="range"
              min={min}
              max={max}
              step={name === 'fov' || name === 'angle' ? 1 : 0.05}
              value={state[name]}
              onChange={event => update(name, Number(event.target.value))}
            />
          </label>
        ))}
        <p className={`culling-result ${scene.result}`} role="status">
          Selected volume: {scene.result}
        </p>
        <div className="culling-legend">
          {Object.entries(scene.counts).map(([result, count]) => (
            <span key={result} className={result}>
              {result}: {count}
            </span>
          ))}
        </div>
        <label className="geometry-check">
          <input
            type="checkbox"
            checked={state.hideOutside}
            onChange={event => update('hideOutside', event.target.checked)}
          />{' '}
          Hide outside volumes
        </label>
        <button type="button" onClick={() => setState(initial)}>
          Reset scene
        </button>
        <details>
          <summary>Six plane results</summary>
          <dl>
            {scene.planeResults.map((result, i) => (
              <React.Fragment key={i}>
                <dt>{['Left', 'Right', 'Bottom', 'Top', 'Near', 'Far'][i]}</dt>
                <dd>{result}</dd>
              </React.Fragment>
            ))}
          </dl>
        </details>
        <p>
          The blue frame is the test frustum, looking down −Z. Orbit moves the observer camera; it
          does not change the culling planes. Colored volumes show computeVisibility results.
        </p>
      </aside>
      <Mesh
        geometry={scene.geometry}
        wireframe={false}
        preserveCamera
        initialCamera={{distance: 2, yaw: 1.1}}
        ariaLabel="Orbit observer camera around the culling scene"
      />
    </div>
  );
}
