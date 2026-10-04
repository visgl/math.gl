// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, {useEffect, useRef, useState} from 'react';
import {luma} from '@luma.gl/core';
import {webgl2Adapter} from '@luma.gl/webgl';
import {Geometry as LumaGeometry, Model, OrbitControls} from '@luma.gl/engine';
import {Matrix4, toRadians} from '@math.gl/core';

const camera = {distance: 3.5, yaw: 0.6, pitch: 0.35, target: [0, 0, 0]};
const uniforms = `uniform viewerUniforms {
  mat4 mvp;
  vec4 color;
} viewer;`;
const viewer = {
  name: 'viewer',
  vs: uniforms,
  fs: uniforms,
  uniformTypes: {mvp: 'mat4x4<f32>', color: 'vec4<f32>'},
  getUniforms: props => props
};
const vs = `#version 300 es
in vec3 positions;
out vec3 position;
void main() {
  position = positions;
  gl_Position = viewer.mvp * vec4(positions, 1.0);
  gl_PointSize = 5.0;
}`;
const fs = `#version 300 es
precision highp float;
in vec3 position;
out vec4 fragColor;
void main() {
  float light = 1.0;
  if (viewer.color.a > 0.0) {
    vec3 normal = normalize(cross(dFdx(position), dFdy(position)));
    light = 0.35 + 0.65 * abs(dot(normal, normalize(vec3(1.0, 2.0, 3.0))));
  }
  fragColor = vec4(viewer.color.rgb * light, 1.0);
}`;

/** Adapts math.gl CPU meshes to luma.gl and fits arbitrary mesh bounds to the orbit camera. */
export function prepareMesh(geometry) {
  const attribute = geometry.attributes.POSITION || geometry.attributes.positions;
  if (!attribute || attribute.size !== 3)
    throw new Error('Viewer requires a size-3 POSITION attribute');
  const positions = attribute.value;
  if (!positions.length) throw new Error('Viewer requires at least one vertex');
  const low = [Infinity, Infinity, Infinity],
    high = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i++) {
    if (!Number.isFinite(positions[i])) throw new Error('Positions must be finite');
    const axis = i % 3;
    low[axis] = Math.min(low[axis], positions[i]);
    high[axis] = Math.max(high[axis], positions[i]);
  }
  const center = low.map((value, i) => (value + high[i]) / 2);
  const radius = Math.hypot(...high.map((value, i) => (value - low[i]) / 2)) || 1;
  const normalized = Float32Array.from(positions, (value, i) => (value - center[i % 3]) / radius);
  const indices = geometry.indices?.value;
  const count = geometry.vertexCount;
  const index = i => (indices ? indices[i] : i);
  const edges = new Set(),
    lines = [];
  const addEdge = (a, b) => {
    const key = a < b ? `${a},${b}` : `${b},${a}`;
    if (!edges.has(key)) {
      edges.add(key);
      lines.push(a, b);
    }
  };
  for (let i = 0; i + 2 < count; i += geometry.topology === 'triangle-strip' ? 1 : 3) {
    if (!geometry.topology.startsWith('triangle')) break;
    const a = index(i),
      b = index(i + 1),
      c = index(i + 2);
    if (a !== b && b !== c && c !== a) {
      addEdge(a, b);
      addEdge(b, c);
      addEdge(c, a);
    }
  }
  const attributes = {positions: {size: 3, value: normalized}};
  return {
    surface: new LumaGeometry({
      topology: geometry.topology,
      vertexCount: count,
      indices,
      attributes
    }),
    edges: lines.length
      ? new LumaGeometry({topology: 'line-list', indices: new Uint32Array(lines), attributes})
      : null
  };
}

export default function Mesh(props) {
  const version = useRef({geometry: props.geometry, key: 0});
  if (version.current.geometry !== props.geometry) {
    version.current = {geometry: props.geometry, key: version.current.key + 1};
  }
  return <MeshRenderer key={version.current.key} {...props} />;
}

function MeshRenderer({geometry, wireframe}) {
  const canvas = useRef(null),
    controlsRef = useRef(null),
    wire = useRef(wireframe);
  const [error, setError] = useState(null);
  wire.current = wireframe;
  useEffect(() => {
    let disposed = false,
      device,
      surface,
      edges,
      controls,
      frame;
    setError(null);
    delete canvas.current.dataset.rendered;
    const initialize = async () => {
      const mesh = prepareMesh(geometry);
      device = await luma.createDevice({
        type: 'webgl',
        adapters: [webgl2Adapter],
        createCanvasContext: {
          canvas: canvas.current,
          useDevicePixels: Math.min(window.devicePixelRatio || 1, 2)
        }
      });
      if (disposed) {
        device.destroy();
        return;
      }
      const makeModel = (data, shaded) =>
        new Model(device, {
          vs,
          fs,
          modules: [viewer],
          geometry: data,
          parameters: {depthWriteEnabled: shaded, depthCompare: shaded ? 'less' : 'less-equal'}
        });
      surface = makeModel(mesh.surface, true);
      edges = mesh.edges && makeModel(mesh.edges, false);
      controls = new OrbitControls(canvas.current, {...camera, minDistance: 1.5, maxDistance: 12});
      controlsRef.current = controls;
      let previous = '';
      const render = time => {
        controls.update(time);
        const context = device.getDefaultCanvasContext();
        const framebuffer = context.getCurrentFramebuffer();
        const [width, height] = context.getDrawingBufferSize();
        const eye = controls.getEyePosition();
        const key = [width, height, ...eye, wire.current].join(',');
        if (width && height && previous !== key) {
          const mvp = new Matrix4()
            .perspective({fovy: toRadians(45), aspect: width / height, near: 0.05, far: 50})
            .multiplyRight(new Matrix4().lookAt({eye}));
          surface.shaderInputs.setProps({
            viewer: {
              mvp,
              color: [0.22, 0.65, 0.85, geometry.topology.startsWith('triangle') ? 1 : 0]
            }
          });
          edges?.shaderInputs.setProps({viewer: {mvp, color: [0.85, 0.94, 1, 0]}});
          const pass = device.beginRenderPass({
            framebuffer,
            clearColor: [0.028, 0.071, 0.118, 1],
            clearDepth: 1
          });
          const surfaceDrawn = surface.draw(pass);
          const edgesDrawn = wire.current && edges ? edges.draw(pass) : true;
          pass.end();
          device.submit();
          canvas.current.dataset.camera = [controls.yaw, controls.pitch, controls.distance].join(
            ','
          );
          if (surfaceDrawn && edgesDrawn) {
            previous = key;
            canvas.current.dataset.rendered = 'true';
          }
        }
        frame = requestAnimationFrame(render);
      };
      frame = requestAnimationFrame(render);
    };
    initialize().catch(reason => {
      if (!disposed) setError(reason.message);
    });
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      controls?.destroy();
      controlsRef.current = null;
      surface?.destroy();
      edges?.destroy();
      device?.destroy();
    };
  }, [geometry]);
  return (
    <div className="geometry-canvas">
      <canvas
        ref={canvas}
        tabIndex="0"
        aria-label="Orbit camera around geometry"
        onKeyDown={event => {
          const controls = controlsRef.current;
          if (!controls) return;
          const moves = {
            ArrowLeft: [-0.1, 0],
            ArrowRight: [0.1, 0],
            ArrowUp: [0, 0.1],
            ArrowDown: [0, -0.1]
          };
          if (moves[event.key]) {
            event.preventDefault();
            const [yaw, pitch] = moves[event.key];
            controls.setProps({yaw: controls.yaw + yaw, pitch: controls.pitch + pitch});
          } else if (event.key === '+' || event.key === '-') {
            event.preventDefault();
            controls.setProps({distance: controls.distance * (event.key === '+' ? 0.9 : 1.1)});
          }
        }}
      />
      <button
        type="button"
        className="geometry-reset"
        onClick={() => {
          controlsRef.current?.setProps(camera);
          controlsRef.current?.reset();
        }}
      >
        Reset camera
      </button>
      {error && (
        <p className="geometry-error" role="alert">
          Unable to render geometry: {error}
        </p>
      )}
    </div>
  );
}
