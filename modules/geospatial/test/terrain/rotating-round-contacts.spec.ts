// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  TerrainSurface,
  sweepTerrainCapsule,
  sweepTerrainRotatingCapsule,
  sweepTerrainRotatingSphere
} from '@math.gl/geospatial/terrain';
import fixtures from './fixtures/rotating-round-contacts.json';

/** Construct the reference sheet while preserving separate seam vertices. */
function sheet(patches = fixtures.patches) {
  return new TerrainSurface({
    positions: Float64Array.from(patches.flatMap(patch => patch.positions)),
    indices: Uint32Array.from(
      patches.flatMap((patch, i) => patch.indices.map(index => i * 4 + index))
    )
  });
}

/** Convert serialized coordinates to a Cartesian tuple. */
const point = (v: number[]) => [v[0], v[1], v[2]] as const;
const terrain = sheet();

for (const fixture of fixtures.cases) {
  test(fixture.name, () => {
    const {
      start,
      end,
      pivot,
      rotation: [x, y, z, w],
      translation,
      radius,
      maxWork,
      time,
      expected
    } = fixture;
    const pose = {
      pivot: point(pivot),
      rotation: [x, y, z, w] as const,
      translation: point(translation)
    };
    const options = {maxWork, fractionTolerance: 1e-5};
    for (const surface of [terrain, sheet([...fixtures.patches].reverse())]) {
      const result = start.every((v, i) => v === end[i])
        ? sweepTerrainRotatingSphere(surface, point(start), radius, pose, options)
        : sweepTerrainRotatingCapsule(surface, point(start), point(end), radius, pose, options);
      expect(result.work).toBeLessThanOrEqual(maxWork);
      if (expected === 'grazing') expect(result.status).not.toBe('miss');
      else expect(result.status).toBe(expected);
      if (result.status === 'hit') {
        expect(result.lowerFraction).toBeLessThanOrEqual(time + 1e-12);
        expect(result.fraction).toBeGreaterThanOrEqual(time - 1e-12);
        expect(result.fraction - result.lowerFraction).toBeLessThanOrEqual(
          options.fractionTolerance
        );
        expect(result.contact.distance).toBeLessThanOrEqual(radius);
        if (expected === 'hit') expect(result.contact.point[0]).toBeCloseTo(0, 12);
      }
      if (expected === 'incomplete') expect(result.work).toBe(maxWork);
    }
  });
}

test('identity rotation delegates to the fixed sweep and shortest-arc sign agrees', () => {
  const start = [0, -1, 0.75] as const;
  const end = [0, 1, 0.75] as const;
  const pivot = [0, 0, 0.75] as const;
  const translation = [0, 0, -1] as const;
  const options = {fractionTolerance: 1e-5};
  expect(
    sweepTerrainRotatingCapsule(
      terrain,
      start,
      end,
      0.25,
      {
        pivot,
        rotation: [0, 0, 0, -1],
        translation
      },
      options
    )
  ).toEqual(sweepTerrainCapsule(terrain, start, end, translation, 0.25, options));

  const rotation = [Math.SQRT1_2, 0, 0, Math.SQRT1_2] as const;
  const same = [-Math.SQRT1_2, 0, 0, -Math.SQRT1_2] as const;
  const still = [0, 0, 0] as const;
  expect(
    sweepTerrainRotatingCapsule(terrain, start, end, 0.25, {pivot, rotation, translation: still})
  ).toEqual(
    sweepTerrainRotatingCapsule(terrain, start, end, 0.25, {
      pivot,
      rotation: same,
      translation: still
    })
  );
  expect(
    sweepTerrainRotatingCapsule(terrain, start, end, 1, {pivot, rotation, translation: still})
  ).toMatchObject({status: 'hit', fraction: 0, lowerFraction: 0});
  expect(
    sweepTerrainRotatingCapsule(
      terrain,
      start,
      end,
      0.25,
      {pivot, rotation, translation: still},
      {maxWork: 0}
    )
  ).toEqual({status: 'incomplete', work: 0});
  expect(() =>
    sweepTerrainRotatingCapsule(terrain, start, end, -1, {pivot, rotation, translation: still})
  ).toThrow(RangeError);
});

test('brackets combined translation and rotation at the final pose', () => {
  // Lowest point is 1.75 - 0.5*t - sin(pi*t/2) - 0.25. It decreases to zero at t=1.
  const result = sweepTerrainRotatingCapsule(terrain, [0, -1, 1.75], [0, 1, 1.75], 0.25, {
    pivot: [0, 0, 1.75],
    translation: [0, 0, -0.5],
    rotation: [Math.SQRT1_2, 0, 0, Math.SQRT1_2]
  });
  expect(result).toMatchObject({status: 'hit', fraction: 1});
  if (result.status === 'hit') expect(result.lowerFraction).toBeGreaterThanOrEqual(1 - 1e-5);
});
