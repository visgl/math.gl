// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {TerrainSurface} from '../../src/terrain/surface';
import {sweepTerrainRotatingSphere} from '../../src/terrain/sweep-rotating-capsule';

/** A coarse left quad next to a two-row right patch with independent seam vertices. */
function mixedSurface(reverse: boolean, gap: number) {
  const patches = [
    {positions: [-4, -4, 0, -gap, -4, 0, -gap, 4, 0, -4, 4, 0], indices: [0, 1, 2, 0, 2, 3]},
    {
      positions: [gap, -4, 0, 4, -4, 0, gap, 0, 0, 4, 0, 0, gap, 4, 0, 4, 4, 0],
      indices: [0, 1, 3, 0, 3, 2, 2, 3, 5, 2, 5, 4]
    }
  ];
  if (reverse) patches.reverse();
  const positions: number[] = [];
  const indices: number[] = [];
  for (const patch of patches) {
    const base = positions.length / 3;
    positions.push(...patch.positions);
    indices.push(...patch.indices.map(index => index + base));
  }
  return new TerrainSurface({
    positions: Float64Array.from(positions),
    indices: Uint32Array.from(indices)
  });
}

/** Rotate a sphere about +Y through pi. Its center follows (x + cos(pi*t), 0, z - sin(pi*t)). */
function sweep(surface: TerrainSurface, z: number, maxWork = 100_000, x = 0) {
  return sweepTerrainRotatingSphere(
    surface,
    [x + 1, 0, z],
    0.25,
    {pivot: [x, 0, z], rotation: [0, 1, 0, 0], translation: [0, 0, 0]},
    {maxWork, fractionTolerance: 1e-5}
  );
}

for (const reverse of [false, true]) {
  test(`sphere impact at a 2:1 seam, reversed=${reverse}`, () => {
    const surface = mixedSurface(reverse, 0);
    const z = 0.5;
    const first = Math.asin(z - 0.25) / Math.PI;
    const x = -Math.cos(Math.PI * first);
    const result = sweep(surface, z, 100_000, x);
    expect(result.status).toBe('hit');
    if (result.status !== 'hit') return;
    expect(result.lowerFraction).toBeLessThanOrEqual(first + 1e-12);
    expect(result.fraction).toBeGreaterThanOrEqual(first - 1e-12);
    expect(result.fraction - result.lowerFraction).toBeLessThanOrEqual(1e-5);
    const angle = Math.PI * result.fraction;
    expect(result.contact.point[0]).toBeCloseTo(x + Math.cos(angle), 10);
    expect(result.contact.point[1]).toBeCloseTo(0, 10);
    expect(result.contact.point[2]).toBeCloseTo(0, 10);
    expect(result.contact.distance).toBeCloseTo(z - Math.sin(angle), 10);
  });

  test(`grazing, clearance, absent terrain and exhausted work, reversed=${reverse}`, () => {
    const surface = mixedSurface(reverse, 0);
    const grazing = sweep(surface, 1.25);
    expect(grazing.status).not.toBe('miss');
    if (grazing.status === 'hit') {
      expect(grazing.lowerFraction).toBeLessThanOrEqual(0.5);
      expect(grazing.fraction).toBeGreaterThanOrEqual(0.5 - 1e-12);
    }
    expect(sweep(surface, 1.25 + 2 ** -12).status).toBe('miss');
    expect(sweep(surface, 1.25 - 2 ** -12).status).toBe('incomplete');
    // At z <= radius, |x| <= sqrt(1 - (1 - 2^-12)^2) < 0.023.
    // The nearest resident edge is at |x| = 0.75, outside the sphere.
    expect(sweep(mixedSurface(reverse, 0.75), 1.25 - 2 ** -12).status).toBe('miss');
    for (const budget of [0, 1, 8, 32]) {
      expect(sweep(surface, 1.25 - 2 ** -12, budget)).toMatchObject({
        status: 'incomplete',
        work: budget
      });
    }
  });
}
