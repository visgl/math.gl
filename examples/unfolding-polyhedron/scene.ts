// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {Matrix4} from '@math.gl/core';
import type {Polyhedron} from './polyhedra';
import {createRenderer} from './renderer';

type MotionLayout = {mesh: Polyhedron; evaluate(amount: number): number[][][]};
export type UnfoldingViewState = {
  unfolding: number;
  yaw: number;
  pitch: number;
  rotationZ: number;
  earth: boolean;
  edges: boolean;
  land: boolean;
};

/** Pose, camera framing and drawing. No control selectors or event handlers. */
export function createUnfoldingScene(
  canvas: HTMLCanvasElement,
  options: {
    stableFraming?: boolean;
    landTexture?: HTMLCanvasElement;
    onImageryStatus: (message: string) => void;
  }
) {
  const renderer = createRenderer(canvas, options.onImageryStatus, options.landTexture);
  let framingKey = '';
  let framingLayout: MotionLayout | undefined;
  let framingPoses: ReturnType<MotionLayout['evaluate']>[] = [];
  let framingBounds = [0, 0, 0, 0];
  return {
    get ready() {
      return renderer.ready;
    },
    draw(layout: MotionLayout, hinges: Set<string>, state: UnfoldingViewState) {
      const {width, height} = canvas.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio, 2);
      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }
      const view = new Matrix4().rotateX(state.pitch).rotateY(state.yaw).rotateZ(state.rotationZ);
      const faces = layout
        .evaluate(state.unfolding)
        .map(face => face.map(p => Array.from(view.transformAsPoint(p))));
      let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity;
      for (const face of faces)
        for (const p of face) {
          minX = Math.min(minX, p[0]);
          maxX = Math.max(maxX, p[0]);
          minY = Math.min(minY, p[1]);
          maxY = Math.max(maxY, p[1]);
        }
      if (options.stableFraming) {
        // Keep the camera stationary while the hinges move. Fit sampled poses
        // once per layout/orbit, rather than recentering every animation frame.
        if (framingLayout !== layout) {
          framingLayout = layout;
          framingPoses = [0, 0.25, 0.5, 0.75, 1].map(amount => layout.evaluate(amount));
          framingKey = '';
        }
        const key = [state.yaw, state.pitch, state.rotationZ].join(':');
        if (key !== framingKey) {
          framingKey = key;
          const bounds = [Infinity, -Infinity, Infinity, -Infinity];
          for (const pose of framingPoses)
            for (const face of pose)
              for (const point of face) {
                const p = view.transformAsPoint(point);
                bounds[0] = Math.min(bounds[0], p[0]);
                bounds[1] = Math.max(bounds[1], p[0]);
                bounds[2] = Math.min(bounds[2], p[1]);
                bounds[3] = Math.max(bounds[3], p[1]);
              }
          framingBounds = bounds;
        }
        [minX, maxX, minY, maxY] = framingBounds;
      }
      const scale = Math.min(
        (width - 50) / Math.max(maxX - minX, 2.5),
        (height - 40) / Math.max(maxY - minY, 2.5)
      );
      const depth = Math.max(1, ...faces.flatMap(face => face.map(p => Math.abs(p[2]))));
      const positions = faces.map(face =>
        face.map(p => [
          (2 * (p[0] - (minX + maxX) / 2) * scale) / width,
          (2 * (p[1] - (minY + maxY) / 2) * scale) / height,
          -p[2] / (depth + 1)
        ])
      );
      renderer.draw(layout.mesh, positions, hinges, state.earth, state.edges, state.land);
      return positions;
    },
    dispose() {
      renderer.dispose();
    }
  };
}
