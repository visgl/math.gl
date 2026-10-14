// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test, vi} from 'vitest';
import {createProjectionEngine} from '@math.gl/projection/core';
import {projJSONCRSParser} from '@math.gl/projection';
import {transverseMercator} from '@math.gl/projection/projections/tmerc';
import {resolveRenderingProfile} from '../../src/experimental/rendering-profile';
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
  expect(calls[0]).toEqual([
    (120 * Math.PI) / 180,
    (-30 * Math.PI) / 180,
    (150 * Math.PI) / 180,
    (40 * Math.PI) / 180
  ]);
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
