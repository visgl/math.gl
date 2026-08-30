import {expect, test} from 'vitest';
import {GeoArrowBuilder} from '../src/builder-entry';
import {
  getGeoArrowRowBounds,
  makeGeoArrowColumnFromGeometryRows,
  mapGeoArrowCoordinates,
  validateGeoArrowColumn
} from '../src/index';
import type {GeoArrowColumn} from '../src/types';
import {materializeGeoArrowRows} from '../src/layout';

test('subpath builder emits a plain descriptor and row bounds are direct', () => {
  const measure = new GeoArrowBuilder({
    encoding: 'geoarrow.point',
    dimension: 'xy',
    mode: 'measure'
  });
  measure.beginGeometry('Point', 'xy').writeCoordinate(10, 20).endGeometry();
  const write = new GeoArrowBuilder({
    encoding: 'geoarrow.point',
    dimension: 'xy',
    mode: 'write',
    target: measure.allocateTarget()
  });
  write.beginGeometry('Point', 'xy').writeCoordinate(10, 20).endGeometry();
  const column = write.finish();
  expect(validateGeoArrowColumn(column).valid).toBe(true);
  expect(getGeoArrowRowBounds(column)).toEqual([[10, 20, 10, 20]]);
});

test('mixed union children retain their dimensions during identity mapping', () => {
  const xyz = GeoArrowBuilder.build([{type: 'Point', coordinates: [1, 2, 3]}], {
    encoding: 'geoarrow.point',
    dimension: 'xyz'
  });
  const xym = GeoArrowBuilder.build([{type: 'Point', coordinates: [4, 5, 6]}], {
    encoding: 'geoarrow.point',
    dimension: 'xym'
  });
  const xyzChunk = xyz.chunks[0];
  const xymChunk = xym.chunks[0];
  const union: GeoArrowColumn = {
    encoding: 'geoarrow.geometry',
    dimension: 'xy',
    coordinateLayout: 'interleaved',
    chunks: [
      {
        kind: 'dense-union',
        length: 2,
        typeIds: new Int8Array([1, 2]),
        valueOffsets: new Int32Array([0, 0]),
        children: [
          {
            name: 'Point Z',
            typeId: 1,
            encoding: 'geoarrow.point',
            dimension: 'xyz',
            data: xyzChunk
          },
          {name: 'Point M', typeId: 2, encoding: 'geoarrow.point', dimension: 'xym', data: xymChunk}
        ]
      }
    ]
  };
  const mapped = mapGeoArrowCoordinates(union, coordinate => coordinate);
  const children = (
    mapped.chunks[0] as Extract<GeoArrowColumn['chunks'][number], {kind: 'dense-union'}>
  ).children;
  expect(children.map(child => child.dimension)).toEqual(['xyz', 'xym']);
  expect(validateGeoArrowColumn(mapped).valid).toBe(true);
});

test('scalar event writes convert source dimensions without tuple allocation', () => {
  const measure = new GeoArrowBuilder({
    encoding: 'geoarrow.point',
    dimension: 'xyzm',
    coordinateLayout: 'separated',
    coordinateType: 'float32',
    mode: 'measure'
  });
  measure
    .beginGeometry('Point', 'xym')
    .writeCoordinateFromDimension(1, 2, undefined, 9, 'xym')
    .endGeometry();
  const write = new GeoArrowBuilder({
    encoding: 'geoarrow.point',
    dimension: 'xyzm',
    coordinateLayout: 'separated',
    coordinateType: 'float32',
    mode: 'write',
    target: measure.allocateTarget()
  });
  const column = write
    .beginGeometry('Point', 'xym')
    .writeCoordinateFromDimension(1, 2, undefined, 9, 'xym')
    .endGeometry()
    .finish();
  const coordinates = column.chunks[0] as Extract<
    GeoArrowColumn['chunks'][number],
    {kind: 'struct'}
  >;
  const expected = {x: 1, z: 0, m: 9} as const;
  for (const [name, value] of Object.entries(expected)) {
    const child = coordinates.children[name];
    expect(child.kind).toBe('primitive');
    if (child.kind !== 'primitive') throw new Error(`Expected primitive ${name} child`);
    expect(child.values).toEqual(new Float32Array([value]));
  }
});

test('array event writes map every semantic dimension into final buffers', () => {
  const cases = [
    {target: 'xyz' as const, source: 'xy' as const, coordinate: [1, 2], expected: [1, 2, 0]},
    {target: 'xym' as const, source: 'xym' as const, coordinate: [3, 4, 5], expected: [3, 4, 5]},
    {
      target: 'xyzm' as const,
      source: 'xyz' as const,
      coordinate: [6, 7, 8],
      expected: [6, 7, 8, 0]
    }
  ];
  for (const {target, source, coordinate, expected} of cases) {
    const options = {
      encoding: 'geoarrow.point' as const,
      dimension: target,
      coordinateLayout: 'separated' as const
    };
    const feed = (builder: GeoArrowBuilder): void => {
      builder.beginGeometry('Point', source).writeCoordinate(coordinate).endGeometry();
    };
    const measure = new GeoArrowBuilder({...options, mode: 'measure'});
    feed(measure);
    const write = new GeoArrowBuilder({
      ...options,
      mode: 'write',
      target: measure.allocateTarget()
    });
    feed(write);
    expect(materializeGeoArrowRows(write.finish())).toEqual([
      {type: 'Point', coordinates: expected}
    ]);
  }
});

test('event builder rejects structurally invalid event sequences', () => {
  const builder = new GeoArrowBuilder({
    encoding: 'geoarrow.point',
    dimension: 'xy',
    mode: 'measure'
  });
  expect(() => builder.beginPolygon()).toThrow('beginPolygon must follow');
  expect(() => builder.beginRing()).toThrow('beginRing must follow');
  expect(() => builder.writeCoordinate(1, 2)).toThrow('writeCoordinate must follow');
  expect(() => builder.writeCoordinateFromDimension(1, 2, undefined, undefined, 'xy')).toThrow(
    'writeCoordinateFromDimension must follow'
  );
  expect(() => builder.endGeometry()).toThrow('endGeometry without beginGeometry');
});

test('mixed builders encode nulls in a valid dense-union child', () => {
  const column = makeGeoArrowColumnFromGeometryRows([
    {type: 'Point', coordinates: [1, 2]},
    null,
    {type: 'LineString', coordinates: [[3, 4]]}
  ]);
  const union = column.chunks[0] as Extract<
    GeoArrowColumn['chunks'][number],
    {kind: 'dense-union'}
  >;
  expect(union.validity).toBeUndefined();
  expect(
    [...union.typeIds].every(typeId => union.children.some(child => child.typeId === typeId))
  ).toBe(true);
  expect(materializeGeoArrowRows(column)).toEqual([
    {type: 'Point', coordinates: [1, 2]},
    null,
    {type: 'LineString', coordinates: [[3, 4]]}
  ]);
});
