// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {Quaternion} from '@math.gl/core';

const sub = (a, b) => a.map((v, i) => v - b[i]);
const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0]
];
const unit = a => a.map(v => v / Math.hypot(...a));
const mix = (a, b, t) => a + (b - a) * t;

/** One affine coordinate frame per panel, shared by terrain and graticules. */
export function prepareMyriahedralAnimation(map) {
  const layout = map.layout;
  const flat = layout.evaluate(1);
  const frames = flat.map(p => {
    const a = sub(p[1], p[0]),
      b = sub(p[2], p[0]);
    return {origin: p[0], a, b, determinant: a[0] * b[1] - a[1] * b[0]};
  });
  const root = layout.mesh.faces[0].map(i => layout.mesh.vertices[i]);
  const x = unit(sub(root[1], root[0]));
  const z = unit(cross(x, sub(root[2], root[0]))),
    y = cross(z, x);
  const origin = root[0].map((_, k) => root.reduce((s, p) => s + p[k], 0) / root.length);
  const center = [x, y, z].map(axis => -dot(axis, origin));
  return {layout, frames, basis: [x, y, z], center};
}

/** At zero the panels meet on the oriented globe; at one they match the static map.
 * A short initial deflation fits spherical field samples onto their planar panels;
 * the remaining motion is the library's rigid hinge evaluation.
 */
export function myriahedralPose(animation, amount, {width, height, longitude, latitude}, fitted) {
  const {layout, frames, basis, center} = animation;
  const t = Math.max(0, Math.min(1, amount));
  const panels = layout.evaluate(Math.max(0, (t - 0.1) / 0.9));
  const rad = Math.PI / 180,
    lon = longitude * rad,
    lat = latitude * rad;
  const camera = ([x, y, z]) => {
    const east = -Math.sin(lon) * x + Math.cos(lon) * y;
    const front = Math.cos(lon) * x + Math.sin(lon) * y;
    return [
      east,
      z * Math.cos(lat) - front * Math.sin(lat),
      z * Math.sin(lat) + front * Math.cos(lat)
    ];
  };
  const rotation = new Quaternion().fromMatrix3(basis.flatMap(camera)).slerp([0, 0, 0, 1], t);
  // Quaternion rotation applied to the basis only; vertex work remains scalar.
  const rotate = ([x, y, z]) => {
    const [qx, qy, qz, qw] = rotation;
    const tx = 2 * (qy * z - qz * y),
      ty = 2 * (qz * x - qx * z),
      tz = 2 * (qx * y - qy * x);
    return [
      x + qw * tx + qy * tz - qz * ty,
      y + qw * ty + qz * tx - qx * tz,
      z + qw * tz + qx * ty - qy * tx
    ];
  };
  const zero = fitted.project([0, 0]);
  const scale = mix(Math.min(width, height) * 0.42, fitted.scale, t);
  const offset = [mix(-center[0], 0, t), mix(-center[1], 0, t), mix(-center[2], 0, t)];
  const transforms = panels.map((p, i) => {
    const f = frames[i],
      a = sub(p[1], p[0]),
      b = sub(p[2], p[0]);
    const u = a.map((v, k) => (v * f.b[1] - b[k] * f.a[1]) / f.determinant);
    const v = a.map((value, k) => (b[k] * f.a[0] - value * f.b[0]) / f.determinant);
    return {origin: p[0], u, v, flat: f.origin};
  });
  return (position, regionId, lift = 0) => {
    const f = transforms[Number(regionId.slice(6))];
    let p = f.origin.map(
      (v, k) => v + f.u[k] * (position[0] - f.flat[0]) + f.v[k] * (position[1] - f.flat[1])
    );
    if (t < 0.1) {
      const d = sub(p, center),
        length = Math.hypot(...d);
      p = p.map((v, k) => v + d[k] * (1 / length - 1) * (1 - t / 0.1));
    }
    p = rotate(p.map((v, k) => v + offset[k]));
    return [
      p[0] * scale + (zero[0] - width / 2) * t,
      p[1] * scale + (height / 2 - zero[1]) * t,
      p[2] * scale + lift
    ];
  };
}
