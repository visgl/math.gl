// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, {useMemo, useState} from 'react';
import * as primitives from '@math.gl/geometry';
import Mesh from './mesh';
import './styles.css';

export const presets = {
  BoxGeometry: {size: [1.5, 1, 0.75]},
  CubeGeometry: {size: 1},
  CapsuleGeometry: {height: 1, radiusBottom: 0.4, radiusTop: 0.4, nradial: 24, ncap: 8},
  CylinderGeometry: {height: 1.5, radiusBottom: 0.5, radiusTop: 0.5, nradial: 24},
  ConeGeometry: {height: 1.5, radius: 0.6, nradial: 24},
  TruncatedConeGeometry: {
    height: 1.5,
    bottomRadius: 0.7,
    topRadius: 0.3,
    topCap: true,
    bottomCap: true,
    nradial: 24
  },
  PlaneGeometry: {sizeX: 2, sizeZ: 2, nx: 6, nz: 6},
  SphereGeometry: {radius: 0.75, nlat: 16, nlong: 24},
  IcoSphereGeometry: {radius: 0.75, iterations: 2}
};

/** Supply a Geometry instance directly, or a constructor name and constructor props. */
export default function GeometryExample({geometry, geometryType, geometryProps}) {
  const [selected, setSelected] = useState('BoxGeometry');
  const [wireframe, setWireframe] = useState(true);
  const type = geometryType || selected;
  const mesh = useMemo(() => {
    if (geometry) return geometry;
    const Constructor = primitives[type];
    if (!presets[type]) throw new Error(`Unknown geometry type: ${type}`);
    return new Constructor({...presets[type], ...geometryProps});
  }, [geometry, type, geometryProps]);
  const position = mesh.attributes.POSITION || mesh.attributes.positions;
  const props = {...presets[type], ...geometryProps};
  return (
    <div className="geometry-example">
      <aside className="geometry-panel">
        <h2>{geometry ? 'Geometry' : type}</h2>
        {!geometry && !geometryType && (
          <label>
            Primitive
            <select value={selected} onChange={event => setSelected(event.target.value)}>
              {Object.keys(presets).map(name => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </label>
        )}
        <label className="geometry-check">
          <input
            type="checkbox"
            checked={wireframe}
            onChange={event => setWireframe(event.target.checked)}
          />{' '}
          Triangle edges
        </label>
        <dl>
          <dt>Vertices</dt>
          <dd>{position.value.length / position.size}</dd>
          <dt>Draw count</dt>
          <dd>{mesh.vertexCount}</dd>
          <dt>Topology</dt>
          <dd>{mesh.topology}</dd>
          <dt>Indices</dt>
          <dd>{mesh.indices ? mesh.indices.value.constructor.name : 'None'}</dd>
        </dl>
        {!geometry && <pre>{`new ${type}(${JSON.stringify(props, null, 2)})`}</pre>}
        <p>Drag to orbit. Scroll or pinch to zoom. Focus the canvas for arrow keys and +/−.</p>
      </aside>
      <Mesh geometry={mesh} wireframe={wireframe} />
    </div>
  );
}
