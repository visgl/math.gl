// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {createSpatialReference} from '@math.gl/geospatial/crs';
import {
  createCRSResolver,
  createCRSDictionaryProvider,
  CRSResolutionError
} from '@math.gl/geospatial/crs/resolver';
import type {ReadonlyCRSDefinition} from '@math.gl/geospatial/crs';
import {wgs84GeographicCRS} from './projjson-fixtures';

const WGS84 = '+proj=longlat +datum=WGS84';

describe('opt-in CRS resolver', () => {
  test('honors declared representations instead of inferring them again', async () => {
    const resolver = createCRSResolver({
      providers: [createCRSDictionaryProvider({'APP:custom/name': WGS84, opaque: WGS84})]
    });
    const identifier = {
      state: 'explicit',
      definition: 'APP:custom/name',
      representation: 'identifier'
    } as const;
    expect((await resolver.resolve(identifier)).input).toMatchObject({definition: WGS84});
    const opaque = {state: 'explicit', definition: 'opaque', representation: 'opaque'} as const;
    expect(await resolver.resolve(opaque)).toEqual({input: opaque, lookups: []});
  });

  test('counts alias hops independently of the initial lookup', async () => {
    const providers = [createCRSDictionaryProvider({A: 'B', B: WGS84})];
    expect((await createCRSResolver({providers, maxDepth: 1}).resolve('A')).input).toBe(WGS84);
    expect((await createCRSResolver({providers, maxDepth: 0}).resolve('B')).input).toBe(WGS84);
    await expect(createCRSResolver({providers, maxDepth: 0}).resolve('A')).rejects.toMatchObject({
      reason: 'limit'
    });
  });

  test('resolves aliases in provider order and retains lookup provenance', async () => {
    const resolver = createCRSResolver({
      providers: [
        createCRSDictionaryProvider({CUSTOM: 'EPSG:4326'}, {id: 'app'}),
        createCRSDictionaryProvider({'EPSG:4326': WGS84}, {id: 'registry', version: '2026'})
      ]
    });
    expect(await resolver.resolve('CUSTOM')).toEqual({
      input: WGS84,
      lookups: [
        {identifier: 'CUSTOM', provider: 'app', version: undefined},
        {identifier: 'EPSG:4326', provider: 'registry', version: '2026'}
      ]
    });
    const preferred = createCRSResolver({
      providers: [
        createCRSDictionaryProvider({A: WGS84}, {id: 'first'}),
        createCRSDictionaryProvider({A: '+proj=merc'}, {id: 'second'})
      ]
    });
    expect((await preferred.resolve('A')).input).toBe(WGS84);
  });

  test('snapshots dictionary definitions and freezes resolved results', async () => {
    const definitions: Record<string, ReadonlyCRSDefinition> = {A: {...wgs84GeographicCRS}};
    const provider = createCRSDictionaryProvider(definitions);
    definitions.A = '+proj=merc';
    const result = await createCRSResolver({providers: [provider]}).resolve('A');
    expect(result.input).toEqual(wgs84GeographicCRS);
    expect(Object.isFrozen(result.input)).toBe(true);
    expect(Object.isFrozen(result.lookups[0])).toBe(true);
    expect(Object.isFrozen(result)).toBe(true);
  });

  test('does not look up full definitions or interpret malformed syntax', async () => {
    const resolver = createCRSResolver({
      providers: [
        {
          id: 'unused',
          resolve() {
            throw new Error('called');
          }
        }
      ]
    });
    for (const input of [WGS84, 'GEOGCRS[invalid', wgs84GeographicCRS, 'opaque vendor text']) {
      expect(await resolver.resolve(input)).toEqual({input, lookups: []});
    }
  });

  test('snapshots storage conventions and resolves horizontal and vertical references', async () => {
    let release!: () => void;
    const wait = new Promise<void>(resolve => {
      release = resolve;
    });
    const provider = {
      id: 'remote',
      async resolve(id: string) {
        await wait;
        return id === 'EPSG:4326' ? WGS84 : 'VERTCRS["height"]';
      }
    };
    const source = {
      ...createSpatialReference({
        crs: {
          state: 'explicit',
          definition: 'EPSG:4326',
          representation: 'identifier',
          provenance: 'metadata'
        },
        vertical: {
          state: 'default',
          definition: 'EPSG:5703',
          representation: 'identifier',
          provenance: 'format-default'
        },
        coordinateFrame: 'geographic',
        coordinateEpoch: 2020.5,
        coordinateOrder: ['latitude', 'longitude', 'height'],
        units: ['degree', 'degree', 'm']
      }),
      coordinateOrder: ['latitude', 'longitude', 'height']
    };
    const pending = createCRSResolver({providers: [provider]}).resolve(source);
    source.coordinateOrder[0] = 'changed';
    release();
    const result = await pending;
    expect(result.input).toMatchObject({
      coordinateEpoch: 2020.5,
      coordinateOrder: ['latitude', 'longitude', 'height'],
      units: ['degree', 'degree', 'm'],
      coordinateFrame: 'geographic',
      crs: {
        state: 'explicit',
        definition: WGS84,
        provenance: 'metadata',
        alternatives: [{definition: 'EPSG:4326', representation: 'identifier'}]
      },
      vertical: {state: 'default', definition: 'VERTCRS["height"]', provenance: 'format-default'}
    });
    expect(result.lookups).toHaveLength(2);
  });

  test('preserves unknown, absent, defaults and existing alternative representations', async () => {
    const resolver = createCRSResolver({providers: [createCRSDictionaryProvider({A: WGS84})]});
    for (const state of ['unknown', 'absent'] as const) {
      const input = {state, provenance: 'metadata' as const};
      expect(await resolver.resolve(input)).toEqual({input, lookups: []});
    }
    const result = await resolver.resolve({
      state: 'default',
      definition: 'A',
      representation: 'identifier',
      provenance: 'format-default',
      alternatives: [{definition: 'GEOGCRS["WGS84"]', representation: 'wkt'}]
    });
    expect(result.input).toMatchObject({
      state: 'default',
      alternatives: [
        {definition: 'A', representation: 'identifier'},
        {definition: 'GEOGCRS["WGS84"]', representation: 'wkt'}
      ]
    });
    const full = {
      state: 'explicit' as const,
      definition: WGS84,
      representation: 'proj-string' as const,
      provenance: 'metadata' as const
    };
    expect((await resolver.resolve(full)).input).toEqual(full);
  });

  test('deduplicates pending calls, caches successes, and clears explicitly', async () => {
    let calls = 0;
    const resolver = createCRSResolver({
      providers: [
        {
          id: 'p',
          async resolve() {
            calls++;
            return WGS84;
          }
        }
      ]
    });
    await Promise.all([resolver.resolve('A'), resolver.resolve('A')]);
    await resolver.resolve('A');
    expect(calls).toBe(1);
    resolver.clear();
    await resolver.resolve('A');
    expect(calls).toBe(2);
  });

  test('bounds the LRU cache and permits disabling it', async () => {
    let calls = 0;
    const provider = {
      id: 'p',
      resolve() {
        calls++;
        return WGS84;
      }
    };
    const resolver = createCRSResolver({providers: [provider], maxCacheSize: 2});
    for (const key of ['A', 'B', 'A', 'C', 'A', 'B']) await resolver.resolve(key);
    expect(calls).toBe(4);
    const uncached = createCRSResolver({providers: [provider], maxCacheSize: 0});
    await uncached.resolve('A');
    await uncached.resolve('A');
    expect(calls).toBe(6);
  });

  test('retries rejected lookups without swallowing provider errors', async () => {
    let calls = 0;
    const failure = new Error('offline');
    const resolver = createCRSResolver({
      providers: [
        {
          id: 'p',
          resolve() {
            if (++calls === 1) throw failure;
            return WGS84;
          }
        }
      ]
    });
    await expect(resolver.resolve('A')).rejects.toBe(failure);
    expect((await resolver.resolve('A')).input).toBe(WGS84);
  });

  test('a cleared pending request cannot evict its replacement after failure', async () => {
    let reject!: (error: Error) => void;
    let calls = 0;
    const resolver = createCRSResolver({
      providers: [
        {
          id: 'p',
          resolve() {
            return ++calls === 1
              ? new Promise<string>((_, fail) => {
                  reject = fail;
                })
              : WGS84;
          }
        }
      ]
    });
    const first = resolver.resolve('A');
    resolver.clear();
    await resolver.resolve('A');
    reject(new Error('old failure'));
    await expect(first).rejects.toThrow('old failure');
    await resolver.resolve('A');
    expect(calls).toBe(2);
  });

  test.each([
    [{}, 'not-found', 16],
    [{A: 'B', B: 'A'}, 'cycle', 16],
    [{A: 'B', B: 'C', C: WGS84}, 'limit', 1]
  ] as const)(
    'reports missing, circular and excessive alias chains',
    async (entries, reason, maxDepth) => {
      const resolver = createCRSResolver({
        providers: [createCRSDictionaryProvider(entries)],
        maxDepth
      });
      await expect(resolver.resolve('A')).rejects.toMatchObject({
        name: 'CRSResolutionError',
        reason
      });
    }
  );

  test('rejects invalid provider output and configuration', async () => {
    for (const output of ['', undefined, [], {}]) {
      const resolver = createCRSResolver({
        providers: [{id: 'bad', resolve: () => output as never}]
      });
      await expect(resolver.resolve('A')).rejects.toBeInstanceOf(CRSResolutionError);
    }
    for (const options of [{maxCacheSize: -1}, {maxDepth: -1}, {maxDepth: 1.5}]) {
      expect(() => createCRSResolver({providers: [], ...options})).toThrow(RangeError);
    }
    expect(() => createCRSResolver({providers: [{id: '', resolve: () => null}]})).toThrow();
    expect(() =>
      createCRSResolver({
        providers: [createCRSDictionaryProvider({}), createCRSDictionaryProvider({})]
      })
    ).toThrow('unique');
  });
});
