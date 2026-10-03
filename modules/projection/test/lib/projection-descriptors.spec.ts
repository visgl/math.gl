// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test, vi} from 'vitest';
import {ProjectionEngine, createProjectionDescriptor, mercator} from '@math.gl/projection';
import {lazyUniversalTransverseMercator} from '../../src/experimental/lazy-projections/utm';
import {lazyMollweide} from '../../src/experimental/lazy-projections/moll';
import {lazyObliqueTransformation} from '../../src/experimental/lazy-projections/ob_tran';

test('descriptors load only the algorithms requested by either CRS', async () => {
  const load = vi.fn(async () => mercator);
  const descriptor = createProjectionDescriptor({name: 'merc'}, load);
  const unused = createProjectionDescriptor(
    {name: 'unused'},
    vi.fn(async () => {
      throw new Error('not requested');
    })
  );
  const geographic = await ProjectionEngine.create({projections: [descriptor, unused]});
  expect(geographic.project([12, 45])).toEqual([12, 45]);
  expect(load).not.toHaveBeenCalled();
  const p = await ProjectionEngine.create({
    from: 'EPSG:3857',
    to: 'EPSG:32631',
    projections: [descriptor, lazyUniversalTransverseMercator, unused]
  });
  expect(load).toHaveBeenCalledTimes(1);
  const result = p.project([333958.4723798207, 0]);
  expect(result[0]).toBeCloseTo(500000, 7);
  expect(result[1]).toBeCloseTo(0, 7);
  expect(p.projectFlat(new Float64Array([333958.4723798207, 0]))[0]).toBeCloseTo(500000, 7);
});

test('preload and concurrent construction share a successful request', async () => {
  const load = vi.fn(async () => mercator);
  const loader = createProjectionDescriptor({name: 'merc'}, load);
  const [plugin, p, q] = await Promise.all([
    loader.preload(),
    ProjectionEngine.create({to: 'EPSG:3857', projections: [loader]}),
    ProjectionEngine.create({from: 'EPSG:3857', projections: [loader]})
  ]);
  expect(plugin).toBe(mercator);
  expect(load).toHaveBeenCalledTimes(1);
  expect(q.project(p.project([3, 45]))[0]).toBeCloseTo(3, 10);
  await loader.preload();
  expect(load).toHaveBeenCalledTimes(1);
});

test('rejected imports retry and metadata mismatches reject explicitly', async () => {
  let calls = 0;
  const loader = createProjectionDescriptor({name: 'merc'}, async () => {
    if (++calls === 1) throw new Error('temporary load failure');
    return mercator;
  });
  const options = {to: 'EPSG:3857', projections: [loader]};
  await expect(ProjectionEngine.create(options)).rejects.toThrow('temporary load failure');
  expect((await ProjectionEngine.create(options)).project([0, 0])).toEqual([0, 0]);
  const wrong = {name: 'utm', preload: async () => mercator};
  await expect(ProjectionEngine.create({to: 'EPSG:32631', projections: [wrong]})).rejects.toThrow(
    'does not match'
  );
  const wrongCached = createProjectionDescriptor({name: 'utm'}, async () => mercator);
  await expect(wrongCached.preload()).rejects.toThrow('does not match');
  await expect(
    ProjectionEngine.create({to: 'EPSG:3857', projections: [mercator, loader]})
  ).rejects.toThrow('Duplicate');
  await expect(ProjectionEngine.create({to: 'EPSG:32631', projections: [loader]})).rejects.toThrow(
    'not registered'
  );
});

test('descriptors coexist with eager plugins and alias definitions', async () => {
  const p = await ProjectionEngine.create({
    to: 'APP:UTM',
    aliases: {'APP:UTM': 'EPSG:32631'},
    projections: [mercator, lazyUniversalTransverseMercator]
  });
  expect(p.project([3, 0])[0]).toBeCloseTo(500000, 7);
  const eager = await ProjectionEngine.create({to: 'EPSG:3857', projections: [mercator]});
  expect(eager.project([0, 0])).toEqual([0, 0]);
});

test('oblique descriptors also defer their child plugin', async () => {
  const p = await ProjectionEngine.create({
    to: '+proj=ob_tran +o_proj=moll +o_lat_p=45 +o_lon_p=0',
    projections: [lazyObliqueTransformation(lazyMollweide)]
  });
  const output = p.unproject(p.project([3, 30]));
  expect(output[0]).toBeCloseTo(3, 7);
  expect(output[1]).toBeCloseTo(30, 7);
  const rotated = await ProjectionEngine.create({
    to: '+proj=ob_tran +o_proj=longlat +o_lat_p=45 +o_lon_p=0',
    projections: [lazyObliqueTransformation('longlat')]
  });
  expect(rotated.project([3, 30]).every(Number.isFinite)).toBe(true);
});

test('constructor accepts descriptors and coordinate methods trigger the first import', async () => {
  const load = vi.fn(async () => mercator);
  const descriptor = createProjectionDescriptor({name: 'merc'}, load);
  const unused = createProjectionDescriptor({name: 'unused'}, async () => {
    throw new Error('unused');
  });
  const p = new ProjectionEngine({to: 'EPSG:3857', projections: [descriptor, unused]});
  expect(load).not.toHaveBeenCalled();
  const source = [3, 45];
  const projected: Promise<number[]> = p.project(source);
  source[0] = 99;
  const result = await projected;
  const inverse = p.unproject;
  expect((await inverse(result))[0]).toBeCloseTo(3, 10);
  expect(load).toHaveBeenCalledTimes(1);
  const buffer = new Float32Array([3, 45]);
  const batch: Promise<Float32Array> = p.projectFlat(buffer);
  expect(await batch).toBe(buffer);
  expect(await p.unprojectFlat(buffer)).toBe(buffer);
  expect(buffer[0]).toBeCloseTo(3, 5);
  await p.preload();
  expect(load).toHaveBeenCalledTimes(1);
});

test('eager methods remain synchronous and lazy failures leave buffers untouched', async () => {
  const eager = new ProjectionEngine({to: 'EPSG:3857', projections: [mercator]});
  const result: number[] = eager.project([0, 0]);
  expect(result).toEqual([0, 0]);
  await eager.preload();
  let calls = 0;
  const retry = createProjectionDescriptor({name: 'merc'}, async () => {
    if (++calls === 1) throw new Error('offline');
    return mercator;
  });
  const p = new ProjectionEngine({to: 'EPSG:3857', projections: [retry]});
  const buffer = new Float64Array([3, 45]);
  await expect(p.projectFlat(buffer)).rejects.toThrow('offline');
  expect(Array.from(buffer)).toEqual([3, 45]);
  expect(await p.projectFlat(buffer)).toBe(buffer);
  expect(calls).toBe(2);
});

test('sync calls use the shared descriptor cache without starting imports', async () => {
  const load = vi.fn(async () => mercator);
  const descriptor = createProjectionDescriptor({name: 'merc'}, load);
  const p = new ProjectionEngine({to: 'EPSG:3857', projections: [descriptor]});
  const buffer = new Float64Array([3, 45]);
  expect(() => p.projectSync([3, 45])).toThrow('preload');
  expect(() => p.projectFlatSync(buffer)).toThrow('preload');
  expect(Array.from(buffer)).toEqual([3, 45]);
  expect(load).not.toHaveBeenCalled();
  await descriptor.preload();
  const sync = p.projectSync;
  const output: number[] = sync([3, 45]);
  expect(p.unprojectSync(output)[0]).toBeCloseTo(3, 10);
  expect(p.projectFlatSync(buffer)).toBe(buffer);
  expect(p.unprojectFlatSync(buffer)).toBe(buffer);
  expect(buffer[0]).toBeCloseTo(3, 10);
  const q = new ProjectionEngine({to: 'EPSG:3857', projections: [descriptor]});
  expect(q.projectSync([3, 45])).toEqual(output);
  expect(load).toHaveBeenCalledTimes(1);
});

test('pending loads are unavailable to sync callers and descriptor identities stay isolated', async () => {
  let resolve!: (plugin: typeof mercator) => void;
  const load = vi.fn(
    () =>
      new Promise<typeof mercator>(done => {
        resolve = done;
      })
  );
  const descriptor = createProjectionDescriptor({name: 'merc'}, load);
  const other = createProjectionDescriptor({name: 'merc'}, async () => mercator);
  const p = new ProjectionEngine({to: 'EPSG:3857', projections: [descriptor]});
  const q = new ProjectionEngine({to: 'EPSG:3857', projections: [other]});
  const pending = p.preload();
  await Promise.resolve();
  expect(() => p.projectSync([3, 45])).toThrow('preload');
  expect(() => q.projectSync([3, 45])).toThrow('preload');
  resolve(mercator);
  await pending;
  expect(p.projectSync([3, 45])).toEqual(await p.project([3, 45]));
  expect(() => q.projectSync([3, 45])).toThrow('preload');
  expect(load).toHaveBeenCalledTimes(1);
});
