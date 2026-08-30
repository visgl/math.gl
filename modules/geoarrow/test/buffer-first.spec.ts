import {expect, test} from 'vitest';
import {GeoArrowBuilder} from '../src/builder-entry';
import {getGeoArrowRowBounds, mapGeoArrowCoordinates, validateGeoArrowColumn} from '../src/index';
import type {GeoArrowColumn} from '../src/types';

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
