// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import proj4 from 'proj4';
// @ts-expect-error Upstream exposes no declaration for its internal grid kernel.
import {applyGridShift} from 'proj4/lib/datum_transform';
import {
  ProjectionEngine,
  parseNTv2Grid,
  loadGeoTIFFGrid,
  checkProjectionCompatibility,
  normalizeCRS,
  mercator,
  geocentric
} from '@math.gl/projection/experimental';
import type {DatumGrid, DatumGridGeoTIFF} from '@math.gl/projection/experimental';
import {makeNTv2, makeGeoTIFF} from '../fixtures/datum-grids';
const D2R = Math.PI / 180;
function close(actual: readonly number[], expected: readonly number[], tolerance = 1e-9): void {
  expect(actual).toHaveLength(expected.length);
  actual.forEach((value, i) =>
    expect(Math.abs(value - expected[i]), JSON.stringify({actual, expected})).toBeLessThanOrEqual(
      tolerance
    )
  );
}
function projection(grid: DatumGrid, list = 'test'): ProjectionEngine {
  return new ProjectionEngine({
    from: '+proj=longlat +ellps=WGS84 +nadgrids=' + list,
    datumGrids: {test: grid}
  });
}
for (const little of [false, true])
  for (const errors of [false, true]) {
    test(
      'NTv2 differential forward/inverse, byte order and node stride: ' + little + '/' + errors,
      () => {
        const buffer = makeNTv2([{}], little, errors);
        const grid = parseNTv2Grid(buffer, {includeErrorFields: errors});
        const name = 'grid-' + little + '-' + errors;
        const upstream = proj4.nadgrid(name, buffer, {includeErrorFields: errors});
        const native = projection(grid);
        const reference = proj4('+proj=longlat +ellps=WGS84 +nadgrids=' + name, 'WGS84');
        for (const lon of [-0.25, -1.25, -2.75])
          for (const lat of [0.25, 1.25, 2.75]) {
            const point = Object.freeze([lon, lat, 123, 7]);
            const actual = native.project(point);
            close(actual, reference.forward([...point]));
            close(actual, [lon - (2 - lon * 4) / 3600, lat + (1 + lat * 3) / 3600, 123, 7]);
            close(native.unproject(actual), point);
            const inverse = {x: actual[0] * D2R, y: actual[1] * D2R};
            expect(
              applyGridShift(
                {grids: [{name, grid: upstream, mandatory: true, isNull: false}]},
                true,
                inverse
              )
            ).toBe(0);
            close(native.unproject(actual).slice(0, 2), [inverse.x / D2R, inverse.y / D2R]);
            expect(point).toEqual([lon, lat, 123, 7]);
          }
      }
    );
  }
test('NTv2 outer edges, corners and shifted inverse extents are inclusive', () => {
  const native = projection(parseNTv2Grid(makeNTv2([{shift: () => [2, 1]}])));
  for (const lon of [0, -1.5, -3])
    for (const lat of [0, 1.5, 3]) {
      const point = [lon, lat];
      close(native.project(point), [lon - 2 / 3600, lat + 1 / 3600]);
      close(native.unproject(native.project(point)), point);
    }
  expect(() => native.project([-3.001, 1])).toThrow('covers');
});
test('NTv2 subgrid file order, child coverage and parent fallback', () => {
  const child = {
    name: 'CHILD',
    parent: 'PARENT',
    origin: [1, 1] as [number, number],
    step: 0.5,
    size: 3,
    shift: (): [number, number] => [4, 3]
  };
  const parent = {name: 'PARENT', shift: (): [number, number] => [2, 1]};
  for (const subgrids of [
    [child, parent],
    [parent, child]
  ]) {
    const bytes = makeNTv2(subgrids),
      native = projection(parseNTv2Grid(bytes));
    proj4.nadgrid('nested', bytes);
    const reference = proj4('+proj=longlat +ellps=WGS84 +nadgrids=nested', 'WGS84');
    close(native.project([-1.25, 1.25]), reference.forward([-1.25, 1.25]));
    close(native.project([-0.5, 0.5]), reference.forward([-0.5, 0.5]));
    close(native.unproject(native.project([-1.25, 1.25])), [-1.25, 1.25]);
  }
});
test('prepared grids own data and construction snapshots registrations', () => {
  const bytes = makeNTv2([{shift: () => [2, 1]}]),
    grid = parseNTv2Grid(bytes),
    datumGrids = {test: grid};
  const native = new ProjectionEngine({from: '+proj=longlat +nadgrids=test', datumGrids});
  new Uint8Array(bytes).fill(0);
  datumGrids.test = parseNTv2Grid(makeNTv2([{shift: () => [4, 3]}]));
  close(native.project([-1, 1]), [-1 - 2 / 3600, 1 + 1 / 3600]);
  expect(Object.isFrozen(grid)).toBe(true);
  expect(() => new ProjectionEngine({from: '+proj=longlat +nadgrids=test'})).toThrow(
    'not registered'
  );
});
test('ordered required/optional grids, null fallback and coordinate coverage', () => {
  const grid = parseNTv2Grid(makeNTv2([{shift: () => [2, 1]}]));
  close(projection(grid, '@missing,test').project([-1, 1]), [-1 - 2 / 3600, 1 + 1 / 3600]);
  close(projection(grid, '@missing,test,@null').project([-10, 10]), [-10, 10]);
  close(projection(grid, 'null,missing').project([-1, 1]), [-1, 1]);
  expect(() => projection(grid, 'missing,test')).toThrow('not registered');
  expect(() => projection(grid, '@missing').project([-1, 1])).toThrow('covers');
  expect(() => projection(grid, 'test').project([-10, 10])).toThrow('covers');
  expect(() => projection(grid, 'test,,@null')).toThrow('Invalid datum grid');
  expect(
    checkProjectionCompatibility('+proj=longlat +nadgrids=test', {datumGrids: {test: grid}}).status
  ).toBe('supported');
  expect(checkProjectionCompatibility('+proj=longlat +nadgrids=test').reason).toBe(
    'missing-transform-stage'
  );
  expect(normalizeCRS('+proj=longlat +nadgrids=@test,@null').datum.grids?.map(g => g.name)).toEqual(
    ['test', 'null']
  );
});
test('grid-to-grid, Helmert chains, datum none, projected and geocentric targets', () => {
  const grid = parseNTv2Grid(makeNTv2([{shift: () => [2, 1]}])),
    other = parseNTv2Grid(makeNTv2([{shift: () => [4, 3]}]));
  const datumGrids = {test: grid, other};
  const from = '+proj=longlat +ellps=clrk66 +nadgrids=test +towgs84=100,200,300';
  const point = [-1, 1, 123, 7],
    wgs = [-1 - 2 / 3600, 1 + 1 / 3600, 123, 7];
  const source = new ProjectionEngine({from, datumGrids});
  close(source.project(point), wgs);
  close(source.unproject(wgs), point);
  const target = new ProjectionEngine({to: from, datumGrids});
  close(target.project(wgs), point);
  close(
    new ProjectionEngine({
      from,
      to: '+proj=longlat +ellps=GRS80 +nadgrids=other',
      datumGrids
    }).project(point),
    [-1 + 2 / 3600, 1 - 2 / 3600, 123, 7]
  );
  for (const to of [
    'EPSG:3857',
    'EPSG:4978',
    '+proj=longlat +ellps=GRS80 +towgs84=1,2,3,0.1,0.2,0.3,1'
  ]) {
    const options = {to, projections: [mercator, geocentric]};
    const native = new ProjectionEngine({...options, from, datumGrids});
    close(native.project(point), new ProjectionEngine(options).project(wgs), 1e-7);
    // The seven-parameter inverse retains the existing first-order rotation approximation.
    const roundTrip = native.unproject(native.project(point));
    close(roundTrip.slice(0, 2), point.slice(0, 2), 1e-8);
    close(roundTrip.slice(2), point.slice(2), 3e-5);
  }
  const none = new ProjectionEngine({from: from + ' +datum=none'});
  close(none.project(point), point);
  close(
    new ProjectionEngine({from, to: '+proj=longlat +datum=none', datumGrids}).project(point),
    point
  );
  close(new ProjectionEngine({from, to: from, datumGrids}).project([-20, 30]), [-20, 30]);
});
test('inverse iteration converges both ordinates and rejects nonconvergence', () => {
  const native = projection(parseNTv2Grid(makeNTv2([{shift: x => [x * 360, 0]}])));
  close(native.unproject(native.project([-1, 1])), [-1, 1]);
  const divergent = projection(parseNTv2Grid(makeNTv2([{shift: x => [(x - 1.5) * 3240, 0]}])));
  expect(() => divergent.unproject([-1.6, 1])).toThrow('did not converge');
});
test('NTv2 nodata cells fall through to the next grid or fail explicitly', () => {
  const grid = parseNTv2Grid(makeNTv2([{shift: () => [NaN, NaN]}]));
  expect(() => projection(grid).project([-1, 1])).toThrow('covers');
  close(projection(grid, 'test,@null').project([-1, 1]), [-1, 1]);
});
test('NTv2 malformed headers, dimensions, units and truncated records fail early', () => {
  const mutations = [
    (v: DataView) => v.setInt32(8, 12, true),
    (v: DataView) => v.setInt32(24, 10, true),
    (v: DataView) => v.setInt32(40, 100000, true),
    (v: DataView) => v.setUint8(56, 0),
    (v: DataView) => v.setFloat64(176 + 152, 0, true),
    (v: DataView) => v.setInt32(176 + 168, 3, true)
  ];
  for (const mutate of mutations) {
    const bytes = makeNTv2();
    mutate(new DataView(bytes));
    expect(() => parseNTv2Grid(bytes)).toThrow();
  }
  for (const length of [0, 8, 175, 200, 400])
    expect(() => parseNTv2Grid(makeNTv2().slice(0, length))).toThrow();
  expect(() => parseNTv2Grid(makeNTv2([{}], true, false))).toThrow('Truncated');
});
for (const v3 of [false, true]) {
  test(
    'GeoTIFF async adapter orientation, v2/v3 directories and upstream parity: ' + v3,
    async () => {
      const tiff = makeGeoTIFF([{}], v3),
        grid = await loadGeoTIFFGrid(tiff),
        native = projection(grid);
      // The runtime accepts a decoded GeoTIFF-shaped source without importing a TIFF implementation.
      const upstream = proj4 as unknown as {
        nadgrid(name: string, data: DatumGridGeoTIFF): {ready: Promise<unknown>};
      };
      await upstream.nadgrid('tiff-' + v3, tiff).ready;
      const reference = proj4('+proj=longlat +ellps=WGS84 +nadgrids=tiff-' + v3, 'WGS84');
      for (const point of [
        [-0.25, 0.25],
        [-1.25, 1.75],
        [-2.75, 2.75]
      ]) {
        close(native.project(point), reference.forward(point));
        close(native.unproject(native.project(point)), point);
      }
      close(native.project([-3, 3]), [-3 - 14 / 3600, 3 + 10 / 3600]);
    }
  );
}
test('GeoTIFF child-first selection and nodata fallback', async () => {
  const parent = {shift: (): [number, number] => [2, 1]};
  const child = {
    origin: [1, 1] as [number, number],
    step: 0.5,
    size: 3,
    shift: (): [number, number] => [4, 3]
  };
  const grid = await loadGeoTIFFGrid(makeGeoTIFF([parent, child]));
  close(projection(grid).project([-1.25, 1.25]), [-1.25 - 4 / 3600, 1.25 + 3 / 3600]);
  close(projection(grid).project([-0.25, 0.25]), [-0.25 - 2 / 3600, 0.25 + 1 / 3600]);
  const nodata = await loadGeoTIFFGrid(
    makeGeoTIFF([parent, {...child, shift: () => [-9999, -9999]}], false, -9999)
  );
  close(projection(nodata).project([-1.25, 1.25]), [-1.25 - 2 / 3600, 1.25 + 1 / 3600]);
});
test('GeoTIFF loading failures and malformed images reject without registering partial data', async () => {
  await expect(
    loadGeoTIFFGrid({
      getImageCount: async () => 1,
      getImage: async () => {
        throw new Error('read failed');
      }
    })
  ).rejects.toThrow('read failed');
  const base = await makeGeoTIFF().getImage(0);
  for (const changes of [
    {readRasters: async () => [new Float32Array(16)]},
    {readRasters: async () => new Float32Array(32)},
    {getWidth: () => 1},
    {fileDirectory: {}},
    {fileDirectory: {ModelPixelScale: [0, 1, 0]}},
    {
      readRasters: async () => {
        throw new Error('raster failure');
      }
    }
  ]) {
    await expect(
      loadGeoTIFFGrid({getImageCount: async () => 1, getImage: async () => ({...base, ...changes})})
    ).rejects.toThrow();
  }
});
test('inverse solves variable shifts at every source boundary without an edge approximation', () => {
  const native = projection(parseNTv2Grid(makeNTv2()));
  for (const lon of [0, -1.5, -3])
    for (const lat of [0, 1.5, 3]) close(native.unproject(native.project([lon, lat])), [lon, lat]);
});
test('grid interpolation works with enforced axes and prime meridians', () => {
  const grid = parseNTv2Grid(makeNTv2([{shift: () => [2, 1]}]));
  const native = new ProjectionEngine({
    from: '+proj=longlat +ellps=WGS84 +nadgrids=test +pm=1 +axis=neu',
    to: '+proj=longlat +datum=WGS84 +pm=2 +axis=wsu',
    datumGrids: {test: grid},
    enforceAxis: true
  });
  const point = [1, -2, 123, 7];
  close(native.project(point), [3 + 2 / 3600, -1 - 1 / 3600, 123, 7]);
  close(native.unproject(native.project(point)), point);
});
test('nodata on zero-weight neighbors does not invalidate an exact usable node', () => {
  const grid = parseNTv2Grid(
    makeNTv2([{shift: (x, y) => (x === 0 && y === 0 ? [2, 1] : [NaN, NaN])}])
  );
  close(projection(grid).project([0, 0]), [-2 / 3600, 1 / 3600]);
  expect(() => projection(grid).project([-0.5, 0.5])).toThrow('covers');
});
test('inverse rejects clamped extrapolation outside the true source extent', () => {
  const native = projection(parseNTv2Grid(makeNTv2()));
  expect(() => native.unproject([-0.0001, 1])).toThrow('covers');
});
test('GeoTIFF snapshots raster ownership and rejects partial multigrid loads', async () => {
  const image = await makeGeoTIFF().getImage(0);
  const rasters = await image.readRasters();
  const source = {
    getImageCount: async () => 1,
    getImage: async () => ({...image, readRasters: async () => rasters})
  };
  const prepared = await loadGeoTIFFGrid(source);
  for (const band of Array.from(rasters))
    if (typeof band !== 'number') {
      for (let i = 0; i < band.length; i++) band[i] = 0;
    }
  close(projection(prepared).project([-1, 1]), [-1 - 6 / 3600, 1 + 4 / 3600]);
  await expect(
    loadGeoTIFFGrid({
      getImageCount: async () => 2,
      getImage: async index => {
        if (index === 0) throw new Error('parent read failed');
        return image;
      }
    })
  ).rejects.toThrow('parent read failed');
});
test('registered grid lists fall through uncovered and nodata entries in declared order', () => {
  const remote = parseNTv2Grid(makeNTv2([{origin: [10, 10], shift: () => [4, 3]}]));
  const empty = parseNTv2Grid(makeNTv2([{shift: () => [NaN, NaN]}]));
  const local = parseNTv2Grid(makeNTv2([{shift: () => [2, 1]}]));
  const alternate = parseNTv2Grid(makeNTv2([{shift: () => [4, 3]}]));
  const datumGrids = {remote, empty, local, alternate};
  const native = new ProjectionEngine({
    from: '+proj=longlat +nadgrids=remote,empty,local,alternate',
    datumGrids
  });
  close(native.project([-1, 1]), [-1 - 2 / 3600, 1 + 1 / 3600]);
  close(native.unproject(native.project([-1, 1])), [-1, 1]);
});
test('null fallback terminates registration lookup as well as execution', () => {
  const native = new ProjectionEngine({
    from: '+proj=longlat +nadgrids=@null,unreachable',
    datumGrids: {
      get unreachable(): DatumGrid {
        throw new Error('must not be read');
      }
    }
  });
  close(native.project([-1, 1]), [-1, 1]);
});

const crossTermShift = (x: number, y: number): [number, number] => [
  2 + x / 8 + (x * y) / 32,
  1 - y / 4 + (x * y) / 64
];
for (const reader of ['NTv2 BE', 'NTv2 LE', 'NTv2 compact', 'GeoTIFF v2', 'GeoTIFF v3']) {
  test('dense horizontal cross-term field, edges and XYZM ownership: ' + reader, async () => {
    const fixture = {size: 33, step: 0.5, shift: crossTermShift};
    const grid = reader.startsWith('NTv2')
      ? parseNTv2Grid(makeNTv2([fixture], reader !== 'NTv2 BE', reader !== 'NTv2 compact'), {
          includeErrorFields: reader !== 'NTv2 compact'
        })
      : await loadGeoTIFFGrid(makeGeoTIFF([fixture], reader === 'GeoTIFF v3'));
    const native = projection(grid);
    const points = [
      [0, 0],
      [16, 16],
      [0, 16],
      [16, 0],
      [8, 8]
    ];
    for (let i = 0; i < 25; i++) points.push([0.125 + i * 0.625, 15.875 - i * 0.375]);
    for (const ArrayType of [Float64Array, Float32Array]) {
      const input = new ArrayType(points.flatMap(([x, y], i) => [-x, y, 100 + i, 700 + i]));
      const output = input.slice();
      const expected: number[] = [];
      for (let i = 0; i < input.length; i += 4) {
        const [longitude, latitude, height, measure] = input.slice(i, i + 4);
        const [dx, dy] = crossTermShift(-longitude, latitude);
        expected.push(longitude - dx / 3600, latitude + dy / 3600, height, measure);
        close(native.project([longitude, latitude, height, measure]), expected.slice(-4), 1e-10);
      }
      expect(native.projectFlat(output, 4)).toBe(output);
      close(
        Array.from(output),
        Array.from(new ArrayType(expected)),
        ArrayType === Float32Array ? 2e-6 : 1e-10
      );
      // Float32 rounding of shifted outer nodes can place the inverse outside true coverage.
      // Keep forward edge checks; roundtrip the interiors in Float32 and all nodes in Float64.
      const inverse = ArrayType === Float32Array ? output.slice(20) : output;
      const original = ArrayType === Float32Array ? input.slice(20) : input;
      expect(native.unprojectFlat(inverse, 4)).toBe(inverse);
      close(Array.from(inverse), Array.from(original), ArrayType === Float32Array ? 2e-6 : 1e-9);
      for (let i = 0; i < output.length; i += 4) {
        expect(output[i + 2]).toBe(input[i + 2]);
        expect(output[i + 3]).toBe(input[i + 3]);
      }
    }
  });
}

test('rectangular GeoTIFF packed rows retain orientation, nodata and owned raster snapshot', async () => {
  const width = 7,
    height = 5,
    sx = 0.5,
    sy = 0.25;
  const latitude = new Float64Array(width * height),
    longitude = latitude.slice();
  for (let row = 0; row < height; row++)
    for (let col = 0; col < width; col++) {
      const [dx, dy] = crossTermShift((width - 1 - col) * sx, (height - 1 - row) * sy);
      longitude[row * width + col] = -dx;
      latitude[row * width + col] = dy;
    }
  // Northwest raster node is the northeast west-positive node of the prepared grid.
  latitude[0] = -9999;
  const grid = await loadGeoTIFFGrid({
    getImageCount: async () => 1,
    getImage: async () => ({
      getWidth: () => width,
      getHeight: () => height,
      getBoundingBox: () => [-3, -sy, sx, 1],
      fileDirectory: {ModelPixelScale: [sx, sy, 0]},
      readRasters: async () => [latitude, longitude],
      getGDALNoData: () => -9999
    })
  });
  const native = projection(grid);
  for (const [x, y] of [
    [0, 0],
    [0, 1],
    [3, 0],
    [1.25, 0.625],
    [2, 1]
  ]) {
    const [dx, dy] = crossTermShift(x, y);
    close(native.project([-x, y]), [-x - dx / 3600, y + dy / 3600], 1e-10);
    close(native.unproject(native.project([-x, y])), [-x, y], 1e-9);
  }
  const point = {x: -3 * D2R, y: D2R, z: 123};
  expect(grid.shiftInPlace!(point, false)).toBe(false);
  expect(point).toEqual({x: -3 * D2R, y: D2R, z: 123});
  expect(() => native.project([-2.75, 0.875])).toThrow('covers');
  const expected = native.project([-1.25, 0.625]);
  longitude.fill(0);
  latitude.fill(0);
  close(native.project([-1.25, 0.625]), expected, 0);
});

test('prepared grid scratch remains isolated during recursive output setters', () => {
  const grid = parseNTv2Grid(makeNTv2([{shift: () => [2, 1]}]));
  const original = [-1 * D2R, 1 * D2R],
    other = [-2 * D2R, 2 * D2R];
  const expected = grid.shift(original[0], original[1], false)!;
  let longitude = original[0],
    latitude = original[1],
    calls = 0;
  const point = {
    get x() {
      return longitude;
    },
    set x(value: number) {
      longitude = value;
      calls++;
      const nested = grid.shift(other[0], other[1], false)!;
      expect(nested).toEqual(grid.shift(other[0], other[1], false));
    },
    get y() {
      return latitude;
    },
    set y(value: number) {
      latitude = value;
    },
    z: 123
  };
  expect(grid.shiftInPlace!(point, false)).toBe(true);
  expect([longitude, latitude]).toEqual(expected);
  expect(point.z).toBe(123);
  expect(calls).toBeGreaterThan(0);
  expected[0] = 999;
  expect(grid.shift(original[0], original[1], false)![0]).not.toBe(999);
});

test('prepared grid scratch does not leak failed samples into caller coordinates', () => {
  const grid = parseNTv2Grid(makeNTv2([{shift: () => [NaN, NaN]}]));
  for (const inverse of [false, true]) {
    const point = {x: -D2R, y: D2R, z: 123};
    expect(grid.shiftInPlace!(point, inverse)).toBe(false);
    expect(point).toEqual({x: -D2R, y: D2R, z: 123});
    expect(grid.shift(-D2R, D2R, inverse)).toBeUndefined();
  }
  const divergent = parseNTv2Grid(makeNTv2([{shift: x => [(x - 1.5) * 3240, 0]}]));
  const point = {x: -1.6 * D2R, y: D2R, z: 123};
  expect(() => divergent.shift(-1.6 * D2R, D2R, true)).toThrow(/converge/);
  const reference = divergent.shift(-D2R, D2R, false)!;
  expect(divergent.shiftInPlace!(point, false)).toBe(true);
  expect(divergent.shift(-D2R, D2R, false)).toEqual(reference);
});
