// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Original fixtures; independent PROJ 9.5.1 pipelines supply numeric expectations.
import {expect, test} from 'vitest';
import {parsePGM} from '@math.gl/geoid';
import {wgs84Egm2008CompoundCRS} from '@math.gl/crs/test/projjson-fixtures';
import {
  Projection,
  ProjectionEngine,
  mercator,
  geocentric,
  projJSONCRSParser
} from '@math.gl/projection';
import {LazyProjection} from '@math.gl/projection/projections/lazy';
import {parseGTXGrid} from '@math.gl/projection/grids/gtx';
import {createGeoidGrid, createVerticalGrid} from '@math.gl/projection/grids/vertical';
import inputs from '../fixtures/vertical-grid-cases.json';
import reference from '../fixtures/vertical-grid-reference.json';

const radians = Math.PI / 180;
const bytes = () => new Uint8Array(reference.gridBytes).buffer;
const grid = parseGTXGrid(bytes());
const definition = '+proj=longlat +ellps=WGS84 +geoidgrids=local';
const options = {from: definition, verticalGrids: {local: grid}};
const close = (actual: ArrayLike<number>, expected: number[], tolerance = 1e-5) => {
  expect(actual.length).toBe(expected.length);
  expected.forEach((value, i) =>
    expect(Math.abs(actual[i] - value), `ordinate ${i}`).toBeLessThanOrEqual(tolerance)
  );
};

for (const [index, fixture] of inputs.cases.entries()) {
  test('vertical grid vs independent PROJ: ' + fixture.id, () => {
    const projection = new ProjectionEngine({
      ...options,
      from: fixture.from,
      to: fixture.to,
      enforceAxis: true,
      projections: [mercator]
    });
    const expected = reference.cases[index];
    expect(expected.id).toBe(fixture.id);
    expect(expected.results.map(row => row.input)).toEqual(fixture.points);
    for (const row of expected.results) {
      close(projection.project(row.input), row.forward);
      close(projection.unproject(row.forward), row.inverse);
      expect(row.forward[3]).toBe(row.input[3]);
    }
    for (const ArrayType of [Float64Array, Float32Array]) {
      const forward = new ArrayType(expected.results.flatMap(row => row.input));
      const rounded = Array.from(forward);
      const scalar = expected.results.flatMap((_, i) =>
        projection.project(rounded.slice(i * 4, i * 4 + 4))
      );
      expect(projection.projectFlat(forward, 4)).toBe(forward);
      close(forward, Array.from(new ArrayType(scalar)));
      expect(projection.unprojectFlat(forward, 4)).toBe(forward);
      close(forward, rounded, ArrayType === Float32Array ? 2e-4 : 1e-5);
    }
  });
}

test('GTX owns its nodes and samples inclusive outer edges without extrapolation', () => {
  const buffer = bytes();
  const owned = parseGTXGrid(buffer);
  new Uint8Array(buffer).fill(0);
  for (const [lon, lat, offset] of [
    [10, 40, 12.5],
    [13, 43, 32],
    [13, 40, 16],
    [10, 43, 22]
  ]) {
    expect(owned.getOffset(lon * radians, lat * radians)).toBeCloseTo(offset, 10);
  }
  expect(owned.getOffset(9.99 * radians, 40 * radians)).toBeUndefined();
  expect(owned.getOffset(10 * radians, 43.01 * radians)).toBeUndefined();
  expect(() => owned.getOffset(NaN, 0)).toThrow('finite');
  expect(() => parseGTXGrid(new ArrayBuffer(39))).toThrow('header');
  expect(() => parseGTXGrid(buffer)).toThrow('dimensions');
  expect(() => parseGTXGrid(bytes().slice(0, -1))).toThrow('length');
});

test('bilinear grid snapshot, nodata, antimeridian and longitude equivalence', () => {
  const offsets = [10, 20, 30, NaN];
  const prepared = createVerticalGrid({origin: [179, 0], step: [2, 1], size: [2, 2], offsets});
  offsets[0] = 999;
  expect(prepared.getOffset(179 * radians, 0)).toBeCloseTo(10);
  expect(prepared.getOffset(-179 * radians, 0)).toBeCloseTo(20);
  expect(prepared.getOffset(180 * radians, 0)).toBeCloseTo(15);
  expect(prepared.getOffset(-180 * radians, 0.5 * radians)).toBeUndefined();
  expect(prepared.getOffset(0, 0)).toBeUndefined();
  const seam = createVerticalGrid({
    origin: [-180, 0],
    step: [360, 1],
    size: [2, 2],
    offsets: [10, 20, 10, 20]
  });
  expect(seam.getOffset(-Math.PI, 0)).toBe(10);
  expect(seam.getOffset(Math.PI, 0)).toBe(20);
  expect(seam.getOffset(Number.MAX_VALUE, 0)).toBeUndefined();
  expect(() => createVerticalGrid({origin: [0, 0], step: [-1, 1], size: [2, 2], offsets})).toThrow(
    'geometry'
  );
  expect(() => createVerticalGrid({origin: [0, 0], step: [1, 1], size: [2.5, 2], offsets})).toThrow(
    'geometry'
  );
  for (const value of [-88.8888, 1001, -2147479936, NaN, Infinity]) {
    const buffer = bytes();
    new DataView(buffer).setFloat32(40, value);
    expect(parseGTXGrid(buffer).getOffset(10 * radians, 40 * radians)).toBeUndefined();
  }
});

test('ordered coverage, optional names, explicit null fallback, captured registry', () => {
  const projection = new ProjectionEngine({
    ...options,
    from: definition.replace('local', '@absent,local,null')
  });
  close(projection.project([0, 0, 100, 7]), [0, 0, 100, 7]);
  close(projection.project([10, 40, 100, 7]), [10, 40, 112.5, 7]);
  expect(
    () => new ProjectionEngine({...options, from: definition.replace('local', 'absent,local')})
  ).toThrow('not registered');
  expect(() =>
    new ProjectionEngine({...options, from: definition.replace('local', '@absent')}).project([
      10, 40, 100
    ])
  ).toThrow('covers');
  const registry = {local: grid};
  const captured = new ProjectionEngine({...options, verticalGrids: registry});
  registry.local = {getOffset: () => 999};
  close(captured.project([10, 40, 100]), [10, 40, 112.5]);
  const bad = new ProjectionEngine({
    ...options,
    verticalGrids: {local: {getOffset: () => NaN}}
  });
  expect(() => bad.project([10, 40, 100])).toThrow('non-finite');
});

test('vertical transforms require Z, preserve trailing measures and commit only successful records', () => {
  const projection = new ProjectionEngine(options);
  expect(() => projection.project([10, 40])).toThrow('three ordinates');
  expect(() => projection.unproject([10, 40])).toThrow('three ordinates');
  expect(() => projection.projectFlat(new Float64Array([10, 40]), 2)).toThrow();
  const point = [10, 40, 100, 7, 8];
  close(projection.project(point), [10, 40, 112.5, 7, 8]);
  expect(point).toEqual([10, 40, 100, 7, 8]);
  const flat = new Float64Array([10, 40, 100, 7, 0, 0, 100, 8, 10, 40, 100, 9]);
  expect(() => projection.projectFlat(flat, 4)).toThrow('covers');
  close(flat, [10, 40, 112.5, 7, 0, 0, 100, 8, 10, 40, 100, 9]);
  const overflow = new ProjectionEngine({
    ...options,
    verticalGrids: {local: {getOffset: () => 1e40}}
  });
  const small = new Float32Array([10, 40, 100, 7]);
  expect(() => overflow.projectFlat(small, 4)).toThrow();
  expect(Array.from(small)).toEqual([10, 40, 100, 7]);
});

test('height stage rejects geocentric attachment and missing grid registrations', () => {
  expect(
    () =>
      new ProjectionEngine({
        ...options,
        from: '+proj=geocent +ellps=WGS84 +geoidgrids=local',
        projections: [geocentric]
      })
  ).toThrow('Vertical');
  expect(() => new ProjectionEngine({from: definition})).toThrow('not registered');
  expect(
    () =>
      new ProjectionEngine({
        ...options,
        to: wgs84Egm2008CompoundCRS,
        mode: 'horizontal',
        parsers: [projJSONCRSParser]
      })
  ).toThrow('Horizontal extraction');
});

test('geoid structural adapter, convenience wrapper and lazy preload use the same stage', async () => {
  const model = {getHeight: (latitude: number, longitude: number) => latitude + 2 * longitude};
  const adapted = createGeoidGrid(model);
  expect(adapted.getOffset(10 * radians, 40 * radians)).toBeCloseTo(60);
  expect(createGeoidGrid({getHeight: () => NaN}).getOffset(0, 0)).toBeUndefined();
  close(new Projection(options).project([10, 40, 100, 7]), [10, 40, 112.5, 7]);
  const lazy = new LazyProjection({...options, to: 'EPSG:3857'});
  expect(() => lazy.projectSync([10, 40, 100, 7])).toThrow('preload');
  await lazy.preload();
  const expected = new Projection({...options, to: 'EPSG:3857'}).project([10, 40, 100, 7]);
  close(lazy.projectSync([10, 40, 100, 7]), expected);
  close(await lazy.project([10, 40, 100, 7]), expected);
});

test('prepared math.gl/geoid model retains its degree order and height units', () => {
  const header = new TextEncoder().encode('P5\n# Offset -10\n# Scale 0.5\n4 3\n65535\n');
  const data = new Uint8Array(header.length + 24);
  data.set(header);
  const view = new DataView(data.buffer);
  for (let i = 0; i < 12; i++) view.setUint16(header.length + i * 2, 20 + i);
  const geoid = parsePGM(data, {cubic: false});
  const adapted = createGeoidGrid(geoid);
  const projection = new ProjectionEngine({...options, verticalGrids: {local: adapted}});
  for (const [lon, lat] of [
    [10, 40],
    [-120, -45],
    [179, 0]
  ]) {
    const offset = geoid.getHeight(lat, lon);
    expect(Number.isFinite(offset)).toBe(true);
    close(projection.project([lon, lat, 100, 7]), [lon, lat, 100 + offset, 7]);
    close(projection.unproject([lon, lat, 100 + offset, 7]), [lon, lat, 100, 7]);
  }
});

test('horizontal grid stages sample source and destination heights on their own side', () => {
  const projection = new ProjectionEngine({
    from: '+proj=longlat +datum=WGS84 +nadgrids=shift +geoidgrids=local',
    to: '+proj=longlat +datum=WGS84 +geoidgrids=local',
    verticalGrids: {local: {getOffset: longitude => longitude / radians}},
    datumGrids: {
      shift: {
        subgridCount: 1,
        shift: (longitude, latitude, inverse) => [
          longitude + (inverse ? -1 : 1) * radians,
          latitude
        ]
      }
    }
  });
  close(projection.project([10, 40, 100, 7]), [11, 40, 99, 7]);
  close(projection.unproject([11, 40, 99, 7]), [10, 40, 100, 7]);
});
