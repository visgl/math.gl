// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, {useMemo, useState} from 'react';
import {Matrix4} from '@math.gl/core';
import {Geometry, SphereGeometry, unpackIndexedGeometry} from '@math.gl/geometry';
import {
  GL,
  transformGeometry,
  mergeGeometries,
  weldGeometry,
  getDegenerateTriangles
} from '@math.gl/geometry-utils';
import Mesh from '../geometry-viewer/mesh';
import '../geometry-viewer/styles.css';
import './styles.css';

export default function Example() {
  const [scale, setScale] = useState(1.4);
  const [reflect, setReflect] = useState(false);
  const [weld, setWeld] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const result = useMemo(() => {
    const base = unpackIndexedGeometry(new SphereGeometry({nlat: 12, nlong: 18}));
    const count = base.attributes.POSITION.value.length / 3;
    const colored = color => ({
      mode: GL.TRIANGLES,
      attributes: {
        ...base.attributes,
        COLOR_0: {size: 3, value: Float32Array.from({length: count * 3}, (_, i) => color[i % 3])}
      }
    });
    const left = transformGeometry(colored([0.2, 0.85, 1]), new Matrix4().translate([-1.6, 0, 0]));
    const right = transformGeometry(
      colored([1, 0.35, 0.65]),
      new Matrix4().translate([1.6, 0, 0]).scale([reflect ? -scale : scale, 1, 1])
    );
    const merged = mergeGeometries([left, right]);
    const processed = weld ? weldGeometry(merged).geometry : merged;
    return {
      geometry: new Geometry({
        topology: 'triangle-list',
        attributes: processed.attributes,
        indices: processed.indices
      }),
      input: count * 2,
      vertices: processed.attributes.POSITION.value.length / 3,
      degenerate: getDegenerateTriangles(processed, 1e-12).length
    };
  }, [scale, reflect, weld]);
  return (
    <div className="processing-example">
      <Mesh
        geometry={result.geometry}
        wireframe={wireframe}
        preserveCamera
        ariaLabel="Two transformed and merged sphere meshes. Drag to orbit."
      />
      <details className="processing-info">
        <summary>Geometry workshop · controls</summary>
        <p>
          Transform two meshes, merge their attributes, then weld duplicate vertices while
          preserving UV seams.
        </p>
        <label>
          Pink mesh stretch: {scale.toFixed(1)}
          <input
            type="range"
            min="0.4"
            max="2"
            step="0.1"
            value={scale}
            onChange={e => setScale(Number(e.target.value))}
          />
        </label>
        <label>
          <input type="checkbox" checked={reflect} onChange={e => setReflect(e.target.checked)} />{' '}
          Reflect pink mesh
        </label>
        <label>
          <input type="checkbox" checked={weld} onChange={e => setWeld(e.target.checked)} /> Weld
          matching attribute tuples
        </label>
        <label>
          <input
            type="checkbox"
            checked={wireframe}
            onChange={e => setWireframe(e.target.checked)}
          />{' '}
          Wireframe
        </label>
        <p>Reflection reverses winding. Welding keeps UV and normal discontinuities.</p>
      </details>
      <div className="processing-caption" role="status">
        {result.input.toLocaleString()} input vertices → {result.vertices.toLocaleString()} stored
        vertices · {result.degenerate} near-zero-area triangles · drag to orbit
      </div>
    </div>
  );
}
