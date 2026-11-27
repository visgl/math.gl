// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// Spherical Lambert azimuthal equal-area formula (unit radius).

export function geoAzimuthalEqualAreaRaw(x, y) {
  const cy = Math.cos(y),
    k = Math.sqrt(2 / (1 + Math.cos(x) * cy));
  return [k * cy * Math.sin(x), k * Math.sin(y)];
}
geoAzimuthalEqualAreaRaw.invert = (x, y) => {
  const r = Math.hypot(x, y),
    c = 2 * Math.asin(Math.min(1, r / 2));
  return [Math.atan2(x * Math.sin(c), r * Math.cos(c)), Math.asin(r ? (y * Math.sin(c)) / r : 0)];
};

export function geoAzimuthalEquidistantRaw(lambda, phi) {
  const c = Math.acos(Math.max(-1, Math.min(1, Math.cos(lambda) * Math.cos(phi)))),
    k = c ? c / Math.sin(c) : 1;
  return [k * Math.cos(phi) * Math.sin(lambda), k * Math.sin(phi)];
}
geoAzimuthalEquidistantRaw.invert = (x, y) => {
  const c = Math.hypot(x, y),
    s = Math.sin(c);
  return [Math.atan2(x * s, c * Math.cos(c)), Math.asin(c ? (y * s) / c : 0)];
};
