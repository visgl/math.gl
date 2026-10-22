// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original orthographic equations using an ellipsoid surface and parallel ray intersection. Independently qualified against native PROJ. Independent corrections acknowledge PROJ 9.5.1 src/projections/ortho.cpp and OSGeo/PROJ #2361, #2844 and #2855; see ../../../../projection/PROJ-LICENSE.txt.
import type {KernelParameters, Point} from '../kernel';
import adjust_lon from '../common/adjust_lon';

export type State = KernelParameters & {sin0: number; cos0: number; originY: number};

export function createState(base: KernelParameters): State {
  const sin0 = Math.sin(base.lat0);
  const cos0 = Math.cos(base.lat0);
  const nu0 = 1 / Math.sqrt(1 - base.es * sin0 * sin0);
  return {...base, sin0, cos0, originY: -base.es * nu0 * sin0 * cos0};
}

export function forward(s: State, p: Point): Point {
  const longitude = adjust_lon(p.x - s.long0, s.over);
  const sin = Math.sin(p.y);
  const cos = Math.cos(p.y);
  const nu = 1 / Math.sqrt(1 - s.es * sin * sin);
  p.x = s.x0 + s.a * s.k0 * nu * cos * Math.sin(longitude);
  p.y =
    s.y0 +
    s.a *
      s.k0 *
      (nu * ((1 - s.es) * sin * s.cos0 - cos * Math.cos(longitude) * s.sin0) - s.originY);
  return p;
}

export function inverse(s: State, p: Point): Point {
  // In the meridian frame, E=(0,1,0), N=(-sin0,0,cos0),
  // V=(cos0,0,sin0). Intersect x E + y N + t V with the ellipsoid.
  const x = (p.x - s.x0) / (s.a * s.k0);
  const y = (p.y - s.y0) / (s.a * s.k0) + s.originY;
  const q = 1 - s.es;
  const a = s.cos0 * s.cos0 + (s.sin0 * s.sin0) / q;
  const b = (y * s.sin0 * s.cos0 * s.es) / q;
  const c = x * x + y * y * (s.sin0 * s.sin0 + (s.cos0 * s.cos0) / q) - 1;
  const discriminant = b * b - a * c;
  // The positive root selects the visible intersection. A few ulps of
  // discriminant roundoff are possible exactly on the projected limb.
  if (discriminant < -32 * Number.EPSILON * a) {
    throw new Error('Coordinate is outside the orthographic ellipse');
  }
  const t = (-b + Math.sqrt(Math.max(0, discriminant))) / a;
  const radial = t * s.cos0 - y * s.sin0;
  const z = t * s.sin0 + y * s.cos0;
  p.x = adjust_lon(s.long0 + Math.atan2(x, radial), s.over);
  p.y = Math.atan2(z, q * Math.hypot(radial, x));
  return p;
}
