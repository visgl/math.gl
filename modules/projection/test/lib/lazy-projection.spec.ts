// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {Projection, getLoadedProjection} from '@math.gl/projection';
import {
  lazyUniversalTransverseMercator,
  lazyCassiniSoldner
} from '../../src/experimental/lazy-projections';
import {LazyProjection} from '@math.gl/projection/projections/lazy';
import cases from '../fixtures/native-proj-cases.json';

test('automatic catalogue defers algorithms and loads only the requested projection', async () => {
  expect(getLoadedProjection(lazyUniversalTransverseMercator)).toBeUndefined();
  const projection = new LazyProjection({to: 'EPSG:32631'});
  expect(getLoadedProjection(lazyUniversalTransverseMercator)).toBeUndefined();
  expect(() => projection.projectSync([3, 0])).toThrow('preload');
  const project = projection.project;
  const xy: Promise<number[]> = project([3, 0]);
  expect((await xy)[0]).toBeCloseTo(500000, 7);
  expect(getLoadedProjection(lazyUniversalTransverseMercator)?.name).toBe('utm');
  expect(getLoadedProjection(lazyCassiniSoldner)).toBeUndefined();
  expect(projection.projectSync([3, 0])).toEqual(await xy);
  const flat = new Float64Array([3, 0]);
  expect(await projection.projectFlat(flat)).toBe(flat);
  expect(projection.unprojectFlatSync(flat)).toBe(flat);
  expect(flat[0]).toBeCloseTo(3, 10);
  const created = await LazyProjection.create({to: 'EPSG:3857'});
  expect(created.project([0, 0])).toEqual([0, 0]);
  expect(await new LazyProjection().project([3, 45])).toEqual([3, 45]);
});

test('automatic catalogue supports every independently qualified configuration', async () => {
  for (const row of cases.cases) {
    const lazy = new LazyProjection({to: row.definition});
    const eager = new Projection({to: row.definition});
    const point = row.points[0];
    expect(await lazy.project(point), row.id).toEqual(eager.project(point));
  }
});

test('automatic oblique projections resolve different children at each endpoint', async () => {
  const options = {
    from: '+proj=ob_tran +o_proj=merc +o_lat_p=45 +o_lon_p=0',
    to: '+proj=ob_tran +o_proj=eqearth +o_lat_p=35 +o_lon_p=10'
  };
  const eager = new Projection(options);
  const lazy = new LazyProjection(options);
  const point = new Projection({to: options.from}).project([3, 30]);
  await lazy.preload();
  expect(lazy.projectSync(point)).toEqual(eager.project(point));
  expect(await lazy.unproject(eager.project(point))).toEqual(eager.unproject(eager.project(point)));
  expect(() => new LazyProjection({to: '+proj=ob_tran +o_lat_p=45 +o_lon_p=0'})).toThrow('o_proj');
  expect(
    () => new LazyProjection({to: '+proj=ob_tran +o_proj=missing +o_lat_p=45 +o_lon_p=0'})
  ).toThrow('Unknown');
});
