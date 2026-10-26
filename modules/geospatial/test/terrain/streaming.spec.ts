// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {HeightField, TerrainSampleStatus as Status} from '@math.gl/geospatial/terrain';
import {TiledHeightField, type TerrainTile} from '@math.gl/geospatial/terrain/tiled';
import {
  packTerrainHeightField,
  unpackTerrainHeightField,
  TERRAIN_BUFFER_VERSION
} from '@math.gl/geospatial/terrain/packed';
import type {TileMatrix} from '@math.gl/geospatial/tile-matrix';

const matrix: TileMatrix = {
  id: 'fine',
  resolution: 1,
  origin: [0, 0],
  cornerOfOrigin: 'bottomLeft',
  tileSize: [2, 2],
  matrixSize: [4, 4]
};
function tile(column: number, row: number, value = 10): TerrainTile {
  return {matrixId: 'fine', column, row, heights: new Float64Array(4).fill(value)};
}
function snapshot(tiles: TerrainTile[]) {
  return new TiledHeightField({
    matrixSet: {crs: 'local', matrices: [matrix]},
    tiles,
    revision: 'original',
    diagonal: '10-01',
    heightReference: 'survey'
  });
}

test('tile updates preserve earlier snapshots, source ownership and completed arrival-order independence', () => {
  const initial = snapshot([tile(0, 0)]);
  const addition = tile(1, 0, 30);
  const next = initial.withTiles({revision: 'arrived', tiles: [addition]});
  addition.heights.fill(999);
  expect(initial.tileCount).toBe(1);
  expect(next.tileCount).toBe(2);
  expect(initial.sample(2, 1, {matrixId: 'fine'}).status).toBe(Status.NOT_RESIDENT);
  expect(next.sample(2, 1, {matrixId: 'fine'}).height).toBe(20);
  const reversed = snapshot([tile(1, 0, 30)]).withTiles({revision: 'arrived', tiles: [tile(0, 0)]});
  expect(next.sample(2, 1, {matrixId: 'fine'})).toEqual(reversed.sample(2, 1, {matrixId: 'fine'}));
  expect(next.copyTileHalo('fine', 0, 0)).toEqual(reversed.copyTileHalo('fine', 0, 0));
  const halo = next.copyTileHalo('fine', 0, 0)!;
  expect(halo.diagonal).toBe('10-01');
  expect(halo.heightReference).toBe('survey');
  halo.heights.fill(-999);
  expect(next.sample(2, 1, {matrixId: 'fine'}).height).toBe(20);
});

test('replacement and eviction invalidate only the resident neighboring halos', () => {
  const tiles = Array.from({length: 16}, (_, i) => tile(i % 4, Math.floor(i / 4), i));
  const initial = snapshot(tiles);
  expect(initial.haloChanges).toHaveLength(16);
  const next = initial.withTiles({revision: 'replacement', tiles: [tile(1, 1, 100)]});
  expect(next.haloChanges).toEqual(
    Array.from({length: 9}, (_, i) => ({
      matrixId: 'fine',
      column: i % 3,
      row: Math.floor(i / 3),
      resident: true
    }))
  );
  const removed = next.withTiles({
    revision: 'evicted',
    remove: [{matrixId: 'fine', column: 1, row: 1}]
  });
  expect(removed.haloChanges).toHaveLength(9);
  expect(removed.haloChanges[4]).toEqual({matrixId: 'fine', column: 1, row: 1, resident: false});
  expect(removed.copyTileHalo('fine', 1, 1)).toBeUndefined();
  expect(next.sample(3, 3, {matrixId: 'fine'}).height).toBe(100);
  expect(initial.sample(3, 3, {matrixId: 'fine'}).height).toBe(5);
  expect(removed.sample(3, 3, {matrixId: 'fine'}).status).toBe(Status.NOT_RESIDENT);
  const oldNeighbor = next.copyTileHalo('fine', 0, 0)!;
  const newNeighbor = removed.copyTileHalo('fine', 0, 0)!;
  expect(oldNeighbor.validity.at(-1)).toBe(1);
  expect(newNeighbor.validity.at(-1)).toBe(0);
  expect(Object.isFrozen(removed.haloChanges)).toBe(true);
  expect(Object.isFrozen(removed.haloChanges[0])).toBe(true);
});

test('mixed transactions match a fresh snapshot and reject ambiguous updates atomically', () => {
  const initial = snapshot([tile(0, 0), tile(1, 0), tile(3, 3)]);
  const next = initial.withTiles({
    revision: 'mixed',
    tiles: [tile(0, 0, 80), tile(1, 1, 40)],
    remove: [{matrixId: 'fine', column: 1, row: 0}]
  });
  const fresh = snapshot([tile(0, 0, 80), tile(1, 1, 40), tile(3, 3)]);
  for (const interpolation of ['nearest', 'bilinear', 'triangle'] as const)
    for (let y = 0.5; y <= 7.5; y += 0.5)
      for (let x = 0.5; x <= 7.5; x += 0.5) {
        const a = next.sample(x, y, {matrixId: 'fine', interpolation});
        const b = fresh.sample(x, y, {matrixId: 'fine', interpolation});
        expect({...a, revision: ''}).toEqual({...b, revision: ''});
      }
  for (let row = 0; row < 4; row++)
    for (let column = 0; column < 4; column++) {
      const actual = next.copyTileHalo('fine', column, row);
      const expected = fresh.copyTileHalo('fine', column, row);
      expect(actual ? {...actual, revision: ''} : actual).toEqual(
        expected ? {...expected, revision: ''} : expected
      );
    }
  expect(next.haloChanges.some(change => change.column === 3 && change.row === 3)).toBe(false);
  expect(
    initial.withTiles({revision: 'noop', remove: [{matrixId: 'fine', column: 2, row: 2}]})
      .haloChanges
  ).toEqual([]);
  expect(initial.withTiles({revision: 'noop'}).haloChanges).toEqual([]);
  expect(() => initial.withTiles({revision: 'original'})).toThrow('different revision');
  expect(() => initial.withTiles({revision: 'bad', tiles: [tile(0, 0), tile(0, 0)]})).toThrow(
    'duplicate'
  );
  expect(() =>
    initial.withTiles({revision: 'bad', tiles: [tile(0, 0)], remove: [tile(0, 0)]})
  ).toThrow('conflicting');
  expect(() =>
    initial.withTiles({
      revision: 'bad',
      tiles: [tile(0, 0, 90), {...tile(1, 0), heights: new Float32Array(1)}]
    })
  ).toThrow('buffers');
  expect(() => initial.withTiles({revision: 'bad', remove: [tile(4, 0)]})).toThrow('index');
  expect(initial.sample(1, 1, {matrixId: 'fine'}).height).toBe(10);
});

test('packed terrain has an explicit aligned layout and preserves a quantized CPU surface', () => {
  const field = new HeightField({
    width: 2,
    height: 2,
    heights: new Float64Array([1000000000, 1000000000.25, 1000000000.5, NaN]),
    origin: [10000000, -20000000],
    columnStep: [2, 1],
    rowStep: [-1, 3],
    registration: 'cell',
    diagonal: '10-01',
    heightReference: 'survey'
  });
  const packed = packTerrainHeightField(field, {
    heightOrigin: 1000000000,
    maxBytes: 96,
    maxHeightError: 0
  });
  expect(Array.from(packed.header)).toEqual([TERRAIN_BUFFER_VERSION, 2, 2, 1, 1, 4, 0, 0]);
  expect(Array.from(packed.heights)).toEqual([0, 0.25, 0.5, 0]);
  expect(Array.from(packed.validity)).toEqual([1, 1, 1, 0]);
  expect(packed.header.byteLength).toBe(32);
  expect(packed.transform.byteLength).toBe(32);
  expect(packed.maxHeightError).toBe(0);
  expect(packed.origin).toEqual([10000000, -20000000, 1000000000]);
  const decoded = unpackTerrainHeightField(packed);
  expect(decoded.registration).toBe('cell');
  expect(decoded.diagonal).toBe('10-01');
  expect(decoded.heightReference).toBe('survey');
  expect(decoded.copyData()).toEqual(field.copyData());
  for (const interpolation of ['nearest', 'bilinear', 'triangle'] as const)
    expect(decoded.sample(10000000.75, -19999997, {interpolation})).toEqual(
      field.sample(10000000.75, -19999997, {interpolation})
    );
  packed.heights.fill(42);
  expect(decoded.getHeight(0, 0)).toBe(1000000000);
  expect(field.getHeight(0, 0)).toBe(1000000000);
});

test('packing measures height quantization and enforces memory and numeric budgets', () => {
  const field = new HeightField({
    width: 2,
    height: 2,
    heights: new Float64Array([0.1, -0.1, 1e9 + 0.25, 0])
  });
  const packed = packTerrainHeightField(field);
  expect(packed.maxHeightError).toBe(0.25);
  expect(() => packTerrainHeightField(field, {maxHeightError: 0.1})).toThrow('height error budget');
  expect(() => packTerrainHeightField(field, {maxBytes: 95})).toThrow('byte budget');
  expect(() => packTerrainHeightField(field, {maxBytes: -1})).toThrow('byte budget');
  expect(() => packTerrainHeightField(field, {maxHeightError: NaN})).toThrow('nonnegative');
  expect(() => packTerrainHeightField(field, {heightOrigin: Infinity})).toThrow('finite');
  const huge = new HeightField({width: 2, height: 2, heights: new Float64Array(4).fill(1e100)});
  expect(() => packTerrainHeightField(huge)).toThrow('representable');
  expect(packTerrainHeightField(huge, {heightOrigin: 1e100}).heights).toEqual(new Float32Array(4));
  const collapsed = new HeightField({
    width: 2,
    height: 2,
    heights: new Float32Array(4),
    columnStep: [1, 1],
    rowStep: [1, 1 + 1e-8]
  });
  expect(() => packTerrainHeightField(collapsed)).toThrow('singular');
  const tiny = new HeightField({
    width: 2,
    height: 2,
    heights: new Float32Array(4),
    columnStep: [1e-40, 0]
  });
  expect(() => packTerrainHeightField(tiny)).toThrow('representable');
});

test('transferred payload validation rejects malformed headers, transforms and masks', () => {
  const field = new HeightField({width: 2, height: 2, heights: new Float32Array([0, 1, 2, NaN])});
  for (const mutate of [
    (p: ReturnType<typeof packTerrainHeightField>) => {
      p.header[0] = 999;
    },
    (p: ReturnType<typeof packTerrainHeightField>) => {
      p.header[5] = 3;
    },
    (p: ReturnType<typeof packTerrainHeightField>) => {
      p.header[6] = 1;
    },
    (p: ReturnType<typeof packTerrainHeightField>) => {
      p.transform[4] = 2;
    },
    (p: ReturnType<typeof packTerrainHeightField>) => {
      p.transform[0] = NaN;
    },
    (p: ReturnType<typeof packTerrainHeightField>) => {
      p.validity[0] = 2;
    },
    (p: ReturnType<typeof packTerrainHeightField>) => {
      p.heights[3] = 1;
    },
    (p: ReturnType<typeof packTerrainHeightField>) => {
      p.heights[0] = Infinity;
    },
    (p: ReturnType<typeof packTerrainHeightField>) => {
      p.heights = new Float32Array(3);
    },
    (p: ReturnType<typeof packTerrainHeightField>) => {
      p.origin = [NaN, 0, 0];
    },
    (p: ReturnType<typeof packTerrainHeightField>) => {
      p.maxHeightError = -1;
    }
  ]) {
    const packed = packTerrainHeightField(field);
    mutate(packed);
    expect(() => unpackTerrainHeightField(packed)).toThrow();
  }
});

test('streaming changes drive standalone halo uploads without including untouched tiles', () => {
  const initial = snapshot([tile(0, 0), tile(3, 3)]);
  const next = initial.withTiles({revision: 'upload', tiles: [tile(1, 0, 30)]});
  expect(next.haloChanges).toHaveLength(2);
  for (const change of next.haloChanges) {
    const halo = next.copyTileHalo(change.matrixId, change.column, change.row)!;
    const source = new HeightField(halo);
    const decoded = unpackTerrainHeightField(packTerrainHeightField(source));
    expect(decoded.copyData()).toEqual(source.copyData());
    expect(decoded.diagonal).toBe(source.diagonal);
  }
});

test('snapshot updates do not observe mutations to caller-owned matrix metadata', () => {
  const bands: Array<{coalesce: number; minTileRow: number; maxTileRow: number}> = [];
  const input = {...matrix, origin: [0, 0] as [number, number], variableMatrixWidths: bands};
  const original = new TiledHeightField({
    matrixSet: {crs: 'local', matrices: [input]},
    tiles: [tile(0, 0)],
    revision: 'before'
  });
  input.origin[0] = 999;
  bands.push({coalesce: 2, minTileRow: 0, maxTileRow: 0});
  const next = original.withTiles({revision: 'after', tiles: [tile(1, 0, 30)]});
  expect(next.sample(2, 1, {matrixId: 'fine'}).height).toBe(20);
  expect(original.sample(1, 1, {matrixId: 'fine'}).height).toBe(10);
});

test('packed decoder rejects sparse origins even when all heights are missing', () => {
  const field = new HeightField({
    width: 2,
    height: 2,
    heights: new Float32Array(4),
    validity: new Uint8Array(4)
  });
  for (let axis = 0; axis < 3; axis++) {
    const packed = packTerrainHeightField(field);
    const origin = [0, 0, 0];
    delete origin[axis];
    packed.origin = origin as [number, number, number];
    expect(() => unpackTerrainHeightField(packed)).toThrow('host metadata');
  }
});
