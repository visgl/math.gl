// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original implementation of published equations; no reference code copied.
// Johnston, Spergel & Hernquist (1995), equations 1–3 and parameters in the arXiv draft:
// https://arxiv.org/abs/astro-ph/9502005 (v_halo = 212 km/s in that draft).
// Solar peculiar velocity: https://doi.org/10.1111/j.1365-2966.2010.16253.x

export const KMS_TO_PC_PER_YEAR = 31557600 / 3.0856775814913673e13;
const KMS_TO_PC_PER_MYR = KMS_TO_PC_PER_YEAR * 1e6;
const G = 4.30091727003628e-3 * KMS_TO_PC_PER_MYR ** 2;
const HALO_V2 = (212 * KMS_TO_PC_PER_MYR) ** 2;

/** Illustrative axisymmetric disk/bulge/halo model. Input pc, output pc/Myr². */
export function getGalacticAcceleration(position: readonly number[]): number[] {
  validateVector(position);
  const [x, y, z] = position;
  const r = Math.hypot(x, y, z);
  const q = Math.hypot(z, 260);
  const u = 6500 + q;
  const disk = (-G * 1e11) / (x * x + y * y + u * u) ** 1.5;
  const bulge = r === 0 ? 0 : (-G * 3.4e10) / (r * (r + 700) ** 2);
  const halo = (-2 * HALO_V2) / (r * r + 12000 ** 2);
  return [
    (disk + bulge + halo) * x,
    (disk + bulge + halo) * y,
    (disk * u * z) / q + (bulge + halo) * z
  ];
}

/** Specific potential in pc²/Myr², with an arbitrary halo zero point. */
export function getGalacticPotential(position: readonly number[]): number {
  validateVector(position);
  const [x, y, z] = position;
  const r = Math.hypot(x, y, z);
  return (
    (-G * 1e11) / Math.hypot(x, y, 6500 + Math.hypot(z, 260)) -
    (G * 3.4e10) / (r + 700) +
    HALO_V2 * Math.log1p((r * r) / 12000 ** 2)
  );
}

/** Time-reversible leapfrog integration. Position pc, velocity pc/Myr, elapsed Julian years. */
export function integrateGalacticOrbit(
  position: readonly number[],
  velocity: readonly number[],
  years: number,
  maximumStepYears = 10000
): {position: number[]; velocity: number[]} {
  validateVector(position);
  validateVector(velocity);
  if (
    !Number.isFinite(years) ||
    Math.abs(years) > 1e7 ||
    !Number.isFinite(maximumStepYears) ||
    maximumStepYears <= 0 ||
    maximumStepYears > 10000
  ) {
    throw new RangeError(
      'Galactic integration requires |years| <= 10 million and a step in (0, 10000]'
    );
  }
  const steps = Math.ceil(Math.abs(years) / maximumStepYears);
  if (steps > 100000) throw new RangeError('Galactic integration exceeds 100,000 steps');
  const p = [...position];
  const v = [...velocity];
  if (!steps) return {position: p, velocity: v};
  const dt = years / steps / 1e6;
  let acceleration = getGalacticAcceleration(p);
  for (let step = 0; step < steps; step++) {
    for (let axis = 0; axis < 3; axis++) {
      v[axis] += (acceleration[axis] * dt) / 2;
      p[axis] += v[axis] * dt;
    }
    acceleration = getGalacticAcceleration(p);
    for (let axis = 0; axis < 3; axis++) v[axis] += (acceleration[axis] * dt) / 2;
  }
  return {position: p, velocity: v};
}

// IAU J2000 Galactic pole and ascending node; constructed from defining angles.
// https://doi.org/10.1051/0004-6361/201014961 (Liu, Zhu & Zhang 2011, eq. 2).
const ra = (192.85948 * Math.PI) / 180;
const dec = (27.12825 * Math.PI) / 180;
const node = (32.93192 * Math.PI) / 180;
const pole = [Math.cos(dec) * Math.cos(ra), Math.cos(dec) * Math.sin(ra), Math.sin(dec)];
const east = [-Math.sin(ra), Math.cos(ra), 0];
const north = [-Math.sin(dec) * Math.cos(ra), -Math.sin(dec) * Math.sin(ra), Math.cos(dec)];
const basis = [
  east.map((v, i) => v * Math.cos(node) - north[i] * Math.sin(node)),
  east.map((v, i) => v * Math.sin(node) + north[i] * Math.cos(node)),
  pole
];
export function equatorialToGalactic(vector: readonly number[]): number[] {
  return basis.map(row => row.reduce((sum, v, i) => sum + v * vector[i], 0));
}
export function galacticToEquatorial(vector: readonly number[]): number[] {
  return [0, 1, 2].map(i => basis.reduce((sum, row, j) => sum + row[i] * vector[j], 0));
}
export const SOLAR_POSITION = [-8000, 0, 20];
const circularVelocity = Math.sqrt(-getGalacticAcceleration([-8000, 0, 0])[0] * -8000);
export const SOLAR_VELOCITY = [
  11.1 * KMS_TO_PC_PER_MYR,
  circularVelocity + 12.24 * KMS_TO_PC_PER_MYR,
  7.25 * KMS_TO_PC_PER_MYR
];

function validateVector(vector: readonly number[]): void {
  if (vector.length !== 3 || !vector.every(Number.isFinite))
    throw new RangeError('Expected a finite 3-vector');
}
