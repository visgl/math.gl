// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {HeightField, TerrainSampleStatus as Status} from '@math.gl/geospatial/terrain';
import {GeographicHeightField} from '@math.gl/geospatial/terrain/geographic';
import {TiledHeightField, type TerrainTile} from '@math.gl/geospatial/terrain/tiled';
import type {TileMatrix} from '@math.gl/geospatial/tile-matrix';

const fine: TileMatrix = {
  id: 'fine',
  resolution: 2,
  resolutionY: 3,
  origin: [10, 20],
  cornerOfOrigin: 'topLeft',
  tileSize: [2, 2],
  matrixSize: [2, 2]
};
const coarse: TileMatrix = {
  ...fine,
  id: 'coarse',
  resolution: 4,
  resolutionY: 6,
  matrixSize: [1, 1]
};
function tiles(matrix = fine): TerrainTile[] {
  const result: TerrainTile[] = [];
  for (let row = 0; row < matrix.matrixSize[1]; row++)
    for (let column = 0; column < matrix.matrixSize[0]; column++) {
      const heights = new Float64Array(matrix.tileSize[0] * matrix.tileSize[1]);
      for (let y = 0; y < matrix.tileSize[1]; y++)
        for (let x = 0; x < matrix.tileSize[0]; x++) {
          const wx = matrix.origin[0] + (column * matrix.tileSize[0] + x + 0.5) * matrix.resolution;
          const wy =
            matrix.origin[1] +
            (row * matrix.tileSize[1] + y + 0.5) *
              (matrix.resolutionY ?? matrix.resolution) *
              (matrix.cornerOfOrigin === 'topLeft' ? -1 : 1);
          heights[y * matrix.tileSize[0] + x] = 2 * wx - 3 * wy + 5;
        }
      result.push({matrixId: matrix.id, column, row, heights});
    }
  return result;
}
function snapshot(input = tiles(), matrices = [fine, coarse]) {
  return new TiledHeightField({
    matrixSet: {crs: 'local-meters', matrices},
    tiles: input,
    revision: 'r1'
  });
}

test('tiled halos match a monolithic field at seams and outer centers for all interpolators', () => {
  const source = tiles();
  const field = snapshot(source);
  const heights = new Float64Array(16);
  for (let row = 0; row < 4; row++)
    for (let column = 0; column < 4; column++)
      heights[row * 4 + column] = 2 * (11 + column * 2) - 3 * (18.5 - row * 3) + 5;
  const reference = new HeightField({
    width: 4,
    height: 4,
    heights,
    origin: [10, 20],
    columnStep: [2, 0],
    rowStep: [0, -3],
    registration: 'cell'
  });
  for (const interpolation of ['nearest', 'bilinear', 'triangle'] as const)
    for (const x of [11, 13.9, 14, 14.1, 17])
      for (const y of [18.5, 14.1, 14, 13.9, 9.5]) {
        const sample = field.sample(x, y, {matrixId: 'fine', interpolation});
        const expected = reference.sample(x, y, {interpolation});
        for (const key of [
          'height',
          'gradientX',
          'gradientY',
          'normalX',
          'normalY',
          'normalZ'
        ] as const)
          expect(sample[key]).toBeCloseTo(expected[key], 12);
        expect(sample.status).toBe(expected.status);
        expect(sample.gradientStatus).toBe(expected.gradientStatus);
      }
  source[0].heights.fill(999);
  expect(field.sample(12, 17, {matrixId: 'fine'}).height).toBeCloseTo(-22);
  expect(snapshot(tiles().reverse()).sample(14, 14, {matrixId: 'fine'})).toEqual(
    field.sample(14, 14, {matrixId: 'fine'})
  );
});

test('fallback replaces the whole footprint and never masks known source no-data', () => {
  const source = tiles().filter(tile => tile.column === 0);
  const low = tiles(coarse);
  low[0].heights.fill(100);
  const field = snapshot([...source, ...low]);
  expect(field.sample(13.9, 14, {matrixId: 'fine'}).status).toBe(Status.NOT_RESIDENT);
  const sample = field.sample(13.9, 14, {matrixId: 'fine', fallback: 'coarser'});
  expect(sample.height).toBe(100);
  expect(sample.gradientX).toBe(0);
  expect(sample.matrixId).toBe('coarse');
  expect(sample.fallback).toBe(true);
  source[0].heights[3] = NaN;
  const hole = snapshot([...source, ...low]);
  expect(hole.sample(13.9, 14, {matrixId: 'fine', fallback: 'coarser'}).status).toBe(
    Status.NO_DATA
  );
  expect(field.sample(13.9, 14, {matrixId: 'fine', fallback: 'coarser'}).height).toBe(100);
  expect(field.sample(17, 10, {matrixId: 'fine'}).status).toBe(Status.NOT_RESIDENT);
  expect(field.sample(9, 10, {matrixId: 'fine', fallback: 'coarser'}).status).toBe(
    Status.OUTSIDE_DOMAIN
  );
  expect(field.sample(NaN, 10, {matrixId: 'fine'}).status).toBe(Status.INVALID_INPUT);
});

test('single-sample tiles and upward rows retain physical derivatives', () => {
  const matrix: TileMatrix = {
    ...fine,
    tileSize: [1, 1],
    matrixSize: [3, 3],
    cornerOfOrigin: 'bottomLeft'
  };
  const field = snapshot(tiles(matrix), [matrix]);
  const sample = field.sample(13, 24.5, {matrixId: 'fine'});
  expect(sample.status).toBe(Status.VALID);
  expect(sample.gradientX).toBe(2);
  expect(sample.gradientY).toBe(-3);
});

test('tiled inputs reject ambiguity and malformed geometry', () => {
  expect(() => snapshot([tiles()[0], tiles()[0]])).toThrow('Duplicate');
  expect(() => snapshot([{...tiles()[0], column: -1}])).toThrow('index');
  expect(() => snapshot([{...tiles()[0], heights: new Float32Array(3)}])).toThrow('buffers');
  expect(() => snapshot([], [fine, fine])).toThrow('unique');
  expect(() =>
    snapshot([], [{...fine, variableMatrixWidths: [{coalesce: 2, minTileRow: 0, maxTileRow: 1}]}])
  ).toThrow('coalesced');
  expect(() => snapshot().sample(12, 17, {matrixId: 'unknown'})).toThrow('Unknown');
});

test('geographic derivatives use WGS84 metric factors and unwrapped dateline coordinates', () => {
  const field = new GeographicHeightField({
    width: 2,
    height: 2,
    heights: new Float64Array([20, 24, 0, 4]),
    bounds: [179, 59, 181, 61]
  });
  const sample = field.sample(180, 60);
  const phi = Math.PI / 3;
  const e2 = 6.6943799901413165e-3;
  const n = 6378137 / Math.sqrt(1 - e2 * Math.sin(phi) ** 2);
  const m = (6378137 * (1 - e2)) / (1 - e2 * Math.sin(phi) ** 2) ** 1.5;
  expect(sample.height).toBeCloseTo(12);
  expect(sample.gradientX).toBeCloseTo(2 / ((Math.PI / 180) * n * Math.cos(phi)), 12);
  expect(sample.gradientY).toBeCloseTo(10 / ((Math.PI / 180) * m), 12);
  expect(field.sample(-180, 60).status).toBe(Status.OUTSIDE_DOMAIN);
  expect(field.sample(NaN, 60).status).toBe(Status.INVALID_INPUT);
  expect(field.sample(180, 60, {interpolation: 'nearest'}).gradientStatus).toBe(Status.UNAVAILABLE);
});

test('Mercator adapter samples projected grids and rescales derivatives', () => {
  const radius = 6378137;
  const south = radius * Math.asinh(Math.tan((40 * Math.PI) / 180));
  const north = radius * Math.asinh(Math.tan((60 * Math.PI) / 180));
  const dx = (radius * Math.PI) / 180;
  const field = new GeographicHeightField({
    width: 2,
    height: 2,
    bounds: [0, 40, 1, 60],
    projection: 'web-mercator',
    rowDirection: 'south-to-north',
    heights: new Float64Array([south, south + dx, north, north + dx])
  });
  const sample = field.sample(0.5, 50);
  expect(sample.height).toBeCloseTo(
    radius * Math.asinh(Math.tan((50 * Math.PI) / 180)) + dx / 2,
    7
  );
  expect(sample.gradientX).toBeGreaterThan(1.5);
  expect(sample.gradientY).toBeGreaterThan(1.5);
  expect(Math.hypot(sample.normalX, sample.normalY, sample.normalZ)).toBeCloseTo(1, 14);
});

test('geographic adapters preserve cell registration, validity and reject invalid domains', () => {
  const props = {
    width: 2,
    height: 2,
    bounds: [0, 0, 2, 2] as const,
    heights: new Float64Array([0, 1, 2, 3])
  };
  const field = new GeographicHeightField({...props, registration: 'cell'});
  expect(field.sample(0, 1).status).toBe(Status.OUTSIDE_DOMAIN);
  expect(field.sample(0.5, 1.5).height).toBe(0);
  expect(
    new GeographicHeightField({...props, validity: new Uint8Array(4)}).sample(1, 1).status
  ).toBe(Status.NO_DATA);
  expect(() => new GeographicHeightField({...props, bounds: [0, 0, 1, 90]})).toThrow('bounds');
  expect(
    () => new GeographicHeightField({...props, bounds: [0, 0, 1, 89], projection: 'web-mercator'})
  ).toThrow('bounds');
});

test('nonplanar triangle seams agree for both diagonals and copied halos are independent', () => {
  const heights = new Float64Array([0, 3, -2, 7, 9, -4, 8, 1, 2, 20, 0, 6, 7, -5, 4, 3]);
  const source = tiles();
  for (const tile of source)
    for (let y = 0; y < 2; y++)
      for (let x = 0; x < 2; x++)
        tile.heights[y * 2 + x] = heights[(tile.row * 2 + y) * 4 + tile.column * 2 + x];
  for (const diagonal of ['00-11', '10-01'] as const) {
    const field = new TiledHeightField({
      matrixSet: {crs: 'local', matrices: [fine]},
      tiles: source,
      revision: 'test',
      diagonal
    });
    const reference = new HeightField({
      width: 4,
      height: 4,
      heights,
      origin: [10, 20],
      columnStep: [2, 0],
      rowStep: [0, -3],
      registration: 'cell',
      diagonal
    });
    for (let x = 11; x <= 17; x += 0.25)
      for (let y = 9.5; y <= 18.5; y += 0.375) {
        const actual = field.sample(x, y, {matrixId: 'fine', interpolation: 'triangle'});
        const expected = reference.sample(x, y, {interpolation: 'triangle'});
        expect(actual.status).toBe(expected.status);
        expect(actual.height).toBeCloseTo(expected.height, 12);
        expect(actual.gradientX).toBeCloseTo(expected.gradientX, 12);
        expect(actual.gradientY).toBeCloseTo(expected.gradientY, 12);
      }
    const halo = field.copyTileHalo('fine', 1, 1)!;
    const recovered = new HeightField(halo);
    expect(recovered.sample(14, 14).height).toBeCloseTo(
      field.sample(14, 14, {matrixId: 'fine'}).height,
      12
    );
    halo.heights.fill(999);
    halo.validity.fill(0);
    expect(field.sample(14, 14, {matrixId: 'fine'}).status).toBe(Status.VALID);
    expect(field.copyTileHalo('fine', 9, 9)).toBeUndefined();
  }
});

test('nearest residency follows the selected sample rather than the query tile', () => {
  const field = snapshot(tiles().filter(tile => tile.column === 1));
  expect(field.sample(13.9, 17, {matrixId: 'fine', interpolation: 'nearest'}).status).toBe(
    Status.NOT_RESIDENT
  );
  expect(field.sample(14, 17, {matrixId: 'fine', interpolation: 'nearest'}).status).toBe(
    Status.VALID
  );
  const hole = tiles();
  hole[1].validity = new Uint8Array(4);
  const incomplete = snapshot([hole[1]]);
  expect(incomplete.sample(13.9, 17, {matrixId: 'fine', fallback: 'coarser'}).status).toBe(
    Status.NO_DATA
  );
});

test('decimal diagonal queries retain the exact monolithic validity footprint', () => {
  const matrix: TileMatrix = {
    ...fine,
    resolution: 1,
    resolutionY: 1,
    origin: [0, 0],
    cornerOfOrigin: 'bottomLeft'
  };
  for (const diagonal of ['00-11', '10-01'] as const) {
    const source = tiles(matrix);
    source[0].heights[3] = NaN;
    const heights = new Float64Array(16);
    for (const tile of source)
      for (let y = 0; y < 2; y++)
        for (let x = 0; x < 2; x++)
          heights[(tile.row * 2 + y) * 4 + tile.column * 2 + x] = tile.heights[y * 2 + x];
    const reference = new HeightField({
      width: 4,
      height: 4,
      heights,
      registration: 'cell',
      diagonal
    });
    const field = new TiledHeightField({
      matrixSet: {crs: 'local', matrices: [matrix]},
      tiles: source,
      revision: 'decimal',
      diagonal
    });
    for (const [x, y] of [
      [0.6, 1.6],
      [1.6, 0.6],
      [0.7, 1.3],
      [1.3, 0.7],
      [2.6, 1.6]
    ]) {
      const actual = field.sample(x, y, {matrixId: 'fine', interpolation: 'triangle'});
      const expected = reference.sample(x, y, {interpolation: 'triangle'});
      expect(actual.status).toBe(expected.status);
      expect(actual.height).toBeCloseTo(expected.height, 12);
      expect(actual.gradientX).toBeCloseTo(expected.gradientX, 12);
      expect(actual.gradientY).toBeCloseTo(expected.gradientY, 12);
    }
  }
});

test('fractional matrix resolutions admit roundoff at outer sample centers only', () => {
  for (const cornerOfOrigin of ['bottomLeft', 'topLeft'] as const) {
    const matrix: TileMatrix = {
      ...fine,
      resolution: 0.3,
      resolutionY: 0.3,
      origin: [0, 0],
      cornerOfOrigin
    };
    const field = snapshot(tiles(matrix), [matrix]);
    const sign = cornerOfOrigin === 'topLeft' ? -1 : 1;
    for (const interpolation of ['nearest', 'bilinear', 'triangle'] as const) {
      const sample = field.sample(1.05, 0.45 * sign, {matrixId: 'fine', interpolation});
      expect(sample.status).toBe(Status.VALID);
      expect(sample.height).toBeCloseTo(2 * 1.05 - 3 * 0.45 * sign + 5, 12);
      expect(
        field.sample(1.05 + 1e-10, 0.45 * sign, {matrixId: 'fine', interpolation}).status
      ).toBe(Status.OUTSIDE_DOMAIN);
    }
  }
});

test('large origins and geographic pixel centers retain valid endpoints without extrapolation', () => {
  const matrix: TileMatrix = {
    ...fine,
    origin: [1000000, 0],
    resolution: 0.1,
    resolutionY: 0.1,
    tileSize: [2, 2],
    matrixSize: [1, 1],
    cornerOfOrigin: 'bottomLeft'
  };
  const field = snapshot(tiles(matrix), [matrix]);
  const geographic = new GeographicHeightField({
    width: 2,
    height: 2,
    bounds: [179, 59, 179.002, 59.002],
    registration: 'cell',
    heights: new Float64Array([10, 20, 30, 40])
  });
  const local = new HeightField({
    width: 2,
    height: 2,
    heights: tiles(matrix)[0].heights,
    origin: [1000000, 0],
    columnStep: [0.1, 0],
    rowStep: [0, 0.1],
    registration: 'cell'
  });
  for (const interpolation of ['nearest', 'bilinear', 'triangle'] as const) {
    expect(field.sample(1000000.15, 0.05, {matrixId: 'fine', interpolation}).status).toBe(
      Status.VALID
    );
    expect(local.sample(1000000.15, 0.05, {interpolation}).status).toBe(Status.VALID);
    expect(geographic.sample(179.0005, 59.0015, {interpolation}).status).toBe(Status.VALID);
    expect(geographic.sample(179.0015, 59.0005, {interpolation}).status).toBe(Status.VALID);
    expect(field.sample(1000000.150001, 0.05, {matrixId: 'fine', interpolation}).status).toBe(
      Status.OUTSIDE_DOMAIN
    );
    expect(local.sample(1000000.150001, 0.05, {interpolation}).status).toBe(Status.OUTSIDE_DOMAIN);
    expect(geographic.sample(179.0005 - 1e-8, 59.0015, {interpolation}).status).toBe(
      Status.OUTSIDE_DOMAIN
    );
  }
});

test('halo reconstruction preserves diagonal, registration and height provenance', () => {
  const matrix: TileMatrix = {
    ...fine,
    matrixSize: [1, 1],
    origin: [0, 0],
    resolution: 1,
    resolutionY: 1,
    cornerOfOrigin: 'bottomLeft'
  };
  for (const diagonal of ['00-11', '10-01'] as const) {
    const field = new TiledHeightField({
      matrixSet: {crs: 'local', matrices: [matrix]},
      revision: 'r',
      heightReference: 'survey',
      diagonal,
      tiles: [{matrixId: 'fine', column: 0, row: 0, heights: new Float64Array([0, 0, 0, 10])}]
    });
    const halo = field.copyTileHalo('fine', 0, 0)!;
    expect(halo.diagonal).toBe(diagonal);
    expect(halo.registration).toBe('vertex');
    expect(halo.heightReference).toBe('survey');
    const reconstructed = new HeightField(halo);
    const actual = reconstructed.sample(0.75, 0.75, {interpolation: 'triangle'});
    const expected = field.sample(0.75, 0.75, {matrixId: 'fine', interpolation: 'triangle'});
    expect(actual.height).toBe(expected.height);
    expect(actual.gradientX).toBe(expected.gradientX);
    expect(actual.gradientY).toBe(expected.gradientY);
    expect(actual.normalZ).toBe(expected.normalZ);
  }
});

test('endpoint uncertainty arithmetic does not overflow for finite extreme coordinates', () => {
  const field = new HeightField({
    width: 2,
    height: 2,
    heights: new Float64Array(4),
    origin: [1e308, 0],
    columnStep: [1e150, 0],
    rowStep: [0, 1e150]
  });
  expect(field.sample(1.1e308, 1e150).status).toBe(Status.OUTSIDE_DOMAIN);
});
