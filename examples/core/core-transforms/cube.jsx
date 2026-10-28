// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, {useEffect, useRef} from 'react';
import {OrbitControls} from '@luma.gl/engine';
import {Matrix4, toRadians} from '@math.gl/core';

const INITIAL_CAMERA = {distance: 12, yaw: 0.5, pitch: 0.3};
const vertices = [
  [-1, -1, -1],
  [1, -1, -1],
  [1, 1, -1],
  [-1, 1, -1],
  [-1, -1, 1],
  [1, -1, 1],
  [1, 1, 1],
  [-1, 1, 1]
];
const edges = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 0],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 4],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7]
];

/** Camera controls change the view matrix without changing the displayed model matrix. */
export default function Cube({matrix}) {
  const canvas = useRef(null),
    orbit = useRef(null),
    model = useRef(matrix);
  model.current = matrix;
  useEffect(() => {
    const element = canvas.current,
      context = element.getContext('2d');
    const controls = new OrbitControls(element, {
      ...INITIAL_CAMERA,
      minDistance: 8,
      maxDistance: 30
    });
    orbit.current = controls;
    let width = 1,
      height = 1,
      frame,
      previous = '';
    const resize = new ResizeObserver(([entry]) => {
      width = entry.contentRect.width;
      height = entry.contentRect.height;
      previous = '';
    });
    resize.observe(element);
    const render = (time) => {
      controls.update(time);
      const eye = controls.getEyePosition();
      const key = [width, height, ...eye, ...model.current].join(',');
      if (key !== previous && width > 0 && height > 0) {
        previous = key;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        if (
          element.width !== Math.round(width * dpr) ||
          element.height !== Math.round(height * dpr)
        ) {
          element.width = Math.round(width * dpr);
          element.height = Math.round(height * dpr);
        }
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        context.clearRect(0, 0, width, height);
        const view = new Matrix4().lookAt({eye});
        const projection = new Matrix4()
          .perspective({fovy: toRadians(45), aspect: width / height, near: 0.1, far: 100})
          .multiplyRight(view);
        const project = (p) => {
          if (view.transformAsPoint(p)[2] >= -0.1) return null;
          const q = projection.transformAsPoint(p);
          return [((q[0] + 1) * width) / 2, ((1 - q[1]) * height) / 2];
        };
        const line = (a, b, color, dashed = false) => {
          const p = project(a),
            q = project(b);
          if (!p || !q) return;
          context.beginPath();
          context.strokeStyle = color;
          context.lineWidth = dashed ? 1 : 2;
          context.setLineDash(dashed ? [5, 5] : []);
          context.moveTo(...p);
          context.lineTo(...q);
          context.stroke();
        };
        [
          [4, 0, 0],
          [0, 4, 0],
          [0, 0, 4]
        ].forEach((axis, i) => {
          line([0, 0, 0], axis, ['#ff8585', '#8ee6ae', '#70c7ff'][i]);
          const p = project(axis);
          if (p) {
            context.fillStyle = '#fff';
            context.font = '14px system-ui';
            context.fillText('XYZ'[i], p[0] + 5, p[1]);
          }
        });
        edges.forEach(([a, b]) => line(vertices[a], vertices[b], '#698098', true));
        const transformed = vertices.map((p) => model.current.transformAsPoint(p));
        edges.forEach(([a, b]) => line(transformed[a], transformed[b], '#ffd875'));
        transformed.forEach((p) => {
          const q = project(p);
          if (q) {
            context.beginPath();
            context.fillStyle = '#fff';
            context.arc(...q, 3, 0, Math.PI * 2);
            context.fill();
          }
        });
        element.dataset.camera = [controls.yaw, controls.pitch, controls.distance].join(',');
      }
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      controls.destroy();
      orbit.current = null;
    };
  }, []);
  return (
    <div className="core-camera-view">
      <canvas
        ref={canvas}
        tabIndex="0"
        aria-label="Orbit camera around the transformed cube"
        onKeyDown={(event) => {
          const controls = orbit.current;
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
        className="camera-reset"
        onClick={() => {
          orbit.current?.setProps(INITIAL_CAMERA);
          orbit.current?.reset();
        }}
      >
        Reset camera
      </button>
    </div>
  );
}
