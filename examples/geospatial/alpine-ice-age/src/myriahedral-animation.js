// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {Quaternion} from '@math.gl/core';

const sub = (a, b) => a.map((v, i) => v - b[i]);
const mix = (a, b, t) => a + (b - a) * t;

/** Camera alignment uses the engine's root frame; panel transforms stay in the engine. */
export function prepareMyriahedralAnimation(map) {
  const {rootTransform: matrix, radius} = map.motion;
  const basis = [0, 1, 2].map(row => [matrix[row], matrix[row + 4], matrix[row + 8]]);
  const center = [matrix[12], matrix[13], matrix[14]].map(v => v * radius);
  return {map, basis, center};
}

/** At zero the panels meet on the oriented globe; at one they match the static map.
 * A short initial deflation fits spherical field samples onto their planar panels;
 * the remaining motion is the library's rigid hinge evaluation.
 */
export function myriahedralPose(animation, amount, {width, height, longitude, latitude}, fitted) {
  const {map, basis, center} = animation;
  const t = Math.max(0, Math.min(1, amount));
  const frame = map.evaluate({type: 'hinge', amount: Math.max(0, (t - 0.1) / 0.9)});
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
  return (position, regionId, lift = 0) => {
    let p = frame.projectPlacedPoint(position, regionId);
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
