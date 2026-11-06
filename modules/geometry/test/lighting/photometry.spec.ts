// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {
  createPhotometricSampler,
  integrateLuminousFlux,
  resamplePhotometricProfile
} from '../../src/lighting/index';
import type {PhotometricProfile, PhotometricResampleOptions} from '../../src/lighting/index';

/** Builds tiny distributions whose intensities and solid-angle integrals are known analytically. */
function createProfile(
  vertical: number[],
  horizontal: number[],
  values: number[],
  multiplier = 1
): PhotometricProfile {
  const span = horizontal[horizontal.length - 1] - horizontal[0];
  return {
    verticalAngles: Float64Array.from(vertical),
    horizontalAngles: Float64Array.from(horizontal),
    intensities: Float64Array.from(values),
    intensityScale: multiplier,
    symmetry:
      horizontal.length === 1
        ? 'rotational'
        : span === 90
          ? 'quadrant'
          : span === 180
            ? 'bilateral'
            : 'none'
  };
}

test('Photometry sampler interpolates both axes and applies the candela multiplier once', () => {
  const sample = createPhotometricSampler(
    createProfile([0, 90, 180], [0, 180], [0, 10, 0, 20, 30, 20], 2)
  );
  expect(sample(45, 90)).toBe(30);
  expect(sample(45, 270)).toBe(30);
  expect(sample(90, -180)).toBe(60);
});

test('Photometry rotational sampler snapshots source data and returns zero outside measured vertical coverage', () => {
  const profile = createProfile([30, 90], [0], [2, 6], 2);
  const sample = createPhotometricSampler(profile);
  (profile.intensities as Float64Array).fill(100);
  (profile.verticalAngles as Float64Array)[0] = 0;
  profile.intensityScale = 100;
  expect(sample(60, 1e9)).toBe(8);
  expect(sample(0, 0)).toBe(0);
  expect(sample(180, 0)).toBe(0);
});

test.each([30, 150, 210, 330])('Photometry expands quarter symmetry at %s degrees', angle => {
  const sample = createPhotometricSampler(createProfile([0, 180], [0, 90], [1, 1, 3, 3]));
  expect(sample(90, angle)).toBeCloseTo(5 / 3, 12);
});

test.each([
  [0, 4],
  [90, 2],
  [270, 6],
  [360, 4],
  [-90, 6]
])('Photometry preserves the 90–270 degree symmetry origin at %s', (angle, expected) => {
  const sample = createPhotometricSampler(createProfile([0, 180], [90, 270], [2, 2, 6, 6]));
  expect(sample(90, angle)).toBe(expected);
});

test('Photometry full-circle sampling wraps the seam without changing authored interpolation', () => {
  const sample = createPhotometricSampler(
    createProfile([0, 180], [0, 180, 360], [1, 1, 3, 3, 1, 1])
  );
  expect(sample(90, 270)).toBe(2);
  expect(sample(90, 360)).toBe(1);
  expect(sample(90, -90)).toBe(2);
});

test.each([[0], [0, 90], [0, 180], [90, 270], [0, 180, 360]].map(horizontal => ({horizontal})))(
  'Photometry integrates constant candela over the sphere with angles %j',
  ({horizontal}) => {
    const profile = createProfile(
      [0, 180],
      horizontal,
      horizontal.flatMap(() => [2, 2]),
      3
    );
    expect(integrateLuminousFlux(profile)).toBeCloseTo(24 * Math.PI, 12);
  }
);

test.each([
  {angles: [0, 90], expected: 4},
  {angles: [90, 180], expected: 2 * Math.PI - 4}
])(
  'Photometry integrates a linear polar ramp over %j with the solid-angle sine weight',
  ({angles, expected}) => {
    expect(integrateLuminousFlux(createProfile(angles, [0], [0, 1]))).toBeCloseTo(expected, 12);
  }
);

test('Photometry integrates nonuniform azimuth intervals with their actual widths', () => {
  expect(
    integrateLuminousFlux(createProfile([0, 180], [0, 30, 180], [1, 1, 3, 3, 5, 5]))
  ).toBeCloseTo((44 * Math.PI) / 3, 12);
});

test.each([false, true])(
  'Photometry integration retains precision for a narrow cone at either pole: %s',
  reflected => {
    const angle = 1e-6;
    const angles = reflected ? [180 - angle, 180] : [0, angle];
    const width = angles[1] - angles[0];
    const expected = 4 * Math.PI * Math.sin((width * Math.PI) / 360) ** 2;
    expect(integrateLuminousFlux(createProfile(angles, [0], [1, 1])) / expected).toBeCloseTo(1, 12);
  }
);

test('Photometry grids declare layout, angular coordinates and physical or peak-relative units', () => {
  const profile = createProfile([0, 90, 180], [0], [0, 2, 0], 3);
  const grid = resamplePhotometricProfile(profile, {verticalCount: 3, horizontalCount: 4});
  expect([grid.width, grid.height, grid.unit, grid.peakCandela]).toEqual([3, 4, 'candela', 6]);
  expect(Array.from(grid.verticalAngles)).toEqual([0, 90, 180]);
  expect(Array.from(grid.horizontalAngles)).toEqual([0, 90, 180, 270]);
  expect(Array.from(grid.data)).toEqual([0, 6, 0, 0, 6, 0, 0, 6, 0, 0, 6, 0]);
  const normalized = resamplePhotometricProfile(profile, {
    verticalCount: 3,
    horizontalCount: 1,
    normalization: 'peak'
  });
  expect(normalized.unit).toBe('relative');
  expect(Array.from(normalized.data)).toEqual([0, 1, 0]);
  expect(Array.from(profile.intensities)).toEqual([0, 2, 0]);
});

test('Photometry normalization handles zero and subnormal peaks without infinities', () => {
  for (const intensity of [0, 1e-320]) {
    const grid = resamplePhotometricProfile(createProfile([0, 180], [0], [intensity, intensity]), {
      verticalCount: 2,
      horizontalCount: 1,
      normalization: 'peak'
    });
    expect(Array.from(grid.data)).toEqual(intensity === 0 ? [0, 0] : [1, 1]);
  }
  expect(integrateLuminousFlux(createProfile([0, 180], [0], [2, 2], 0))).toBe(0);
});

test.each([
  {verticalAngles: Float64Array.of(0, 0)},
  {
    horizontalAngles: Float64Array.of(30, 210),
    symmetry: 'quadrant' as const,
    intensities: Float64Array.of(1, 1, 1, 1)
  },
  {horizontalAngles: Float64Array.of(0, 270), intensities: Float64Array.of(1, 1, 1, 1)},
  {intensities: Float64Array.of(-1, 1)},
  {intensities: Float64Array.of(Infinity, 1)},
  {intensities: Float64Array.of(1)},
  {intensityScale: Infinity},
  {intensityScale: -1}
])('Photometry calculations reject invalid or ambiguous profiles %#', override => {
  const profile = {...createProfile([0, 180], [0], [1, 1]), ...override};
  expect(() => createPhotometricSampler(profile)).toThrow(/Photometry/);
});

test.each([
  [-1, 0],
  [181, 0],
  [NaN, 0],
  [90, Infinity]
])('Photometry rejects invalid sample angles %j', (vertical, horizontal) => {
  expect(() =>
    createPhotometricSampler(createProfile([0, 180], [0], [1, 1]))(vertical, horizontal)
  ).toThrow(/Photometry/);
});

test.each([
  {verticalCount: 1},
  {horizontalCount: 0},
  {verticalCount: 2.5},
  {verticalCount: 4_194_305},
  {normalization: 'other'}
])('Photometry rejects invalid grid requests %#', options => {
  expect(() =>
    resamplePhotometricProfile(
      createProfile([0, 180], [0], [1, 1]),
      options as PhotometricResampleOptions
    )
  ).toThrow(/Photometry/);
});

test('Photometry rejects a flux that exceeds finite numeric representation', () => {
  expect(() => integrateLuminousFlux(createProfile([0, 180], [0], [1e308, 1e308]))).toThrow(
    /overflow/
  );
});

test('Photometry accepts plain arrays with explicit symmetry and a default unit scale', () => {
  const profile: PhotometricProfile = {
    verticalAngles: [0, 180],
    horizontalAngles: [0],
    intensities: [1, 1],
    symmetry: 'rotational'
  };
  expect(createPhotometricSampler(profile)(90, 25)).toBe(1);
  expect(integrateLuminousFlux(profile)).toBeCloseTo(4 * Math.PI, 12);
});

test('Photometry supports explicitly selected bilateral symmetry at an arbitrary azimuth origin', () => {
  const profile = createProfile([0, 180], [30, 210], [2, 2, 6, 6]);
  const sample = createPhotometricSampler(profile);
  expect(sample(90, 30)).toBe(2);
  expect(sample(90, 210)).toBe(6);
  expect(sample(90, 120)).toBe(4);
  expect(integrateLuminousFlux(profile)).toBeCloseTo(16 * Math.PI, 12);
});

test('Photometry requires explicit symmetry instead of inferring a file convention', () => {
  const profile = createProfile([0, 180], [0], [1, 1]);
  const unspecified = {...profile, symmetry: undefined} as unknown as PhotometricProfile;
  expect(() => createPhotometricSampler(unspecified)).toThrow(/symmetry/);
});
