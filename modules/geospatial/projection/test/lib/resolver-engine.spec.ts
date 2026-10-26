// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {createCRSResolver, createCRSDictionaryProvider} from '@math.gl/geospatial/crs/resolver';
import {createSpatialReference} from '@math.gl/geospatial/crs';
import {FullProjectionEngine} from '@math.gl/geospatial/projection';
import {ConfigurableProjectionEngine} from '@math.gl/geospatial/projection/core';
import {LazyProjectionEngine} from '@math.gl/geospatial/projection/projections/lazy';
import {mercator} from '@math.gl/geospatial/projection/projections/merc';

const geographic = '+proj=longlat +datum=WGS84';
const projected = '+proj=merc +a=6378137 +b=6378137 +nadgrids=@null +units=m';
const makeResolver = (target = projected) =>
  createCRSResolver({
    providers: [createCRSDictionaryProvider({'APP:source': geographic, 'APP:target': target})]
  });

describe('native engines with optional CRS resolution', () => {
  test('honors reference representations during preparation', async () => {
    const calls: string[] = [];
    const resolver = createCRSResolver({
      providers: [
        {
          id: 'app',
          resolve(id) {
            calls.push(id);
            return projected;
          }
        }
      ]
    });
    const engine = new FullProjectionEngine({resolver});
    const transform = await engine.createProjectionAsync({
      to: {
        state: 'explicit',
        definition: 'APP:custom/name',
        provenance: 'metadata',
        representation: 'identifier'
      }
    });
    expect(transform.project([12, 0])[0]).toBeCloseTo((6378137 * Math.PI) / 15, 6);
    await expect(
      engine.createProjectionAsync({
        to: {
          state: 'explicit',
          definition: 'opaque',
          provenance: 'metadata',
          representation: 'opaque'
        }
      })
    ).rejects.toThrow();
    expect(calls).toEqual(['APP:custom/name']);
  });

  test.each(['full', 'configurable', 'lazy'])(
    '%s prepares both endpoints and synchronous descriptor converters',
    async kind => {
      const resolver = makeResolver();
      const engine =
        kind === 'full'
          ? new FullProjectionEngine({resolver})
          : kind === 'lazy'
            ? new LazyProjectionEngine({resolver})
            : new ConfigurableProjectionEngine({resolver, projections: [mercator]});
      const transform = await engine.createProjectionAsync({from: 'APP:source', to: 'APP:target'});
      const point = transform.project([12, 0, 123, 8]);
      expect(point[0]).toBeCloseTo((6378137 * Math.PI) / 15, 6);
      expect(point[1]).toBeCloseTo(0, 6);
      expect(point.slice(2)).toEqual([123, 8]);
      expect(transform.unproject(point)[0]).toBeCloseTo(12, 10);
      const descriptor = await engine.getCRS('APP:target', {converters: ['APP:source']});
      expect(descriptor.converter['APP:source'].from([12, 0, 123, 8])).toEqual(point);
      expect(descriptor.converter.WGS84.to(point)[0]).toBeCloseTo(12, 10);
      expect(descriptor.getRenderingScale(point)).not.toBeNull();
    }
  );

  test('local aliases and built-in identifiers precede providers', async () => {
    const calls: string[] = [];
    const resolver = createCRSResolver({
      providers: [
        {
          id: 'external',
          resolve(id) {
            calls.push(id);
            return id === 'APP:external' ? projected : null;
          }
        }
      ]
    });
    const engine = new FullProjectionEngine({
      resolver,
      aliases: {
        'APP:local': geographic,
        'APP:chain': 'APP:external',
        'EPSG:3857': geographic
      }
    });
    await engine.createProjectionAsync({from: 'APP:local', to: 'EPSG:3857'});
    await engine.createProjectionAsync({from: 'EPSG:4326', to: 'EPSG:32631'});
    expect(calls).toEqual([]);
    await engine.createProjectionAsync({to: 'APP:chain'});
    expect(calls).toEqual(['APP:external']);
  });

  test('sync creation never initiates lookup, even after async preparation', async () => {
    let calls = 0;
    const resolver = createCRSResolver({
      providers: [
        {
          id: 'p',
          resolve() {
            calls++;
            return projected;
          }
        }
      ]
    });
    const engine = new FullProjectionEngine({resolver});
    expect(() => engine.createProjection({to: 'APP:target'})).toThrow('createProjectionAsync');
    expect(calls).toBe(0);
    const ready = await engine.createProjectionAsync({to: 'APP:target'});
    expect(ready.project([0, 0])[0]).toBe(0);
    expect(() => engine.createProjection({to: 'APP:target'})).toThrow('createProjectionAsync');
    expect(calls).toBe(1);
    expect(engine.createProjection({to: 'EPSG:3857'}).project([0, 0])[0]).toBe(0);
  });

  test('preserves explicit stored order, height and measures', async () => {
    const source = createSpatialReference({
      crs: {
        state: 'explicit',
        definition: 'APP:source',
        representation: 'identifier',
        provenance: 'metadata'
      },
      coordinateFrame: 'geographic',
      coordinateOrder: ['latitude', 'longitude', 'height', 'measure'],
      units: ['degree', 'degree', 'm']
    });
    const engine = new FullProjectionEngine({resolver: makeResolver()});
    const transform = await engine.createProjectionAsync({from: source, to: 'APP:target'});
    expect(transform.project([0, 12, 20, 99])).toEqual(
      engine.createProjection({to: projected}).project([12, 0, 20, 99])
    );
  });

  test('captures both endpoint metadata before an asynchronous lookup', async () => {
    let release!: () => void;
    const wait = new Promise<void>(resolve => {
      release = resolve;
    });
    const resolver = createCRSResolver({
      providers: [
        {
          id: 'p',
          async resolve(id) {
            await wait;
            return id === 'APP:source' ? geographic : projected;
          }
        }
      ]
    });
    const to = {
      state: 'explicit' as const,
      definition: 'APP:target',
      representation: 'identifier' as const,
      provenance: 'metadata' as const
    };
    const pending = new FullProjectionEngine({resolver}).createProjectionAsync({
      from: 'APP:source',
      to
    });
    to.definition = geographic;
    release();
    expect((await pending).project([12, 0])[0]).toBeCloseTo((6378137 * Math.PI) / 15, 6);
  });

  test('preserves failures for epochs, vertical CRS, unknown references and unsupported operations', async () => {
    const resolver = makeResolver('+proj=unimplemented');
    const engine = new FullProjectionEngine({resolver});
    await expect(engine.createProjectionAsync({to: 'APP:missing'})).rejects.toMatchObject({
      reason: 'not-found'
    });
    await expect(engine.createProjectionAsync({to: 'APP:target'})).rejects.toMatchObject({
      reason: 'missing-plugin'
    });
    const source = createSpatialReference({
      crs: {
        state: 'explicit',
        definition: 'APP:source',
        representation: 'identifier',
        provenance: 'metadata'
      }
    });
    await expect(
      engine.createProjectionAsync({from: {...source, coordinateEpoch: 2020}})
    ).rejects.toThrow('epoch');
    const vertical = {
      ...source,
      vertical: {
        state: 'explicit' as const,
        definition: 'EPSG:5703',
        representation: 'identifier' as const,
        provenance: 'metadata' as const
      }
    };
    await expect(engine.createProjectionAsync({from: vertical})).rejects.toThrow('vertical');
    expect((await engine.createProjectionAsync({from: vertical, mode: 'horizontal'})).lossy).toBe(
      true
    );
    await expect(engine.getCRS({state: 'unknown', provenance: 'metadata'})).rejects.toThrow(
      'unknown CRS'
    );
  });

  test('does not use a resolver to recover malformed definitions or parser failures', async () => {
    let calls = 0;
    const resolver = createCRSResolver({
      providers: [
        {
          id: 'p',
          resolve() {
            calls++;
            return geographic;
          }
        }
      ]
    });
    const engine = new FullProjectionEngine({resolver});
    await expect(engine.createProjectionAsync({to: '+proj=merc +proj=merc'})).rejects.toThrow(
      'Duplicate'
    );
    await expect(engine.getCRS('GEOGCRS[broken')).rejects.toThrow();
    const parsed = new ConfigurableProjectionEngine({
      resolver,
      parsers: [
        {
          name: 'custom',
          canParse: d => d === 'APP:custom',
          parse: () => ({parameters: {proj: 'longlat'}})
        }
      ]
    });
    await parsed.createProjectionAsync({to: 'APP:custom'});
    expect(calls).toBe(0);
  });

  test('engine-specific resolution changes descriptor signatures and never shares converters', async () => {
    const first = new FullProjectionEngine({resolver: makeResolver()});
    const second = new FullProjectionEngine({resolver: makeResolver(projected + ' +x_0=1000')});
    const [a, b] = await Promise.all([first.getCRS('APP:target'), second.getCRS('APP:target')]);
    expect(a.signature).not.toBe(b.signature);
    expect(a.converter.WGS84.from([0, 0])[0]).toBe(0);
    expect(b.converter.WGS84.from([0, 0])[0]).toBe(1000);
  });
});
