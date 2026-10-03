// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {ProjectionEngine, Projection, checkProjectionCompatibility} from '@math.gl/projection';
import {ProjectionEngine as CoreEngine, createProjectionDescriptor} from '@math.gl/projection/core';
import {mercator} from '@math.gl/projection/projections/merc';
import {LazyProjection} from '@math.gl/projection/projections/lazy';

test('ProjectionEngine supports the ready-to-use wrappers and subclassing', () => {
  expect(ProjectionEngine.name).toBe('ProjectionEngine');
  expect(CoreEngine).toBe(ProjectionEngine);
  expect(new Projection({})).toBeInstanceOf(ProjectionEngine);
  expect(new LazyProjection({})).toBeInstanceOf(ProjectionEngine);
  class CustomProjection extends ProjectionEngine {}
  expect(new CustomProjection({}).project([12, 55, 123, 8])).toEqual([12, 55, 123, 8]);
  expect(checkProjectionCompatibility('EPSG:3857', {projections: [mercator]}).status).toBe(
    'supported'
  );
  expect(checkProjectionCompatibility('EPSG:3857').reason).toBe('missing-plugin');
});

test('renamed engine retains selective eager and lazy scalar/flat behavior', async () => {
  let imports = 0;
  const lazy = createProjectionDescriptor({name: 'merc'}, async () => {
    imports++;
    return mercator;
  });
  const engine = new ProjectionEngine({to: 'EPSG:3857', projections: [mercator]});
  const deferred = new ProjectionEngine({to: 'EPSG:3857', projections: [lazy]});
  expect(imports).toBe(0);
  expect(() => deferred.projectSync([12, 55])).toThrow('preload');
  await deferred.preload();
  expect(imports).toBe(1);
  const point = [12, 55, 123, 8];
  expect(await deferred.project(point)).toEqual(engine.project(point));
  const buffer = new Float64Array(point);
  expect(await deferred.projectFlat(buffer, 4)).toBe(buffer);
  expect(Array.from(buffer)).toEqual(engine.project(point));
  const restored = deferred.unprojectFlatSync(buffer, 4);
  expect(restored[0]).toBeCloseTo(12, 10);
  expect(restored[1]).toBeCloseTo(55, 10);
  const created = await ProjectionEngine.create({to: 'EPSG:3857', projections: [lazy]});
  expect(created).toBeInstanceOf(ProjectionEngine);
  expect(created.project(point)).toEqual(engine.project(point));
});
