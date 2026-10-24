// math.gl
// SPDX-License-Identifier: ISC
// SPDX-FileCopyrightText: Copyright 2013-2021 Mike Bostock
// Adapted from d3-geo-projection src/{elliptic,guyou}.js.
// See D3-LICENSE.txt. Kept internal; radians in and unit-radius coordinates out.
const {abs, atan, atan2, cos, cosh, exp, log, pow, sign, sin, sinh, sqrt, tan, tanh} = Math;
const asin = (x: number) => Math.asin(Math.max(-1, Math.min(1, x)));
const pi = Math.PI,
  halfPi = pi / 2,
  quarterPi = pi / 4;
const sqrt2 = Math.SQRT2,
  epsilon = 1e-12;

// Returns [sn, cn, dn](u + iv|m).
export function ellipticJi(u: number, v: number, m: number) {
  var a, b, c;
  if (!u) {
    b = ellipticJ(v, 1 - m);
    return [
      [0, b[0] / b[1]],
      [1 / b[1], 0],
      [b[2] / b[1], 0]
    ];
  }
  a = ellipticJ(u, m);
  if (!v)
    return [
      [a[0], 0],
      [a[1], 0],
      [a[2], 0]
    ];
  b = ellipticJ(v, 1 - m);
  c = b[1] * b[1] + m * a[0] * a[0] * b[0] * b[0];
  return [
    [(a[0] * b[2]) / c, (a[1] * a[2] * b[0] * b[1]) / c],
    [(a[1] * b[1]) / c, (-a[0] * a[2] * b[0] * b[2]) / c],
    [(a[2] * b[1] * b[2]) / c, (-m * a[0] * a[1] * b[0]) / c]
  ];
}

// Returns [sn, cn, dn, ph](u|m).
export function ellipticJ(u: number, m: number) {
  var ai, b, phi, t, twon;
  if (m < epsilon) {
    t = sin(u);
    b = cos(u);
    ai = (m * (u - t * b)) / 4;
    return [t - ai * b, b + ai * t, 1 - (m * t * t) / 2, u - ai];
  }
  if (m >= 1 - epsilon) {
    ai = (1 - m) / 4;
    b = cosh(u);
    t = tanh(u);
    phi = 1 / b;
    twon = b * sinh(u);
    return [
      t + (ai * (twon - u)) / (b * b),
      phi - ai * t * phi * (twon - u),
      phi + ai * t * phi * (twon + u),
      2 * atan(exp(u)) - halfPi + (ai * (twon - u)) / b
    ];
  }

  var a = [1, 0, 0, 0, 0, 0, 0, 0, 0],
    c = [sqrt(m), 0, 0, 0, 0, 0, 0, 0, 0],
    i = 0;
  b = sqrt(1 - m);
  twon = 1;

  while (abs(c[i] / a[i]) > epsilon && i < 8) {
    ai = a[i++];
    c[i] = (ai - b) / 2;
    a[i] = (ai + b) / 2;
    b = sqrt(ai * b);
    twon *= 2;
  }

  phi = twon * a[i] * u;
  do {
    b = phi;
    t = (c[i] * sin(b)) / a[i];
    phi = (asin(t) + phi) / 2;
  } while (--i);

  t = cos(phi);
  return [sin(phi), t, t / cos(phi - b), phi];
}

// Calculate F(phi+iPsi|m).
// See Abramowitz and Stegun, 17.4.11.
export function ellipticFi(phi: number, psi: number, m: number) {
  var r = abs(phi),
    i = abs(psi),
    sinhPsi = sinh(i);
  if (r) {
    var cscPhi = 1 / sin(r),
      cotPhi2 = 1 / (tan(r) * tan(r)),
      b = -(cotPhi2 + m * (sinhPsi * sinhPsi * cscPhi * cscPhi) - 1 + m),
      c = (m - 1) * cotPhi2,
      cotLambda2 = (-b + sqrt(b * b - 4 * c)) / 2;
    return [
      ellipticF(atan(1 / sqrt(cotLambda2)), m) * sign(phi),
      ellipticF(atan(sqrt(Math.max(0, (cotLambda2 / cotPhi2 - 1) / m))), 1 - m) * sign(psi)
    ];
  }
  return [0, ellipticF(atan(sinhPsi), 1 - m) * sign(psi)];
}

// Calculate F(phi|m) where m = k² = sin²α.
// See Abramowitz and Stegun, 17.6.7.
export function ellipticF(phi: number, m: number) {
  if (!m) return phi;
  if (m === 1) return log(tan(phi / 2 + quarterPi));
  var a = 1,
    b = sqrt(1 - m),
    c = sqrt(m);
  for (var i = 0; abs(c) > epsilon; i++) {
    if (phi % pi) {
      var dPhi = atan((b * tan(phi)) / a);
      if (dPhi < 0) dPhi += pi;
      phi += dPhi + ~~(phi / pi) * pi;
    } else phi += phi;
    c = (a + b) / 2;
    b = sqrt(a * b);
    a = c;
    c = (a - b) / 2;
  }
  return phi / (pow(2, i) * a);
}

export function guyouRaw(lambda: number, phi: number) {
  var k_ = (sqrt2 - 1) / (sqrt2 + 1),
    k = sqrt(1 - k_ * k_),
    K = ellipticF(halfPi, k * k),
    f = -1,
    psi = log(tan(pi / 4 + abs(phi) / 2)),
    r = exp(f * psi) / sqrt(k_),
    at = guyouComplexAtan(r * cos(f * lambda), r * sin(f * lambda)),
    t = ellipticFi(at[0], at[1], k * k);
  return [-t[1], (phi >= 0 ? 1 : -1) * (0.5 * K - t[0])];
}

function guyouComplexAtan(x: number, y: number) {
  var x2 = x * x,
    y_1 = y + 1,
    t = 1 - x2 - y * y;
  return [
    0.5 * ((x >= 0 ? halfPi : -halfPi) - atan2(t, 2 * x)),
    -0.25 * log(t * t + 4 * x2) + 0.5 * log(y_1 * y_1 + x2)
  ];
}

function guyouComplexDivide(a: number[], b: number[]) {
  var denominator = b[0] * b[0] + b[1] * b[1];
  return [(a[0] * b[0] + a[1] * b[1]) / denominator, (a[1] * b[0] - a[0] * b[1]) / denominator];
}

guyouRaw.invert = function (x: number, y: number) {
  var k_ = (sqrt2 - 1) / (sqrt2 + 1),
    k = sqrt(1 - k_ * k_),
    K = ellipticF(halfPi, k * k),
    f = -1,
    j = ellipticJi(0.5 * K - y, -x, k * k),
    tn = guyouComplexDivide(j[0], j[1]),
    lambda = atan2(tn[1], tn[0]) / f;
  return [lambda, 2 * atan(exp((0.5 / f) * log(k_ * tn[0] * tn[0] + k_ * tn[1] * tn[1]))) - halfPi];
};
