// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {
  concatenateGeoArrowColumns,
  getGeoArrowBounds,
  getGeoArrowRowView,
  interleaveGeoArrowCoordinates,
  iterateGeoArrowBatches,
  makeGeoArrowColumnFromGeometryRows,
  materializeGeoArrowRows,
  sliceGeoArrowColumn,
  validateGeoArrowColumn,
  type GeoArrowColumn,
  type GeoArrowDenseUnion,
  type GeoArrowGeometryValue
} from '../src/index';

const geometries: GeoArrowGeometryValue[] = [
  {type: 'Point', coordinates: [1, 2]},
  {
    type: 'LineString',
    coordinates: [
      [1, 2],
      [3, 4]
    ]
  },
  {
    type: 'Polygon',
    coordinates: [
      [
        [0, 0],
        [2, 0],
        [0, 2],
        [0, 0]
      ]
    ]
  },
  {type: 'MultiPoint', coordinates: [[1, 2]]},
  {
    type: 'MultiLineString',
    coordinates: [
      [
        [1, 2],
        [3, 4]
      ]
    ]
  },
  {
    type: 'MultiPolygon',
    coordinates: [
      [
        [
          [0, 0],
          [2, 0],
          [0, 2],
          [0, 0]
        ]
      ]
    ]
  },
  {type: 'GeometryCollection', geometries: [{type: 'Point', coordinates: [1, 2]}]}
];

/** Collects typed-array objects without depending on a particular physical layout. */
function collectTypedArrays(
  value: unknown,
  arrays = new Set<ArrayBufferView>()
): Set<ArrayBufferView> {
  if (ArrayBuffer.isView(value)) arrays.add(value);
  else if (value && typeof value === 'object') {
    for (const child of Object.values(value)) collectTypedArrays(child, arrays);
  }
  return arrays;
}

test.each(geometries)('borrowed row preserves $type and one-part multi identity', geometry => {
  const source = makeGeoArrowColumnFromGeometryRows([geometry, null, geometry]);
  const originalArrays = collectTypedArrays(source);
  const originalRows = materializeGeoArrowRows(source);
  for (const rowIndex of [0, 1, 2]) {
    const view = getGeoArrowRowView(source, rowIndex);
    expect(view.rowIndex).toBe(rowIndex);
    expect(view.chunkRowIndex).toBe(rowIndex);
    expect(view.chunkIndex).toBe(0);
    expect(materializeGeoArrowRows(view.column)).toEqual([originalRows[rowIndex]]);
    expect(validateGeoArrowColumn(view.column).valid).toBe(true);
    for (const array of collectTypedArrays(view.column))
      expect(originalArrays.has(array)).toBe(true);
  }
  expect(materializeGeoArrowRows(source)).toEqual(originalRows);
});

test.each(['xy', 'xyz', 'xym', 'xyzm'] as const)(
  'retains %s separated coordinates and Int64 offsets',
  dimension => {
    const coordinate =
      dimension === 'xy' ? [1, 2] : dimension === 'xyzm' ? [1, 2, 3, 4] : [1, 2, 3];
    const source = makeGeoArrowColumnFromGeometryRows(
      [
        {type: 'MultiPoint', coordinates: [coordinate]},
        null,
        {type: 'MultiPoint', coordinates: []}
      ],
      {dimension, coordinateLayout: 'separated', offsetType: 'int64'}
    );
    const sliced = sliceGeoArrowColumn(source, 1);
    const nullView = getGeoArrowRowView(sliced, 0);
    const emptyView = getGeoArrowRowView(sliced, 1);
    expect(materializeGeoArrowRows(nullView.column)).toEqual([null]);
    expect(materializeGeoArrowRows(emptyView.column)).toEqual([
      {type: 'MultiPoint', coordinates: []}
    ]);
    expect(emptyView.column.dimension).toBe(dimension);
    expect(emptyView.column.coordinateLayout).toBe('separated');
    expect(validateGeoArrowColumn(emptyView.column).valid).toBe(true);
    for (const array of collectTypedArrays(emptyView))
      expect(collectTypedArrays(source).has(array)).toBe(true);
  }
);

test('batch iteration preserves empty chunks, sliced ranges, metadata and row mapping', () => {
  const source = makeGeoArrowColumnFromGeometryRows([
    {type: 'Point', coordinates: [1, 2]},
    {type: 'Point', coordinates: [3, 4]},
    {type: 'Point', coordinates: [5, 6]}
  ]);
  const metadata = {source: 'fixture'};
  const empty = {...source.chunks[0], length: 0};
  const column = {
    ...source,
    metadata,
    chunks: [empty, ...sliceGeoArrowColumn(source, 1).chunks, empty, ...source.chunks]
  };
  const batches = Array.from(iterateGeoArrowBatches(column));
  expect(batches.map(batch => batch.rowOffset)).toEqual([0, 0, 2, 2]);
  expect(batches.map(batch => batch.chunkIndex)).toEqual([0, 1, 2, 3]);
  for (const batch of batches) {
    expect(batch.column.chunks[0]).toBe(column.chunks[batch.chunkIndex]);
    expect(batch.column.metadata).toBe(metadata);
  }
  const reassembled = concatenateGeoArrowColumns(batches.map(batch => batch.column));
  expect(reassembled.chunks).toEqual(column.chunks);
  expect(reassembled.chunks).not.toBe(column.chunks);
  expect(materializeGeoArrowRows(reassembled)).toEqual(materializeGeoArrowRows(column));
  expect(getGeoArrowRowView(column, 2)).toMatchObject({
    rowIndex: 2,
    chunkIndex: 3,
    chunkRowIndex: 0
  });
  expect(getGeoArrowBounds(getGeoArrowRowView(column, 1).column)).toEqual([5, 6, 5, 6]);
});

test('row views dispatch sliced unions by type ID and retain child dimensions', () => {
  const point = makeGeoArrowColumnFromGeometryRows(
    [{type: 'Point', coordinates: [1, 2, 9]}, null],
    {dimension: 'xym'}
  );
  const polygon = makeGeoArrowColumnFromGeometryRows([geometries[2]]);
  const union: GeoArrowDenseUnion = {
    kind: 'dense-union',
    length: 3,
    typeIds: new Int8Array([3, 21, 21]),
    valueOffsets: new Int32Array([0, 0, 1]),
    children: [
      {
        name: 'Point',
        typeId: 21,
        encoding: 'geoarrow.point',
        dimension: 'xym',
        coordinateLayout: 'interleaved',
        data: point.chunks[0]
      },
      {name: 'Polygon', typeId: 3, data: polygon.chunks[0]}
    ]
  };
  const column: GeoArrowColumn = {...polygon, encoding: 'geoarrow.geometry', chunks: [union]};
  const sliced = sliceGeoArrowColumn(column, 1);
  const view = getGeoArrowRowView(sliced, 0);
  expect(view.column.encoding).toBe('geoarrow.point');
  expect(view.column.dimension).toBe('xym');
  expect(materializeGeoArrowRows(view.column)).toEqual([{type: 'Point', coordinates: [1, 2, 9]}]);
  expect(materializeGeoArrowRows(getGeoArrowRowView(sliced, 1).column)).toEqual([null]);
  expect(getGeoArrowRowView(column, 0).column.encoding).toBe('geoarrow.polygon');
  for (const array of collectTypedArrays(view))
    expect(collectTypedArrays(column).has(array)).toBe(true);

  const masked: GeoArrowColumn = {
    ...column,
    chunks: [{...union, validity: {values: new Uint8Array([0b101])}}]
  };
  expect(materializeGeoArrowRows(getGeoArrowRowView(masked, 1).column)).toEqual([null]);
});

test('union views preserve collections, nulls and empties without regrouping children', () => {
  const rows: Array<GeoArrowGeometryValue | null> = [
    ...geometries,
    null,
    {type: 'Point', coordinates: []},
    {type: 'Polygon', coordinates: []},
    {type: 'GeometryCollection', geometries: []}
  ];
  const source = makeGeoArrowColumnFromGeometryRows(rows, {encoding: 'geoarrow.geometry'});
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const view = getGeoArrowRowView(source, rowIndex);
    expect(materializeGeoArrowRows(view.column)).toEqual([rows[rowIndex]]);
    expect(validateGeoArrowColumn(view.column).valid).toBe(true);
    for (const array of collectTypedArrays(view))
      expect(collectTypedArrays(source).has(array)).toBe(true);
  }
});

test.each([1, 99])('parent-null union rows preserve unused dispatch for type ID %s', typeId => {
  const empty = makeGeoArrowColumnFromGeometryRows([], {encoding: 'geoarrow.point'});
  const union: GeoArrowDenseUnion = {
    kind: 'dense-union',
    length: 2,
    validity: {values: new Uint8Array([0])},
    typeIds: new Int8Array([typeId, typeId]),
    valueOffsets: new Int32Array([0, 0]),
    children: [{name: 'Point', typeId: 1, data: empty.chunks[0]}]
  };
  const source: GeoArrowColumn = {...empty, encoding: 'geoarrow.geometry', chunks: [union]};
  expect(validateGeoArrowColumn(source).valid).toBe(true);
  const view = getGeoArrowRowView(sliceGeoArrowColumn(source, 1), 0);
  expect(view.column.encoding).toBe('geoarrow.geometry');
  expect(validateGeoArrowColumn(view.column).valid).toBe(true);
  expect(materializeGeoArrowRows(view.column)).toEqual([null]);
  expect(getGeoArrowBounds(view.column)).toBeNull();
  for (const array of collectTypedArrays(view))
    expect(collectTypedArrays(source).has(array)).toBe(true);
});

test.each(['interleaved', 'separated'] as const)(
  'union rows inherit %s layout from null child metadata',
  coordinateLayout => {
    const point = makeGeoArrowColumnFromGeometryRows([geometries[0]], {coordinateLayout});
    const union: GeoArrowDenseUnion = {
      kind: 'dense-union',
      length: 1,
      typeIds: new Int8Array([1]),
      valueOffsets: new Int32Array([0]),
      children: [{name: 'Point', typeId: 1, coordinateLayout: null, data: point.chunks[0]}]
    };
    const source: GeoArrowColumn = {...point, encoding: 'geoarrow.geometry', chunks: [union]};
    expect(validateGeoArrowColumn(source).valid).toBe(true);
    const view = getGeoArrowRowView(source, 0);
    expect(view.column.coordinateLayout).toBe(coordinateLayout);
    expect(validateGeoArrowColumn(view.column).valid).toBe(true);
    expect(interleaveGeoArrowCoordinates(view.column).coordinateLayout).toBe('interleaved');
    expect(materializeGeoArrowRows(view.column)).toEqual([geometries[0]]);
  }
);

test('batch iterator does not access later chunks until requested', () => {
  const source = makeGeoArrowColumnFromGeometryRows([geometries[0]]);
  const readLaterChunk = vi.fn(() => source.chunks[0]);
  const chunks = [source.chunks[0]];
  Object.defineProperty(chunks, '1', {get: readLaterChunk});
  const iterator = iterateGeoArrowBatches({...source, chunks});
  const first = iterator.next().value;
  expect(readLaterChunk).not.toHaveBeenCalled();
  expect(first.column.chunks[0]).toBe(source.chunks[0]);
  expect(iterator.next().value.rowOffset).toBe(1);
  expect(readLaterChunk).toHaveBeenCalledTimes(1);
  expect(materializeGeoArrowRows(first.column)).toEqual([geometries[0]]);
});

test('wrapping, nested slicing, row selection and assembly create no typed arrays', () => {
  const source = makeGeoArrowColumnFromGeometryRows(geometries, {encoding: 'geoarrow.geometry'});
  const typedArrayConstructors = [
    'Int8Array',
    'Uint8Array',
    'Uint8ClampedArray',
    'Int16Array',
    'Uint16Array',
    'Int32Array',
    'Uint32Array',
    'Float32Array',
    'Float64Array',
    'BigInt64Array',
    'BigUint64Array'
  ] as const;
  const typedArrayPrototype = Object.getPrototypeOf(Uint8Array.prototype);
  try {
    const subarraySpy = vi.spyOn(typedArrayPrototype, 'subarray');
    const sliceSpy = vi.spyOn(typedArrayPrototype, 'slice');
    const constructorSpies = typedArrayConstructors.map(name => vi.spyOn(globalThis, name));
    const batches = Array.from(iterateGeoArrowBatches(source));
    const column = concatenateGeoArrowColumns(batches.map(batch => batch.column));
    const sliced = sliceGeoArrowColumn(sliceGeoArrowColumn(column, 1), 1, 3);
    getGeoArrowRowView(sliced, 0);
    for (const spy of constructorSpies) expect(spy).not.toHaveBeenCalled();
    expect(subarraySpy).not.toHaveBeenCalled();
    expect(sliceSpy).not.toHaveBeenCalled();
  } finally {
    vi.restoreAllMocks();
  }
});

test('assembly rejects semantic changes and never drops metadata', () => {
  const column = makeGeoArrowColumnFromGeometryRows([geometries[0]]);
  const conflictingColumns: GeoArrowColumn[] = [
    {...column, encoding: 'geoarrow.multipoint'},
    {...column, dimension: 'xym'},
    {...column, coordinateLayout: 'separated'},
    {...column, edges: 'spherical'},
    {...column, spatialReference: null},
    {
      ...column,
      spatialReference: {
        crs: {state: 'unknown', provenance: 'unknown'},
        coordinateFrame: 'unknown',
        coordinateOrder: ['x', 'y']
      }
    },
    {...column, metadata: {source: 'different'}}
  ];
  for (const other of conflictingColumns) {
    expect(() => concatenateGeoArrowColumns([column, other])).toThrow('semantic envelopes');
  }
  expect(concatenateGeoArrowColumns([column, {...column, edges: 'planar'}]).chunks).toHaveLength(2);
  expect(() => concatenateGeoArrowColumns([])).toThrow('At least one');
  expect(concatenateGeoArrowColumns([{...column, chunks: []}]).chunks).toEqual([]);
  expect(Array.from(iterateGeoArrowBatches({...column, chunks: []}))).toEqual([]);
});

test('row access rejects invalid indices, unsupported encodings, and corrupt union dispatch', () => {
  const column = makeGeoArrowColumnFromGeometryRows([geometries[0]]);
  for (const rowIndex of [-1, 0.5, NaN, Infinity, 1, Number.MAX_SAFE_INTEGER + 1]) {
    expect(() => getGeoArrowRowView(column, rowIndex)).toThrow(RangeError);
  }
  for (const encoding of ['geoarrow.wkb', 'geoarrow.wkt', 'geoarrow.box'] as const) {
    const unsupported = {...column, encoding};
    expect(() => getGeoArrowRowView(unsupported, 0)).toThrow('native geometry');
    expect(() => Array.from(iterateGeoArrowBatches(unsupported))).toThrow('native geometry');
    expect(() => concatenateGeoArrowColumns([unsupported])).toThrow('native geometry');
  }
  expect(() => getGeoArrowRowView({...column, encoding: 'geoarrow.geometry'}, 0)).toThrow(
    'dense-union'
  );
  const union: GeoArrowDenseUnion = {
    kind: 'dense-union',
    length: 1,
    typeIds: new Int8Array([1]),
    valueOffsets: new Int32Array([0]),
    children: [{name: 'Point', typeId: 1, data: column.chunks[0]}]
  };
  for (const invalidUnion of [
    {...union, children: []},
    {...union, valueOffsets: new Int32Array([-1])},
    {...union, valueOffsets: new Int32Array([1])},
    {...union, valueOffsets: new Int32Array(0)},
    {...union, children: [{...union.children[0], encoding: 'geoarrow.geometry' as const}]}
  ]) {
    expect(() =>
      getGeoArrowRowView({...column, encoding: 'geoarrow.geometry', chunks: [invalidUnion]}, 0)
    ).toThrow();
  }
});
