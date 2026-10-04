// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {Matrix4, Vector3, toRadians} from '@math.gl/core';
import {
  BoundingSphere,
  AxisAlignedBoundingBox,
  OrientedBoundingBox,
  CullingVolume,
  Plane
} from '@math.gl/culling';
import {Geometry, BoxGeometry, SphereGeometry} from '@math.gl/geometry';

export const initial = {
  type: 'sphere',
  x: 0,
  y: 0,
  z: 0,
  size: 0.55,
  angle: 25,
  fov: 52,
  hideOutside: false
};
export const colors = {
  inside: [0.25, 0.85, 0.55],
  intersecting: [1, 0.72, 0.2],
  outside: [0.95, 0.3, 0.35]
};
const eye = [0, 0, 3],
  near = 0.7,
  far = 6,
  aspect = 1.3;

/** Inward-facing planes and matching corners for a camera looking down -Z. */
export function makeFrustum(fov) {
  const sy = Math.tan(toRadians(fov) / 2),
    sx = sy * aspect;
  const plane = (point, normal) => new Plane().fromPointNormal(point, normal);
  const volume = new CullingVolume([
    plane(eye, [1, 0, -sx]),
    plane(eye, [-1, 0, -sx]),
    plane(eye, [0, 1, -sy]),
    plane(eye, [0, -1, -sy]),
    plane([0, 0, eye[2] - near], [0, 0, -1]),
    plane([0, 0, eye[2] - far], [0, 0, 1])
  ]);
  const corners = [near, far].flatMap(depth =>
    [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1]
    ].map(([x, y]) => [x * depth * sx, y * depth * sy, eye[2] - depth])
  );
  return {volume, corners};
}

export function makeScene(state) {
  const {volume, corners} = makeFrustum(state.fov);
  const center = [state.x, state.y, state.z],
    r = state.size;
  const angle = toRadians(state.angle);
  const transform = new Matrix4().translate(center);
  let bounds, mesh;
  if (state.type === 'sphere') {
    bounds = new BoundingSphere(center, r);
    mesh = new SphereGeometry({radius: r, nlat: 12, nlong: 20});
  } else {
    mesh = new BoxGeometry({size: [2 * r, r, 1.5 * r]});
    if (state.type === 'obb') {
      transform.rotateY(angle);
      const c = Math.cos(angle),
        s = Math.sin(angle);
      bounds = new OrientedBoundingBox(center, [
        c * r,
        0,
        -s * r,
        0,
        r / 2,
        0,
        s * r * 0.75,
        0,
        c * r * 0.75
      ]);
    } else {
      bounds = new AxisAlignedBoundingBox(
        center.map((v, i) => v - [r, r / 2, r * 0.75][i]),
        center.map((v, i) => v + [r, r / 2, r * 0.75][i])
      );
    }
  }
  const result = volume.computeVisibility(bounds);
  const planeResults = volume.planes.map(plane => bounds.intersectPlane(plane));
  const positions = [],
    colorValues = [];
  const append = (geometry, matrix, color) => {
    const data = geometry.attributes.POSITION.value;
    const indices = geometry.indices?.value;
    for (let i = 0; i < geometry.vertexCount; i++) {
      const offset = (indices ? indices[i] : i) * 3;
      positions.push(...matrix.transformAsPoint(data.subarray(offset, offset + 3)));
      colorValues.push(...color);
    }
  };
  const beam = (a, b, color) => {
    const direction = new Vector3(b).subtract(a),
      length = direction.len();
    const z = direction.normalize();
    const x = new Vector3(Math.abs(z[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]).cross(z).normalize();
    const y = z.clone().cross(x);
    const mid = new Vector3(a).add(b).scale(0.5);
    const matrix = new Matrix4([
      x[0],
      x[1],
      x[2],
      0,
      y[0],
      y[1],
      y[2],
      0,
      z[0],
      z[1],
      z[2],
      0,
      ...mid,
      1
    ]);
    append(new BoxGeometry({size: [0.025, 0.025, length]}), matrix, color);
  };
  for (const [a, b] of [
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
  ])
    beam(corners[a], corners[b], [0.55, 0.75, 1]);
  append(new SphereGeometry({radius: 0.09}), new Matrix4().translate(eye), [0.9, 0.95, 1]);
  const counts = {inside: 0, intersecting: 0, outside: 0};
  for (const x of [-3, -1.6, 1.6, 3])
    for (const y of [-1.2, 1.2]) {
      const point = [x, y, 0],
        sphere = new BoundingSphere(point, 0.35);
      const visibility = volume.computeVisibility(sphere);
      counts[visibility]++;
      if (!state.hideOutside || visibility !== 'outside')
        append(
          new SphereGeometry({radius: 0.35, nlat: 8, nlong: 12}),
          new Matrix4().translate(point),
          colors[visibility]
        );
    }
  counts[result]++;
  if (!state.hideOutside || result !== 'outside') append(mesh, transform, colors[result]);
  // Undrawn anchor vertices keep the observer's scale stable while controls move the object.
  const vertexCount = positions.length / 3;
  positions.push(-5.5, -4.5, -5, 5.5, 4.5, 5);
  colorValues.push(1, 1, 1, 1, 1, 1);
  return {
    result,
    planeResults,
    counts,
    geometry: new Geometry({
      topology: 'triangle-list',
      vertexCount,
      attributes: {
        POSITION: {size: 3, value: new Float32Array(positions)},
        COLOR_0: {size: 3, value: new Float32Array(colorValues)}
      }
    })
  };
}
