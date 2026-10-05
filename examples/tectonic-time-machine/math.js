// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Original spherical interpolation and scenario math; no upstream implementation source.
const DEG = Math.PI / 180;
export const IDENTITY = [1, 0, 0, 0];
export function unitVector(lon, lat, out = new Float64Array(3)) {
  const phi = lat * DEG,
    lambda = lon * DEG,
    c = Math.cos(phi);
  out[0] = c * Math.cos(lambda);
  out[1] = c * Math.sin(lambda);
  out[2] = Math.sin(phi);
  return out;
}
export function slerp(a, b, t, out) {
  let dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  const sign = dot < 0 ? -1 : 1;
  dot = Math.min(1, Math.abs(dot));
  let left = 1 - t,
    right = t;
  if (dot < 0.9995) {
    const angle = Math.acos(dot),
      sine = Math.sin(angle);
    left = Math.sin((1 - t) * angle) / sine;
    right = Math.sin(t * angle) / sine;
  }
  let length = 0;
  for (let i = 0; i < 4; i++) {
    out[i] = left * a[i] + right * sign * b[i];
    length += out[i] * out[i];
  }
  length = Math.sqrt(length);
  for (let i = 0; i < 4; i++) out[i] /= length;
  return out;
}
export function rotationBetween(from, to) {
  const a = unitVector(...from),
    b = unitVector(...to);
  const dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const q = [
    1 + dot,
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
  if (dot < -0.999999) {
    const axis = Math.abs(a[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
    q[0] = 0;
    q[1] = a[1] * axis[2] - a[2] * axis[1];
    q[2] = a[2] * axis[0] - a[0] * axis[2];
    q[3] = a[0] * axis[1] - a[1] * axis[0];
  }
  const n = Math.hypot(...q);
  return q.map(x => x / n);
}
/** Scalar kernel writes lon/lat into caller storage; quaternions use the service's w,x,y,z order. */
export function rotateToLonLat(q, xyz, offset, out, target) {
  const x = xyz[offset],
    y = xyz[offset + 1],
    z = xyz[offset + 2];
  const tx = 2 * (q[2] * z - q[3] * y),
    ty = 2 * (q[3] * x - q[1] * z),
    tz = 2 * (q[1] * y - q[2] * x);
  const rx = x + q[0] * tx + q[2] * tz - q[3] * ty;
  const ry = y + q[0] * ty + q[3] * tx - q[1] * tz;
  const rz = z + q[0] * tz + q[1] * ty - q[2] * tx;
  out[target] = Math.atan2(ry, rx) / DEG;
  out[target + 1] = Math.atan2(rz, Math.hypot(rx, ry)) / DEG;
}
export function historicalRotation(table, pid, age, out) {
  const low = Math.floor(age / 10) * 10,
    high = Math.min(500, low + 10);
  const a = table[String(low)]?.[pid],
    b = table[String(high)]?.[pid];
  if (!a || !b) return false;
  // GWS returns identity for absent reconstruction-tree IDs. Do not depict those as measured stationary blocks.
  if (age > 0 && pid !== 0 && ((low > 0 && isIdentity(a)) || (high > 0 && isIdentity(b))))
    return false;
  slerp(a, b, (age - low) / 10, out);
  return true;
}
function isIdentity(q) {
  return Math.abs(q[0]) > 0.999999999 && Math.hypot(q[1], q[2], q[3]) < 1e-10;
}
export const REGIONS = {
  'North America': {
    center: [-100, 45],
    atlantic: [-25, 35],
    polar: [-100, 65],
    color: [237, 164, 101]
  },
  'South America': {
    center: [-60, -20],
    atlantic: [-15, -25],
    polar: [-65, 35],
    color: [230, 115, 115]
  },
  Africa: {center: [20, 0], atlantic: [20, 0], polar: [5, 40], color: [230, 198, 108]},
  Europe: {center: [20, 52], atlantic: [25, 55], polar: [35, 65], color: [117, 203, 172]},
  Asia: {center: [105, 40], atlantic: [65, 35], polar: [110, 65], color: [110, 175, 222]},
  India: {center: [80, 20], atlantic: [48, 10], polar: [65, 40], color: [174, 156, 222]},
  Australia: {center: [135, -25], atlantic: [55, -25], polar: [150, 40], color: [219, 152, 195]},
  Antarctica: {center: [0, -90], atlantic: [20, -65], polar: [-170, 30], color: [166, 193, 211]}
};
export function regionFor(lon, lat) {
  if (lat < -55) return 'Antarctica';
  if (lon < -30) return lat > 12 ? 'North America' : 'South America';
  if (lon > 100 && lat < -10) return 'Australia';
  if (lon > 55 && lon < 100 && lat > 0 && lat < 32) return 'India';
  if (lon > -25 && lon < 55 && lat < 36) return 'Africa';
  return lon < 55 ? 'Europe' : 'Asia';
}
export function futureRotations(scenario) {
  return Object.fromEntries(
    Object.entries(REGIONS).map(([name, r]) => [name, rotationBetween(r.center, r[scenario])])
  );
}
export function futureRotation(target, years, out) {
  const t = Math.max(0, Math.min(1, years / 250));
  return slerp(IDENTITY, target, t * t * (3 - 2 * t), out);
}
export function timeLabel(time) {
  return time < 0
    ? `${Math.abs(time).toFixed(0)} Ma ago`
    : time > 0
      ? `+${time.toFixed(0)} million years`
      : 'Present day';
}
