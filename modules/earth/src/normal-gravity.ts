// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) Charles Karney (2011-2022)
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original bounded oblate confocal-potential evaluator and analytic gradient; normal-potential formulation follows GeographicLib 2.7 NormalGravity.cpp (MIT). See LICENSE.
export type NormalGravityOptions = {
  semiMajorAxis: number;
  flattening: number;
  gravitationalParameter: number;
  /** Rotation rate in radians/second; effective gravity includes centrifugal acceleration. */
  angularVelocity: number;
};
export type GravityVector = [number, number, number];
export type NormalGravityField = {
  /** Positive potential, m²/s²; acceleration is its Cartesian gradient. */
  potential: number;
  gravitationalPotential: number;
  centrifugalPotential: number;
  /** Earth-centred, Earth-fixed XYZ components, m/s². */
  acceleration: GravityVector;
  gravitationalAcceleration: GravityVector;
  centrifugalAcceleration: GravityVector;
};
export type LocalNormalGravityField = NormalGravityField & {
  /** East, north, up in m/s². East is identically zero for this axisymmetric model. */
  localAcceleration: GravityVector;
};

// q(z) / z³ = sum (-1)^n 2(n+1)/((2n+3)(2n+5)) z^(2n).
// 25 terms suffice for flattening <= .02 and exterior points (z² <= .042).
function qSeries(t: number): [number, number] {
  let value = 0,
    derivative = 0;
  for (let n = 24; n >= 0; n--) {
    derivative = derivative * t + value;
    value = value * t + ((n % 2 ? -1 : 1) * 2 * (n + 1)) / ((2 * n + 3) * (2 * n + 5));
  }
  return [value, derivative];
}
const DEG = Math.PI / 180;
function sinCosDegrees(degrees: number): [number, number] {
  const quadrant = Math.round(degrees / 90),
    angle = (degrees - 90 * quadrant) * DEG,
    s = Math.sin(angle),
    c = Math.cos(angle);
  switch (((quadrant % 4) + 4) % 4) {
    case 0:
      return [s, c];
    case 1:
      return [c, -s];
    case 2:
      return [-s, -c];
    default:
      return [-c, s];
  }
}
/** Dataset-free reference normal gravity, not a measured gravity/anomaly model.
 * Qualified oblate/sphere profile: 0 <= f <= .02, surface through 100a altitude.
 */
export class NormalGravity {
  readonly semiMajorAxis: number;
  readonly semiMinorAxis: number;
  readonly flattening: number;
  readonly gravitationalParameter: number;
  readonly angularVelocity: number;
  readonly surfacePotential: number;
  private readonly e2: number;
  private readonly q0: number;
  private readonly spin: number;
  constructor(options: NormalGravityOptions) {
    const {
      semiMajorAxis: a,
      flattening: f,
      gravitationalParameter: gm,
      angularVelocity: w
    } = options;
    const spin = w * w * a * a;
    if (
      ![a, f, gm, w].every(Number.isFinite) ||
      a < 1 ||
      a > 1e9 ||
      f < 0 ||
      f > 0.02 ||
      gm < 1 ||
      gm > 1e25 ||
      w < 0 ||
      !Number.isFinite(spin) ||
      (spin * a) / gm > 0.1
    )
      throw new RangeError('Invalid normal-gravity constants or unsupported shape/rotation');
    this.semiMajorAxis = a;
    this.semiMinorAxis = a * (1 - f);
    this.flattening = f;
    this.gravitationalParameter = gm;
    this.angularVelocity = w;
    this.spin = spin;
    this.e2 = f * (2 - f);
    this.q0 = qSeries(this.e2 / (1 - f) ** 2)[0];
    const z = Math.sqrt(this.e2) / (1 - f);
    this.surfacePotential = (gm / this.semiMinorAxis) * (z ? Math.atan(z) / z : 1) + spin / 3;
    Object.freeze(this);
  }
  static WGS84(): NormalGravity {
    return new NormalGravity({
      semiMajorAxis: 6378137,
      flattening: 1 / 298.257223563,
      gravitationalParameter: 3.986004418e14,
      angularVelocity: 7.292115e-5
    });
  }
  /** Reference surface gravity magnitude, positive down, m/s². Latitude in degrees. */
  surfaceGravity(latitude: number): number {
    return -this.evaluate(latitude, 0, 0).localAcceleration[2];
  }
  evaluate(latitude: number, longitude: number, height = 0): LocalNormalGravityField {
    if (
      !Number.isFinite(latitude) ||
      Math.abs(latitude) > 90 ||
      !Number.isFinite(longitude) ||
      Math.abs(longitude) > 180 ||
      !Number.isFinite(height) ||
      height < 0 ||
      height > 100 * this.semiMajorAxis
    )
      throw new RangeError('Expected geographic degrees and exterior height in [0,100a]');
    const [s, c] = sinCosDegrees(latitude),
      [sl, cl] = sinCosDegrees(longitude),
      n = this.semiMajorAxis / Math.sqrt(1 - this.e2 * s * s);
    const field = this.evaluateCartesian(
      (n + height) * c * cl,
      (n + height) * c * sl,
      (n * (1 - this.e2) + height) * s
    );
    const radial = field.acceleration[0] * cl + field.acceleration[1] * sl;
    return {
      ...field,
      localAcceleration: [
        0,
        -radial * s + field.acceleration[2] * c,
        radial * c + field.acceleration[2] * s
      ]
    };
  }
  evaluateCartesian(x: number, y: number, z: number): NormalGravityField {
    const a = this.semiMajorAxis,
      b = this.semiMinorAxis,
      gm = this.gravitationalParameter;
    const px = x / a,
      py = y / a,
      pz = z / a,
      p = Math.hypot(px, py),
      r = Math.hypot(p, pz);
    const surface = Math.hypot(p, pz / (1 - this.flattening));
    if (
      ![x, y, z].every(Number.isFinite) ||
      surface < 1 - 16 * Number.EPSILON ||
      r > 101 * (1 + 8 * Number.EPSILON)
    )
      throw new RangeError('Cartesian point must be on/above the ellipsoid and within 101a');
    const q = r * r - this.e2,
      uN = Math.sqrt((q + Math.hypot(q, 2 * Math.sqrt(this.e2) * pz)) / 2),
      u = a * uN,
      uE = Math.hypot(uN, Math.sqrt(this.e2));
    let sb = pz / uN,
      cb = p / uE;
    const norm = Math.hypot(sb, cb);
    sb /= norm;
    cb /= norm;
    const t = this.e2 / (uN * uN),
      [qs, qd] = qSeries(t),
      ratio = ((b / u) ** 3 * qs) / this.q0,
      ang = (sb * sb - 1 / 3) / 2;
    const az = Math.sqrt(t),
      gravitationalPotential = (gm / u) * (az ? Math.atan(az) / az : 1) + this.spin * ratio * ang;
    const du =
      -gm / (a * a * (uN * uN + this.e2)) -
      ((this.spin * ratio) / u) * (3 + (2 * t * qd) / qs) * ang;
    const db = this.spin * ratio * sb * cb;
    const d2 = uN * uN + this.e2 * sb * sb,
      hu2 = d2 / (uN * uN + this.e2);
    const gp = (du * uN * cb) / (uE * hu2) - (db * uE * sb) / (a * d2),
      gz = (du * sb) / hu2 + (db * uN * cb) / (a * d2);
    const cl = p ? px / p : 1,
      sl = p ? py / p : 0;
    const gravitationalAcceleration: GravityVector = [gp * cl, gp * sl, gz];
    const w2 = this.angularVelocity * this.angularVelocity,
      centrifugalAcceleration: GravityVector = [w2 * x, w2 * y, 0];
    const centrifugalPotential = (w2 * (x * x + y * y)) / 2;
    return {
      potential: gravitationalPotential + centrifugalPotential,
      gravitationalPotential,
      centrifugalPotential,
      gravitationalAcceleration,
      centrifugalAcceleration,
      acceleration: [
        gravitationalAcceleration[0] + centrifugalAcceleration[0],
        gravitationalAcceleration[1] + centrifugalAcceleration[1],
        gz
      ]
    };
  }
}
