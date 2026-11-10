// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {CapMap} from './cap-map';
import {createKernelMap} from './world-map';
import {sphericalRotation} from './rotated-map';
import {hammerRetroazimuthalRaw} from './world-kernels/hammerRetroazimuthal.js';
import {geographic, coordinates, RAD, type Position} from './math';
import type {WorldKernel} from './world-kernels';
export function createHammerRetroazimuthalMap({radius = 1, parallel = 45} = {}) {
  if (!Number.isFinite(parallel) || Math.abs(parallel) >= 90)
    throw new Error('Expected parallel strictly between -90 and 90');
  const rotation = sphericalRotation([0, -parallel]),
    raw = hammerRetroazimuthalRaw(parallel * RAD),
    cap = 179.999 * RAD;
  const kernel: WorldKernel = (lambda, phi) => {
    let q = rotation.local([lambda / RAD, phi / RAD]);
    const [x, y, z] = geographic(q),
      theta = Math.acos(Math.max(-1, Math.min(1, x)));
    let taper = 1;
    if (theta > cap) {
      const n = Math.hypot(y, z);
      if (n < 1e-14) return [0, 0];
      q = coordinates([Math.cos(cap), (Math.sin(cap) * y) / n, (Math.sin(cap) * z) / n]);
      taper = (Math.PI - theta) / (Math.PI - cap);
    }
    const p = raw(q[0] * RAD, q[1] * RAD);
    return [p[0] * taper, p[1] * taper];
  };
  kernel.invert = (x, y) => {
    const q = raw.invert(x, y);
    if (!q?.every(Number.isFinite)) return null;
    const source = rotation.source([q[0] / RAD, q[1] / RAD]);
    if (x) source[0] = Math.sign(x) * Math.abs(source[0]);
    return source.map(v => v * RAD);
  };
  const base = createKernelMap({kernel, radius});
  const regions = base.regions.map(r => ({
    ...r,
    project: (p: readonly number[]): Position => {
      let lon = p[0];
      if (Math.abs(Math.abs(lon) - 90) < 1e-9)
        lon = Math.sign(lon) * (90 + (Math.abs(r.interior[0]) > 90 ? 1e-10 : -1e-10));
      return kernel(lon * RAD, p[1] * RAD) as Position;
    },
    unproject: (p: readonly number[]): Position | null => {
      const q = kernel.invert!(p[0], p[1]);
      return q?.every(Number.isFinite) ? [q[0] / RAD, q[1] / RAD] : null;
    }
  }));
  return new CapMap(regions, rotation.local, rotation.source, cap, radius);
}
