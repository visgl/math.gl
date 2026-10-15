// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test, vi} from 'vitest';
import {createProjectionEngine} from '@math.gl/projection/core';
import {projJSONCRSParser} from '@math.gl/projection';
import {transverseMercator} from '@math.gl/projection/projections/tmerc';
import {
  resolveRenderingProfile,
  combineRenderingProfiles
} from '../../src/experimental/rendering-profile/rendering-profile';
import type {
  ProjectionImplementation,
  ProjectionRenderingProfile
} from '../../src/experimental/types';
import {projectedJSON} from '../fixtures/crs-datums';

const defaultProfile: ProjectionRenderingProfile = {
  bounds: [
    [-10, -20, 0],
    [10, 20, 0]
  ]
};
const coverage = [0, 0, 1, 1] as const;

test('profile retrieval delegates default and declared coverage unchanged', () => {
  const getRenderingProfile = vi.fn(() => defaultProfile);
  expect(resolveRenderingProfile(getRenderingProfile).bounds).toEqual(defaultProfile.bounds);
  expect(getRenderingProfile.mock.calls).toEqual([[]]);
  getRenderingProfile.mockClear();
  expect(resolveRenderingProfile(getRenderingProfile, coverage).bounds).toEqual(
    defaultProfile.bounds
  );
  expect(getRenderingProfile.mock.calls).toEqual([[coverage]]);
});

test.each(['callback', 'lazy-bounds', 'nonfinite-bounds'])(
  'coverage-specific %s failure falls back to the algorithm default',
  failure => {
    const getRenderingProfile = vi.fn<NonNullable<ProjectionImplementation['getRenderingProfile']>>(
      declared => {
        if (!declared) return defaultProfile;
        if (failure === 'callback') throw new Error('No convertible coverage');
        if (failure === 'nonfinite-bounds')
          return {
            bounds: [
              [0, 0, 0],
              [Infinity, 1, 0]
            ]
          };
        return {
          get bounds() {
            throw new Error('No finite envelope');
          }
        };
      }
    );
    expect(resolveRenderingProfile(getRenderingProfile, coverage).bounds).toEqual(
      defaultProfile.bounds
    );
    expect(getRenderingProfile.mock.calls).toEqual([[coverage], []]);
  }
);

test('default-profile failures remain actionable', () => {
  const getRenderingProfile = vi.fn(() => {
    throw new Error('Missing default rendering target');
  });
  expect(() => resolveRenderingProfile(getRenderingProfile, coverage)).toThrow(
    'Missing default rendering target'
  );
  expect(getRenderingProfile.mock.calls).toEqual([[coverage], []]);
});

test('rendering fallback preserves declared metadata and effective axis conventions', async () => {
  const calls: unknown[] = [];
  const engine = createProjectionEngine({
    parsers: [projJSONCRSParser],
    projections: [
      {
        ...transverseMercator,
        create(context) {
          const implementation = transverseMercator.create(context);
          return {
            ...implementation,
            getRenderingProfile(declared) {
              calls.push(declared);
              if (declared) throw new Error('No convertible coverage');
              return implementation.getRenderingProfile!();
            }
          };
        }
      }
    ]
  });
  const bbox = {west_longitude: 120, south_latitude: -30, east_longitude: 150, north_latitude: 40};
  const definition = {
    ...projectedJSON,
    bbox,
    coordinate_system: {
      ...projectedJSON.coordinate_system,
      axis: [...projectedJSON.coordinate_system.axis].reverse()
    }
  };
  const descriptor = await engine.getCRS(definition);
  expect(calls).toHaveLength(2);
  expect(calls[0]).toEqual([120, -30, 150, 40]);
  expect(calls[1]).toBeUndefined();
  expect(descriptor.areaOfUse).toEqual([120, -30, 150, 40]);
  expect(descriptor.axis).toBe('enu');
  const original = await engine.getCRS({...definition, bbox: undefined});
  expect(descriptor.parameters).toEqual(original.parameters);
  expect(descriptor.renderingBounds).toEqual(original.renderingBounds);
  expect(descriptor.signature).not.toBe(original.signature);
  const enforced = await engine.getCRS(definition, {enforceAxis: true});
  expect(enforced.axis).toBe('neu');
  expect(enforced.areaOfUse).toEqual(descriptor.areaOfUse);
  expect(definition.bbox).toEqual(bbox);
  await expect(
    engine.getCRS({...definition, bbox: {...bbox, north_latitude: 100}})
  ).rejects.toThrow();
});

test.each([true, false])(
  'normalization is owned by the projection, callback present: %s',
  async supplied => {
    const normalize = vi.fn((point: {x: number; y: number; z: number}) => {
      // The plugin sees the original geographic position, before any rendering policy.
      expect(point.x).toBeCloseTo(3 * Math.PI, 12);
      expect(point.y).toBeCloseTo((100 * Math.PI) / 180, 12);
    });
    const getRenderingProfile = vi.fn(() => ({
      ...defaultProfile,
      normalize: supplied ? normalize : undefined
    }));
    const engine = createProjectionEngine({
      projections: [
        {
          name: 'custom',
          parameters: [],
          create: () => ({
            getRenderingProfile,
            forward: (x, y) => [x, y],
            inverse: (x, y) => [x, y]
          })
        }
      ]
    });
    const projection = engine.createProjection({to: '+proj=custom +R=6378137'});
    projection.project([0, 0]);
    expect(getRenderingProfile).not.toHaveBeenCalled();
    const descriptor = await engine.getCRS('+proj=custom +R=6378137');
    const result = descriptor.converter.WGS84.normalize([540, 100, 12, 99]);
    expect(result[0]).toBeCloseTo(540, 12);
    expect(result[1]).toBeCloseTo(100, 12);
    expect(result.slice(2)).toEqual([12, 99]);
    expect(normalize).toHaveBeenCalledTimes(supplied ? 1 : 0);
    if (!supplied) expect(result).toEqual([540, 100, 12, 99]);
  }
);

test('profile callback receives wrapped Greenwich coverage unchanged with a prime meridian', async () => {
  const calls: unknown[] = [];
  const engine = createProjectionEngine({
    parsers: [projJSONCRSParser],
    projections: [
      {
        ...transverseMercator,
        create(context) {
          const implementation = transverseMercator.create(context);
          return {
            ...implementation,
            getRenderingProfile(coverage) {
              calls.push(coverage);
              return implementation.getRenderingProfile!(coverage);
            }
          };
        }
      }
    ]
  });
  const coverage = [170, -20, -170, 20];
  await engine.getCRS({
    ...projectedJSON,
    base_crs: {...projectedJSON.base_crs, prime_meridian: {name: 'Test meridian', longitude: 10}},
    bbox: {west_longitude: 170, south_latitude: -20, east_longitude: -170, north_latitude: 20}
  });
  expect(calls[0]).toEqual(coverage);
});

test('combined coverage skips explicit empty pieces and retains the matching normalizer', () => {
  const regions = [
    [-20, -10, -10, 10],
    [10, -10, 20, 10]
  ] as const;
  const normalize = vi.fn((point: {x: number; y: number; z: number}) => {
    point.x = 0.2;
  });
  const resolve = vi.fn((region: (typeof regions)[number]) =>
    region === regions[0] ? null : {...defaultProfile, normalize}
  );
  const profile = combineRenderingProfiles(regions, resolve)!;
  expect(resolve.mock.calls).toEqual([[regions[0]], [regions[1]]]);
  expect(profile.bounds).toEqual(defaultProfile.bounds);
  const point = {x: 0, y: 0, z: 123};
  profile.normalize!(point);
  expect(point).toEqual({x: 0.2, y: 0, z: 123});
  expect(normalize).toHaveBeenCalledTimes(1);
});

test('combined coverage returns null only when every piece is explicitly empty', () => {
  expect(combineRenderingProfiles([coverage, coverage], () => null)).toBeNull();
  const resolve = vi.fn(() => defaultProfile);
  expect(combineRenderingProfiles([], resolve)).toBeNull();
  expect(resolve).not.toHaveBeenCalled();
});

test('combined coverage propagates unexpected callback and lazy-bound errors', () => {
  const error = new Error('Broken projection');
  expect(() =>
    combineRenderingProfiles([coverage], () => {
      throw error;
    })
  ).toThrow(error);
  expect(() =>
    combineRenderingProfiles([coverage], () => ({
      get bounds() {
        throw error;
      }
    }))
  ).toThrow(error);
});

test('combined coverage unions XYZ and selects the closest actual normalized position', () => {
  const bounds = [
    [
      [-10, -20, -30],
      [10, 20, 30]
    ],
    [
      [-40, -5, 0],
      [5, 50, 60]
    ]
  ] as const;
  let index = 0;
  const profile = combineRenderingProfiles([coverage, coverage], () => {
    const current = index++;
    return {
      bounds: bounds[current],
      normalize(point) {
        point.x = current === 0 ? 0.4 : -0.2;
        point.y = 0;
      }
    };
  })!;
  expect(profile.bounds).toEqual([
    [-40, -20, -30],
    [10, 50, 60]
  ]);
  const point = {x: 0, y: 0, z: 123};
  profile.normalize!(point);
  expect(point).toEqual({x: -0.2, y: 0, z: 123});
});

test('combined normalization resolves close candidates without longitude-branch bias', () => {
  let index = 0;
  const profile = combineRenderingProfiles([coverage, coverage], () => {
    const current = index++;
    return {
      ...defaultProfile,
      normalize(point) {
        point.x = current === 0 ? 2 * Math.PI + 1e-8 : 1e-9;
      }
    };
  })!;
  const point = {x: 0, y: 0, z: 123};
  profile.normalize!(point);
  expect(point.x).toBe(1e-9);
  expect(point.z).toBe(123);
});

test('combined normalization propagates errors without partially changing the input', () => {
  let index = 0;
  const error = new Error('Broken normalizer');
  const profile = combineRenderingProfiles([coverage, coverage], () => {
    const current = index++;
    return {
      ...defaultProfile,
      normalize(point) {
        if (current === 1) throw error;
        point.x = 0.2;
      }
    };
  })!;
  const point = {x: 0, y: 0, z: 123};
  expect(() => profile.normalize!(point)).toThrow(error);
  expect(point).toEqual({x: 0, y: 0, z: 123});
});
