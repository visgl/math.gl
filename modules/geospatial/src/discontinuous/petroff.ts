// math.gl
// SPDX-License-Identifier: MIT AND CC0-1.0
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileCopyrightText: 2020 Matthew A. Petroff
// SPDX-FileComment: Adapted from new_projection.py, Zenodo 4661351 (CC0). See PETROFF-LICENSE.txt. Scalar TypeScript, boundary limits, and MapEngine chart assembly added by math.gl.

import {DiscontinuousMap, type MapRegion} from './map-layout';
import {RAD, geographic, coordinates, add, unit, angle, type Position} from './math';
import type {QuincuncialMapOptions} from './quincuncial-star';
const PI = Math.PI,
  HALF = PI / 2;
const clamp = (x: number) => Math.max(-1, Math.min(1, x));
const acos = (x: number) => Math.acos(clamp(x));
const asin = (x: number) => Math.asin(clamp(x));
const sqrt = (x: number) => Math.sqrt(Math.max(0, x));
const phi0 = (3 * PI) / 8,
  s0 = Math.sin(phi0),
  c0 = Math.cos(phi0);
const psi0 = asin(1 / Math.sqrt(2 - c0 * c0)),
  psi1 = PI - 2 * psi0;
const f0 = asin((2 * s0) / Math.sqrt(3 - Math.cos(2 * phi0)));
const h = (12 / PI) * (psi0 + f0 - HALF);
const xi = Math.atan(
  (PI * (h - 3) ** 2) / (Math.sqrt(3) * (PI * (h * h - 2 * h + 45) - 96 * psi0 - 48 * f0))
);
const psi0p = Math.atan(Math.sqrt(3) / h),
  psi1p = (7 * PI) / 6 - psi0p - xi,
  psi2p = xi - PI / 6;
const wrap = (x: number) => ((((x + PI) % (2 * PI)) + 2 * PI) % (2 * PI)) - PI;
function section(theta: number, planar = false) {
  const index =
    theta <= (planar ? psi0p : psi0) ? 0 : theta <= (planar ? psi0p + psi1p : psi0 + psi1) ? 1 : 2;
  return {
    index,
    c: index < 2 ? acos(c0 / Math.SQRT2) : HALF - phi0,
    G: index === 1 ? psi1 : psi0,
    Gp: [psi0p, psi1p, psi2p][index],
    F: [f0, HALF - f0, PI / 4][index],
    ap:
      index === 0
        ? h
        : (Math.sqrt(h * h + 3) * Math.sin(PI / 3 - Math.atan(h / Math.sqrt(3)))) / Math.sin(xi),
    cp: index < 2 ? Math.sqrt(h * h + 3) : 3 - h,
    b: [
      PI / 4,
      Math.atan(Math.SQRT2 * Math.tan(phi0)),
      HALF - Math.atan(Math.SQRT2 * Math.tan(phi0))
    ][index]
  };
}
/** Published polar quincuncial aspect; local longitude is measured from a quadrant's center. */
export function petroffForward(
  lambda: number,
  phi: number,
  quadrant: number,
  south: boolean
): Position {
  const zeta = PI / 4 + quadrant * HALF;
  const finish = (xc: number, yc: number): Position => {
    const yh = (south ? -yc : yc) - 3;
    return [
      (xc * Math.cos(zeta) - (yh * Math.sin(zeta)) / Math.sqrt(3)) / Math.sqrt(6),
      (xc * Math.sin(zeta) + (yh * Math.cos(zeta)) / Math.sqrt(3)) / Math.sqrt(6)
    ];
  };
  if (Math.abs(phi) >= HALF - 1e-14) return finish(0, 3);
  const delta = wrap(lambda - zeta),
    latitude = Math.abs(phi);
  const theta = Math.abs(
    Math.atan2(
      Math.cos(latitude) * Math.sin(delta),
      s0 * Math.cos(latitude) * Math.cos(delta) - c0 * Math.sin(latitude)
    )
  );
  const point = geographic([Math.abs(delta) / RAD, latitude / RAD]);
  const r = angle(geographic([0, phi0 / RAD]), point);
  if (r < 1e-14) return finish(0, h);
  const {index, c, G, Gp, F, ap, cp} = section(theta);
  const beta = index === 0 ? psi0 - theta : index === 1 ? theta - psi0 : PI - theta;
  // Great-circle distance is well conditioned even at a section vertex.
  const vertex = geographic(index < 2 ? [45, 0] : [0, 90]);
  const x = angle(point, vertex);
  if (x < 1e-14) {
    // The section's vertex. Evaluate its known Cartesian limit.
    const tp = index === 0 ? Gp : index === 1 ? PI - psi2p - Gp : PI - psi2p + Gp;
    return finish(Math.sign(delta) * cp * Math.sin(tp), h - cp * Math.cos(tp));
  }
  const gamma = asin((Math.sin(beta) * Math.sin(r)) / Math.sin(x));
  const epsilon = acos(Math.sin(G) * Math.sin(gamma) * Math.cos(c) - Math.cos(G) * Math.cos(gamma));
  const up = (ap * (gamma + G + epsilon - PI)) / (F + G - HALF);
  const cosxy = sqrt(1 - ((Math.sin(G) * Math.sin(c)) / Math.sin(epsilon)) ** 2);
  const ratio = (Math.SQRT2 * Math.sin(x / 2)) / sqrt(1 - cosxy);
  const length = sqrt(up * up + cp * cp - 2 * up * cp * Math.cos(Gp));
  const sg = (up * Math.sin(Gp)) / length;
  const cg = (cp - up * Math.cos(Gp)) / length;
  const xp = length * ratio;
  const transverse = xp * sg,
    axial = cp - xp * cg;
  const rp = Math.hypot(transverse, axial);
  const alpha = Gp - Math.atan2(transverse, axial);
  let tp = index === 0 ? alpha : index === 1 ? PI - psi2p - alpha : PI - psi2p + alpha;
  if (Math.abs(delta) < 1e-14) tp = latitude < phi0 ? 0 : PI;
  return finish(Math.sign(delta) * rp * Math.sin(tp), h - rp * Math.cos(tp));
}
function inverse(x: number, y: number, quadrant: number, south: boolean): Position | null {
  const zeta = PI / 4 + quadrant * HALF;
  const xc = Math.sqrt(6) * (x * Math.cos(zeta) + y * Math.sin(zeta));
  const yc = 3 * Math.SQRT2 * (y * Math.cos(zeta) - x * Math.sin(zeta));
  const yh = south ? -6 - yc : yc;
  if (Math.abs(xc) < 1e-12 && Math.abs(yh) < 1e-12) return [zeta, south ? -HALF : HALF];
  const rp = Math.hypot(xc, h - 3 - yh);
  if (rp < 1e-12) return [zeta, south ? -phi0 : phi0];
  const tp = Math.abs(Math.atan2(xc, h - 3 - yh));
  const {index, c, G, Gp, F, ap, cp, b} = section(tp, true);
  const alpha = index === 0 ? tp : index === 1 ? PI - psi2p - tp : tp + psi2p - PI;
  const beta = Gp - alpha;
  const xp = sqrt(rp * rp + cp * cp - 2 * rp * cp * Math.cos(beta));
  const gp = xp > 1e-14 ? asin((rp * Math.sin(beta)) / xp) : 0;
  const ep = PI - Gp - gp;
  const yp = ep > 1e-14 ? (rp * Math.sin(alpha)) / Math.sin(ep) : 0;
  const up = sqrt(cp * cp + (xp + yp) ** 2 - 2 * cp * (xp + yp) * Math.cos(gp));
  const vp = ap - up;
  const angle = (vp * (F + G - HALF)) / ap;
  const delta = Math.atan(-Math.sin(angle) / (Math.cos(b) - Math.cos(angle)));
  const gamma = F - delta;
  const cosxy = 1 / Math.sqrt(1 + (Math.tan(b) / Math.cos(delta)) ** 2);
  const arc = acos(1 - (xp / (xp + yp)) ** 2 * (1 - cosxy));
  // atan2 retains the tiny tangent components near the section center;
  // acos(cos(r)) rounds to zero there and makes the old sine ratio 0/0.
  const transverse = Math.sin(arc) * Math.sin(gamma);
  const axial = Math.cos(arc) * Math.sin(c) - Math.sin(arc) * Math.cos(c) * Math.cos(gamma);
  const cosine = Math.cos(arc) * Math.cos(c) + Math.sin(arc) * Math.sin(c) * Math.cos(gamma);
  const r = Math.atan2(Math.hypot(transverse, axial), cosine);
  const bt = Math.atan2(transverse, axial);
  const az = index === 0 ? psi0 - bt : index === 1 ? psi0 + bt : PI - bt;
  const lat = asin(s0 * Math.cos(r) - c0 * Math.sin(r) * Math.cos(az));
  const lon =
    zeta +
    Math.sign(xc) * Math.atan2(Math.sin(az) * Math.sin(r) * c0, Math.cos(r) - s0 * Math.sin(lat));
  return [lon, south ? -lat : lat];
}

/** Petroff's 2021 equal-area square, north pole at center and south pole at corners. */
export function createPetroffMap(options: QuincuncialMapOptions = {}) {
  const {radius = 1, centralMeridian = 0} = options;
  if (!Number.isFinite(radius) || radius <= 0 || !Number.isFinite(centralMeridian))
    throw new Error('Expected positive finite radius and finite centralMeridian');
  const offset = wrap(centralMeridian * RAD);
  const rotate = ([lon, lat]: Position, direction: number): Position => [
    wrap(lon * RAD + offset * direction) / RAD,
    lat
  ];
  const charts: MapRegion[] = [];
  for (let quadrant = 0; quadrant < 4; quadrant++)
    for (const south of [false, true]) {
      const boundary: Position[] = [
        [quadrant * 90, 0],
        [(quadrant + 1) * 90, 0],
        [quadrant * 90 + 45, south ? -90 : 90]
      ];
      charts.push({
        id: `${south ? 'south' : 'north'}-${quadrant}`,
        boundary: boundary.map(p => rotate(p, 1)),
        interior: rotate(coordinates(unit(boundary.map(geographic).reduce(add, [0, 0, 0]))), 1),
        placement: [radius, 0, 0, radius, 0, 0],
        project: p => {
          const [lon, lat] = rotate([...p], -1);
          return petroffForward(lon * RAD, lat * RAD, quadrant, south);
        },
        unproject: p => {
          if (Math.abs(p[0]) > 1 + 1e-9 || Math.abs(p[1]) > 1 + 1e-9) return null;
          const q = inverse(p[0], p[1], quadrant, south);
          return q && q.every(Number.isFinite) ? rotate([q[0] / RAD, q[1] / RAD], 1) : null;
        }
      });
    }
  return new DiscontinuousMap(charts);
}
