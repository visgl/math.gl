// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {createProjectionEngine, createProjectionDescriptor} from '@math.gl/projection/core';
import {mercator, universalTransverseMercator, projectionEngine} from '@math.gl/projection';
import type {ProjectionEngine} from '../../src/types';

test('one engine creates independent CRS pairs and has no coordinate methods', async () => {
  const engine: ProjectionEngine = projectionEngine;
  const web = engine.createProjection({to: 'EPSG:3857'});
  const utm = engine.createProjection({to: 'EPSG:32631'});
  const point = [12, 55, 123];
  const expected = await web.project(point);
  expect(await utm.project(point)).not.toEqual(expected);
  expect(await web.project(point)).toEqual(expected);
  expect((await web.unproject(expected))[0]).toBeCloseTo(12, 10);
  expect((await web.unproject(expected))[1]).toBeCloseTo(55, 10);
  expect(engine).not.toHaveProperty('project');
  expect(engine.createProjection()).not.toBe(engine.createProjection());
});

test('engines snapshot registrations and aliases and keep configurations isolated', () => {
  const plugins = [mercator];
  const aliases = {local: 'EPSG:3857'};
  const engine = createProjectionEngine({projections: plugins, aliases});
  plugins.length = 0;
  aliases.local = 'WGS84';
  expect(engine.createProjection({to: 'local'}).project([12, 55])).not.toEqual([12, 55]);
  expect(() => createProjectionEngine().createProjection({to: 'local'})).toThrow();
  expect(() => engine.createProjection({to: 'EPSG:32631'})).toThrow();
});

test('lazy factory construction loads nothing and shares only required descriptor loads', async () => {
  let imports = 0;
  let unused = 0;
  const descriptor = createProjectionDescriptor({name: 'merc'}, async () => {
    imports++;
    return mercator;
  });
  const other = createProjectionDescriptor({name: 'utm'}, async () => {
    unused++;
    return universalTransverseMercator;
  });
  const engine = createProjectionEngine({projections: [descriptor, other]});
  const first = engine.createProjection({to: 'EPSG:3857'});
  const second = engine.createProjection({to: 'EPSG:3857'});
  expect(imports).toBe(0);
  const [a, b] = await Promise.all([first.project([12, 55]), second.project([12, 55])]);
  expect(a).toEqual(b);
  expect(imports).toBe(1);
  expect(unused).toBe(0);
  const sync = await engine.createProjectionAsync({to: 'EPSG:3857'});
  expect(sync.project([12, 55])).toEqual(a);
  expect(imports).toBe(1);
  expect(unused).toBe(0);
});

import {CRSProjectionEngine, CustomProjectionEngine} from '@math.gl/projection';
test('all concrete engines implement the shared contract and lazy engines offer deferred and ready projections', async () => {
  const engines: ProjectionEngine[] = [
    new CustomProjectionEngine({projections: [mercator]}),
    new CRSProjectionEngine(),
    new LazyCRSProjectionEngine()
  ];
  const expected = projectionEngine.createProjection({to: 'EPSG:3857'}).projectSync([12, 55]);
  for (const engine of engines) {
    const projection = await engine.createProjectionAsync({to: 'EPSG:3857'});
    expect(projection.project([12, 55])).toEqual(expected);
  }
  const lazy = new LazyCRSProjectionEngine();
  const deferred = lazy.createProjection({to: 'EPSG:3857'});
  expect(deferred).not.toBeInstanceOf(Promise);
  await deferred.preload();
  expect(deferred.projectSync([12, 55])).toEqual(expected);
  const utm = await lazy.createProjectionAsync({to: 'EPSG:32631'});
  expect(utm.unproject(utm.project([12, 55]))[0]).toBeCloseTo(12, 10);
  const oblique = await lazy.createProjectionAsync({
    to: '+proj=ob_tran +o_proj=moll +o_lat_p=45 +o_lon_p=0'
  });
  expect(oblique.project([12, 55]).every(Number.isFinite)).toBe(true);
});

import {LazyCRSProjectionEngine} from '@math.gl/projection/projections/lazy';
