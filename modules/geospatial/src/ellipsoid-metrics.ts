// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original quadrature-based implementation of revolution-ellipsoid integrals; independently compared with GeographicLib 2.7 (Charles Karney, MIT). See ../GEOGRAPHICLIB-LICENSE.txt.
import type {GeodesicParameters} from './ellipsoid-geodesic';

/** All latitude values are degrees, including isometric latitude (radians * 180/pi). */
export type AuxiliaryLatitude =
  | 'geocentric'
  | 'parametric'
  | 'rectifying'
  | 'authalic'
  | 'conformal'
  | 'isometric';

const DEG = Math.PI / 180;
// Positive half of the 16-point Gauss-Legendre rule.
const NODES = [
  0.09501250983763744, 0.2816035507792589, 0.4580167776572274, 0.6178762444026438,
  0.755404408355003, 0.8656312023878318, 0.9445750230732326, 0.9894009349916499
];
const WEIGHTS = [
  0.1894506104550685, 0.1826034150449236, 0.16915651939500254, 0.14959598881657673,
  0.12462897125553388, 0.09515851168249279, 0.06225352393864789, 0.027152459411754095
];
const KINDS: readonly string[] = [
  'geocentric',
  'parametric',
  'rectifying',
  'authalic',
  'conformal',
  'isometric'
];

/** Metrics on a revolution ellipsoid. Qualified for 0.5 <= b/a <= 2.
 * Axes use caller length units; areas/volumes use their square/cube.
 * Separate from Ellipsoid so Cartesian and projection users pay no bundle cost.
 */
export class EllipsoidMetrics {
  readonly semiMajorAxis: number;
  readonly semiMinorAxis: number;
  readonly surfaceArea: number;
  readonly volume: number;
  readonly quarterMeridian: number;
  private readonly ratio: number;
  private readonly e2: number;
  private readonly qPole: number;
  private readonly quarter: number;

  constructor({semiMajorAxis: a, semiMinorAxis: b}: GeodesicParameters) {
    const r = b / a;
    if (!(Number.isFinite(a) && Number.isFinite(b) && a > 0 && b > 0 && r >= 0.5 && r <= 2)) {
      throw new Error('Ellipsoid metrics require finite positive axes with 0.5 <= b/a <= 2');
    }
    this.semiMajorAxis = a;
    this.semiMinorAxis = b;
    this.ratio = r;
    this.e2 = (1 - r) * (1 + r);
    this.qPole = 1 + r * r * this.eccentricIntegral(1);
    this.quarter = integrate(t => this.meridianIntegrand(t), 0, Math.PI / 2);
    this.quarterMeridian = a * this.quarter;
    this.surfaceArea = 2 * Math.PI * a * a * this.qPole;
    this.volume = ((4 * Math.PI) / 3) * a * b * a;
    if (
      ![this.quarterMeridian, this.surfaceArea, this.volume].every(v => Number.isFinite(v) && v > 0)
    ) {
      throw new Error('Ellipsoid metrics exceed representable length/area/volume range');
    }
    Object.freeze(this);
  }

  meridianDistance(latitude: number): number {
    validateLatitude(latitude);
    return Math.sign(latitude) * this.semiMajorAxis * this.meridian(Math.abs(latitude));
  }

  meridionalCurvatureRadius(latitude: number): number {
    validateLatitude(latitude);
    return this.semiMajorAxis * this.meridianIntegrand(latitude * DEG);
  }

  transverseCurvatureRadius(latitude: number): number {
    validateLatitude(latitude);
    const [s, c] = sincos(latitude);
    return this.semiMajorAxis / Math.hypot(c, this.ratio * s);
  }

  normalCurvatureRadius(latitude: number, azimuth: number): number {
    if (!Number.isFinite(azimuth)) throw new Error('Azimuth must be finite');
    const [s, c] = sincos(azimuth % 180);
    return (
      1 /
      ((c * c) / this.meridionalCurvatureRadius(latitude) +
        (s * s) / this.transverseCurvatureRadius(latitude))
    );
  }

  latitudeToAuxiliary(latitude: number, kind: AuxiliaryLatitude): number {
    validateKind(kind);
    validateLatitude(latitude);
    if (latitude === 0) return latitude;
    if (Math.abs(latitude) === 90)
      return kind === 'isometric' ? Math.sign(latitude) * Infinity : latitude;
    if (this.ratio === 1 && kind !== 'isometric') return latitude;
    const sign = Math.sign(latitude);
    const phi = Math.abs(latitude);
    const [s, c] = sincos(phi);
    switch (kind) {
      case 'geocentric':
        return sign * angle(this.ratio * this.ratio * s, c);
      case 'parametric':
        return sign * angle(this.ratio * s, c);
      case 'rectifying':
        return (
          sign *
          (phi <= 45
            ? (this.meridian(phi) / this.quarter) * 90
            : 90 -
              (integrate(t => this.meridianIntegrand(Math.PI / 2 - t), 0, (90 - phi) * DEG) /
                this.quarter) *
                90)
        );
      case 'authalic': {
        if (phi <= 45) {
          const q =
            this.ratio ** 2 * (s / (c * c + (this.ratio * s) ** 2) + this.eccentricIntegral(s));
          return (sign * Math.asin(q / this.qPole)) / DEG;
        }
        const cap = integrate(
          t => {
            const st = Math.sin(t),
              ct = Math.cos(t);
            const d = st * st + (this.ratio * ct) ** 2;
            return (2 * this.ratio ** 2 * st) / (d * d);
          },
          0,
          (90 - phi) * DEG
        );
        return sign * (90 - (2 * Math.asin(Math.sqrt(cap / (2 * this.qPole)))) / DEG);
      }
      default: {
        const psi = Math.asinh(s / c) - this.e2 * this.eccentricIntegral(s);
        return (
          sign *
          (kind === 'isometric'
            ? psi / DEG
            : psi < 1
              ? Math.atan(Math.sinh(psi)) / DEG
              : 90 - (2 * Math.atan(Math.exp(-psi))) / DEG)
        );
      }
    }
  }

  latitudeFromAuxiliary(latitude: number, kind: AuxiliaryLatitude): number {
    validateKind(kind);
    if (kind === 'isometric' && Math.abs(latitude) === Infinity) return Math.sign(latitude) * 90;
    if (kind !== 'isometric') validateLatitude(latitude);
    else if (!Number.isFinite(latitude))
      throw new Error('Isometric latitude must be finite or a pole infinity');
    if (latitude === 0) return latitude;
    if (kind !== 'isometric' && Math.abs(latitude) === 90) return latitude;
    if (this.ratio === 1 && kind !== 'isometric') return latitude;
    const sign = Math.sign(latitude),
      target = Math.abs(latitude);
    if (kind === 'geocentric' || kind === 'parametric') {
      const [s, c] = sincos(target);
      return sign * angle(s, c * (kind === 'geocentric' ? this.ratio ** 2 : this.ratio));
    }
    // Monotonic, bounded solve in degrees; preserves input complements near poles.
    let lo = 0,
      hi = 90;
    for (let i = 0; i < 64; ++i) {
      const mid = (lo + hi) / 2;
      if (mid === lo || mid === hi) break;
      if (this.latitudeToAuxiliary(mid, kind) < target) lo = mid;
      else hi = mid;
    }
    return sign * ((lo + hi) / 2);
  }

  private eccentricIntegral(s: number): number {
    const e = Math.sqrt(Math.abs(this.e2));
    return e === 0 ? s : (this.e2 > 0 ? Math.atanh(e * s) : Math.atan(e * s)) / e;
  }

  private meridianIntegrand(t: number): number {
    return this.ratio ** 2 / Math.hypot(Math.cos(t), this.ratio * Math.sin(t)) ** 3;
  }

  private meridian(phi: number): number {
    return phi <= 45
      ? integrate(t => this.meridianIntegrand(t), 0, phi * DEG)
      : this.quarter - integrate(t => this.meridianIntegrand(Math.PI / 2 - t), 0, (90 - phi) * DEG);
  }
}

function validateLatitude(value: number): void {
  if (!(Number.isFinite(value) && Math.abs(value) <= 90))
    throw new Error('Latitude must be in [-90, 90] degrees');
}
function validateKind(kind: AuxiliaryLatitude): void {
  if (!KINDS.includes(kind)) throw new Error('Unknown auxiliary latitude');
}
function sincos(degrees: number): [number, number] {
  const a = Math.abs(degrees);
  if (a <= 45) return [Math.sin(degrees * DEG), Math.cos(degrees * DEG)];
  return [Math.sign(degrees) * Math.cos((90 - a) * DEG), Math.sin((90 - a) * DEG)];
}
function angle(s: number, c: number): number {
  return s > c ? 90 - Math.atan2(c, s) / DEG : Math.atan2(s, c) / DEG;
}
/** @internal Shared bounded quadrature for original revolution integrals. */
export function integrate(f: (t: number) => number, lo: number, hi: number): number {
  let sum = 0;
  for (let j = 0; j < 8; ++j) {
    const h = (hi - lo) / 16,
      mid = lo + (2 * j + 1) * h;
    let part = 0;
    for (let i = 0; i < 8; ++i)
      part += WEIGHTS[i] * (f(mid - h * NODES[i]) + f(mid + h * NODES[i]));
    sum += h * part;
  }
  return sum;
}
