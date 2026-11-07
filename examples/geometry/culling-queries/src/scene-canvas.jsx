// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import React, {useEffect, useRef} from 'react';
import {Matrix4, toRadians} from '@math.gl/core';
import {OrbitControls} from '@luma.gl/engine';

/** Lightweight CPU perspective view for math examples. */
export default function SceneCanvas({scene}) {
  const canvas = useRef(null),
    current = useRef(scene);
  current.current = scene;
  useEffect(() => {
    const element = canvas.current,
      ctx = element.getContext('2d');
    const orbit = new OrbitControls(element, {
      distance: 18,
      yaw: 0.6,
      pitch: 0.35,
      minDistance: 12,
      maxDistance: 40
    });
    let width = 1,
      height = 1,
      frame,
      lastKey = '',
      lastScene;
    const resize = new ResizeObserver(([entry]) => {
      width = entry.contentRect.width;
      height = entry.contentRect.height;
    });
    resize.observe(element);
    const render = time => {
      orbit.update(time);
      const eye = orbit.getEyePosition();
      const key = [width, height, ...eye].join(',');
      if (width > 0 && height > 0 && (key !== lastKey || current.current !== lastScene)) {
        lastKey = key;
        lastScene = current.current;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        element.width = Math.round(width * dpr);
        element.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.fillStyle = '#071321';
        ctx.fillRect(0, 0, width, height);
        const view = new Matrix4().lookAt({eye});
        const projection = new Matrix4()
          .perspective({fovy: toRadians(45), aspect: width / height, near: 0.1, far: 100})
          .multiplyRight(view);
        const project = p => {
          const q = projection.transformAsPoint(p);
          return [((q[0] + 1) * width) / 2, ((1 - q[1]) * height) / 2];
        };
        const line = (a, b, color, width = 1) => {
          const p = project(a),
            q = project(b);
          ctx.beginPath();
          ctx.moveTo(...p);
          ctx.lineTo(...q);
          ctx.strokeStyle = color;
          ctx.lineWidth = width;
          ctx.stroke();
        };
        for (let i = -5; i <= 5; i++) {
          line([i, -3, -5], [i, -3, 5], '#1c3044');
          line([-5, -3, i], [5, -3, i], '#1c3044');
        }
        for (const triangle of lastScene.triangles || []) {
          const vertices = triangle.vertices.map(project);
          ctx.beginPath();
          ctx.moveTo(...vertices[0]);
          ctx.lineTo(...vertices[1]);
          ctx.lineTo(...vertices[2]);
          ctx.closePath();
          ctx.fillStyle = triangle.color || '#48cbff30';
          ctx.fill();
          ctx.strokeStyle = '#70c7ff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
        for (const segment of lastScene.segments || [])
          line(segment.a, segment.b, segment.color || '#5de8fa', segment.width || 2);
        for (const point of lastScene.points || []) {
          const p = project(point.position);
          ctx.beginPath();
          ctx.arc(...p, point.radius || 5, 0, Math.PI * 2);
          ctx.fillStyle = point.color || '#ffc66f';
          ctx.fill();
        }
      }
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      orbit.destroy();
    };
  }, []);
  return (
    <canvas
      ref={canvas}
      aria-label="3D query scene. Drag to orbit; scroll to zoom."
      style={{position: 'absolute', inset: 0, width: '100%', height: '100%', touchAction: 'none'}}
    />
  );
}
