// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
import {
  makeGeoArrowColumnFromArrowVector,
  makeArrowVectorFromGeoArrowColumn,
  getGeometryColumnsFromSchema,
  getGeoArrowFieldInfo,
  getGeoArrowExtensionMetadata,
  inspectGeoArrowVector,
  getGeoArrowBounds,
  getGeoArrowRowBounds,
  getGeoArrowVertexCount,
  mapGeoArrowCoordinates,
  rewindGeoArrow,
  inferGeoArrowEncodingFromArrowType
} from '@math.gl/geospatial/geoarrow';
import {
  GeoArrowBuilder,
  makeGeoArrowColumnFromGeometryRows,
  materializeGeoArrowRows
} from '@math.gl/geospatial/geoarrow-utils';

/** Adds canonical GeoArrow extension metadata to an Arrow field. */
function makeField(type: arrow.DataType, encoding = 'geoarrow.point'): arrow.Field {
  return new arrow.Field(
    'geometry',
    type,
    true,
    new Map([
      ['ARROW:extension:name', encoding],
      [
        'ARROW:extension:metadata',
        JSON.stringify({crs: {id: {authority: 'EPSG', code: 4326}}, edges: 'planar'})
      ]
    ])
  );
}

/** Creates points containing an explicit null and semantic coordinate field name. */
function makePoints(dimension = 'xy'): arrow.Vector {
  const size = dimension.length;
  const coordinates = size === 2 ? [[1, 2], null, [3, 4]] : [[1, 2, 99], null, [3, 4, 100]];
  return arrow.vectorFromArray(
    coordinates,
    new arrow.FixedSizeList(size, new arrow.Field(dimension, new arrow.Float64()))
  );
}

test('GeoArrow extension discovery uses Arrow fields and preserves opaque CRS metadata', () => {
  const vector = makePoints();
  const field = makeField(vector.type);
  const info = getGeometryColumnsFromSchema(
    new arrow.Schema([new arrow.Field('id', new arrow.Int32()), field])
  ).get('geometry');
  expect(info).toMatchObject({
    encoding: 'geoarrow.point',
    dimension: 'xy',
    coordinateLayout: 'interleaved',
    metadata: {edges: 'planar'}
  });
  expect(info!.metadata.crs).toEqual({id: {authority: 'EPSG', code: 4326}});
  expect(getGeoArrowFieldInfo(new arrow.Field('other', new arrow.Int32()))).toBeNull();
  expect(
    getGeoArrowExtensionMetadata(
      new arrow.Field(
        'other',
        new arrow.Int32(),
        true,
        new Map([['ARROW:extension:name', 'vendor.other']])
      )
    )
  ).toBeNull();
});

test.each(['not JSON', 'null', '[]', '1'])(
  'GeoArrow rejects malformed extension metadata %s',
  metadata => {
    const vector = makePoints();
    const field = new arrow.Field(
      'geometry',
      vector.type,
      true,
      new Map([
        ['ARROW:extension:name', 'geoarrow.point'],
        ['ARROW:extension:metadata', metadata]
      ])
    );
    expect(() => getGeoArrowExtensionMetadata(field)).toThrow();
  }
);

test('GeoArrow borrows sliced and chunked point buffers with correct null bit offsets', () => {
  const vector = makePoints();
  const field = makeField(vector.type);
  const combined = vector.slice(1).concat(vector.slice(0, 1));
  const column = makeGeoArrowColumnFromArrowVector(combined, {field});
  expect(column.chunks).toHaveLength(2);
  expect(column.chunks[0]!.kind).toBe('fixed-size-list');
  if (
    column.chunks[0]!.kind === 'fixed-size-list' &&
    column.chunks[0]!.child.kind === 'primitive'
  ) {
    expect(column.chunks[0]!.child.values.buffer).toBe(
      combined.data[0]!.children[0]!.values.buffer
    );
  }
  expect(materializeGeoArrowRows(column)).toEqual([
    null,
    {type: 'Point', coordinates: [3, 4]},
    {type: 'Point', coordinates: [1, 2]}
  ]);
  expect(getGeoArrowBounds(combined, {field})).toEqual([1, 2, 3, 4]);
  expect(getGeoArrowRowBounds(combined, {field})).toEqual([null, [3, 4, 3, 4], [1, 2, 1, 2]]);
  expect(getGeoArrowVertexCount(combined, {field})).toBe(2);
  expect(inspectGeoArrowVector(combined, {field})).toMatchObject({
    valid: true,
    rowCount: 3,
    nullCount: 1
  });
});

test('GeoArrow preserves XYM when adapting and mapping without modifying input', () => {
  const vector = makePoints('xym');
  const field = makeField(vector.type);
  const column = makeGeoArrowColumnFromArrowVector(vector, {field});
  expect(column.dimension).toBe('xym');
  const roundTrip = makeGeoArrowColumnFromArrowVector(makeArrowVectorFromGeoArrowColumn(column));
  expect(roundTrip.dimension).toBe('xym');
  const mapped = mapGeoArrowCoordinates(vector, ([x, y, measure]) => [x! + 10, y! + 20, measure!], {
    field
  });
  expect(Array.from(mapped.get(0) as arrow.Vector)).toEqual([11, 22, 99]);
  expect(Array.from(vector.get(0) as arrow.Vector)).toEqual([1, 2, 99]);
  expect(mapped.get(1)).toBeNull();
  expect(getGeoArrowBounds(mapped, {field})).toEqual([11, 22, 13, 24]);
  expect(mapped.type.children[0]!.nullable).toBe(vector.type.children[0]!.nullable);
});

test('GeoArrow metadata distinguishes physically identical LineString and MultiPoint storage', () => {
  const coordinates = new arrow.FixedSizeList(2, new arrow.Field('xy', new arrow.Float64()));
  const vector = arrow.vectorFromArray(
    [
      [
        [1, 2],
        [3, 4]
      ],
      null
    ],
    new arrow.List(new arrow.Field('vertices', coordinates))
  );
  expect(() => inferGeoArrowEncodingFromArrowType(vector.type)).toThrow(/Ambiguous/);
  const field = makeField(vector.type, 'geoarrow.multipoint');
  const column = makeGeoArrowColumnFromArrowVector(vector, {field});
  expect(column.encoding).toBe('geoarrow.multipoint');
  expect(materializeGeoArrowRows(column)).toEqual([
    {
      type: 'MultiPoint',
      coordinates: [
        [1, 2],
        [3, 4]
      ]
    },
    null
  ]);
  const restored = makeArrowVectorFromGeoArrowColumn(column);
  expect(getGeoArrowBounds(restored, {encoding: column.encoding})).toEqual([1, 2, 3, 4]);
});

test('GeoArrow separated coordinates, polygon rewinding, and mixed unions use existing kernels', () => {
  const polygon = GeoArrowBuilder.build(
    [
      {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [0, 2],
            [2, 2],
            [0, 0]
          ]
        ]
      },
      null
    ],
    {encoding: 'geoarrow.polygon', dimension: 'xy', coordinateLayout: 'separated'}
  );
  const vector = makeArrowVectorFromGeoArrowColumn(polygon);
  const field = makeField(vector.type, 'geoarrow.polygon');
  const rewound = rewindGeoArrow(vector, {field, outer: 'counter-clockwise'});
  expect(getGeoArrowBounds(rewound, {field})).toEqual([0, 0, 2, 2]);
  expect(rewound.get(1)).toBeNull();
  const mixed = makeGeoArrowColumnFromGeometryRows(
    [
      {type: 'Point', coordinates: [1, 2]},
      {
        type: 'LineString',
        coordinates: [
          [3, 4],
          [5, 6]
        ]
      },
      null
    ],
    {encoding: 'geoarrow.geometry', dimension: 'xy'}
  );
  const mixedVector = makeArrowVectorFromGeoArrowColumn(mixed);
  expect(Array.from((mixedVector.type as arrow.DenseUnion).typeIds)).toEqual([1, 2]);
  const adapted = makeGeoArrowColumnFromArrowVector(mixedVector);
  expect(materializeGeoArrowRows(adapted)).toEqual(materializeGeoArrowRows(mixed));
});

test('GeoArrow serialized geometry is borrowed and reports no field-level coordinate dimension', () => {
  const vector = arrow.vectorFromArray(['POINT (1 2)', null], new arrow.Utf8());
  const field = makeField(vector.type, 'geoarrow.wkt');
  expect(getGeoArrowFieldInfo(field)).toMatchObject({encoding: 'geoarrow.wkt', dimension: null});
  const restored = makeArrowVectorFromGeoArrowColumn(
    makeGeoArrowColumnFromArrowVector(vector, {field})
  );
  expect(restored.toArray()).toEqual(['POINT (1 2)', null]);
  expect(() => mapGeoArrowCoordinates(vector, coordinate => coordinate, {field})).toThrow(/native/);
});

test('GeoArrow rejects mismatched fields and unsupported coordinate storage', () => {
  const vector = makePoints();
  expect(() =>
    makeGeoArrowColumnFromArrowVector(vector, {field: makeField(new arrow.Int32())})
  ).toThrow(/expected type/);
  const integers = arrow.vectorFromArray(
    [[1, 2]],
    new arrow.FixedSizeList(2, new arrow.Field('xy', new arrow.Int32()))
  );
  expect(() => makeGeoArrowColumnFromArrowVector(integers)).toThrow(/Float32 or Float64/);
});

test('GeoArrow requires explicit Z/M semantics for unnamed three-component coordinates', () => {
  const vector = arrow.vectorFromArray(
    [[1, 2, 9]],
    new arrow.FixedSizeList(3, new arrow.Field('item', new arrow.Float64()))
  );
  expect(() => makeGeoArrowColumnFromArrowVector(vector)).toThrow(/Ambiguous three-component/);
  expect(makeGeoArrowColumnFromArrowVector(vector, {dimension: 'xym'}).dimension).toBe('xym');
});

test('GeoArrow canonical union IDs preserve geometry and M semantics with noncanonical names', () => {
  const pointType = new arrow.FixedSizeList(3, new arrow.Field('item', new arrow.Float64()));
  const point = arrow.vectorFromArray([[1, 2, 9]], pointType);
  const type = new arrow.DenseUnion([21], [new arrow.Field('custom', pointType)]);
  const vector = new arrow.Vector([
    new arrow.Data(
      type,
      0,
      1,
      0,
      {
        [arrow.BufferType.TYPE]: new Int8Array([21]),
        [arrow.BufferType.OFFSET]: new Int32Array([0])
      },
      [point.data[0]!]
    )
  ]);
  const column = makeGeoArrowColumnFromArrowVector(vector);
  expect(column.dimension).toBe('xym');
  expect(materializeGeoArrowRows(column)).toEqual([{type: 'Point', coordinates: [1, 2, 9]}]);
});

test('GeoArrow rejects metadata/storage mismatches before native processing', () => {
  const text = arrow.vectorFromArray(['POINT (1 2)'], new arrow.Utf8());
  expect(() =>
    makeGeoArrowColumnFromArrowVector(text, {field: makeField(text.type, 'geoarrow.wkb')})
  ).toThrow(/does not match/);
  const point = makePoints();
  expect(() =>
    makeGeoArrowColumnFromArrowVector(point, {field: makeField(point.type, 'geoarrow.polygon')})
  ).toThrow(/list levels/);
  expect(() => makeGeoArrowColumnFromArrowVector(point, {dimension: 'xym'})).toThrow(/dimension/);
});

test('GeoArrow mixed coordinate layouts stay distinct through mapping', () => {
  const point = arrow.vectorFromArray(
    [[1, 2]],
    new arrow.FixedSizeList(2, new arrow.Field('xy', new arrow.Float64()))
  );
  const separated = new arrow.Struct([
    new arrow.Field('x', new arrow.Float64()),
    new arrow.Field('y', new arrow.Float64())
  ]);
  const line = arrow.vectorFromArray(
    [
      [
        {x: 3, y: 4},
        {x: 5, y: 6}
      ]
    ],
    new arrow.List(new arrow.Field('vertices', separated))
  );
  const type = new arrow.DenseUnion(
    [1, 2],
    [new arrow.Field('custom point', point.type), new arrow.Field('custom line', line.type)]
  );
  const vector = new arrow.Vector([
    new arrow.Data(
      type,
      0,
      2,
      0,
      {
        [arrow.BufferType.TYPE]: new Int8Array([1, 2]),
        [arrow.BufferType.OFFSET]: new Int32Array([0, 0])
      },
      [point.data[0]!, line.data[0]!]
    )
  ]);
  const field = makeField(type, 'geoarrow.geometry');
  expect(getGeoArrowFieldInfo(field)!.coordinateLayout).toBeNull();
  expect(inspectGeoArrowVector(vector, {field}).valid).toBe(true);
  const moved = mapGeoArrowCoordinates(vector, ([x, y]) => [x! + 10, y! + 20], {field});
  expect(getGeoArrowBounds(moved, {field})).toEqual([11, 22, 15, 26]);
  expect(arrow.DataType.isStruct(moved.type.children[1]!.type.children[0]!.type)).toBe(true);
});

test('GeoArrow mapping and rewinding restore noncanonical union tags together with the source type', () => {
  const point = arrow.vectorFromArray(
    [[1, 2]],
    new arrow.FixedSizeList(2, new arrow.Field('xy', new arrow.Float64()))
  );
  const type = new arrow.DenseUnion([42], [new arrow.Field('point', point.type)]);
  const vector = new arrow.Vector([
    new arrow.Data(
      type,
      0,
      1,
      0,
      {
        [arrow.BufferType.TYPE]: new Int8Array([42]),
        [arrow.BufferType.OFFSET]: new Int32Array([0])
      },
      [point.data[0]!]
    )
  ]);
  const field = makeField(type, 'geoarrow.geometry');
  const mapped = mapGeoArrowCoordinates(vector, ([x, y]) => [x! + 10, y! + 20], {field});
  expect(mapped.data[0]!.typeIds[0]).toBe(42);
  expect(Array.from(mapped.get(0) as arrow.Vector)).toEqual([11, 22]);
  const rewound = rewindGeoArrow(vector, {field});
  expect(rewound.data[0]!.typeIds[0]).toBe(42);
  expect(Array.from(rewound.get(0) as arrow.Vector)).toEqual([1, 2]);
});

test('GeoArrow rejects mixed per-axis precision before transforming buffers', () => {
  const type = new arrow.Struct([
    new arrow.Field('x', new arrow.Float32()),
    new arrow.Field('y', new arrow.Float64())
  ]);
  const vector = arrow.vectorFromArray([{x: 1, y: 2}], type);
  expect(() => makeGeoArrowColumnFromArrowVector(vector)).toThrow(/same floating-point precision/);
});

test('GeoArrow box bounds remain readable without treating boxes as coordinate tuples', () => {
  const type = new arrow.Struct(
    ['xmin', 'ymin', 'xmax', 'ymax'].map(name => new arrow.Field(name, new arrow.Float64()))
  );
  const vector = arrow.vectorFromArray([{xmin: 1, ymin: 2, xmax: 3, ymax: 4}], type);
  const field = makeField(type, 'geoarrow.box');
  expect(getGeoArrowBounds(vector, {field})).toEqual([1, 2, 3, 4]);
  expect(rewindGeoArrow(vector, {field})).toBe(vector);
  expect(() => mapGeoArrowCoordinates(vector, coordinate => coordinate, {field})).toThrow(
    /box storage/
  );
});

test.each([
  [
    'geoarrow.point',
    [{type: 'Point', coordinates: [-5, -6]}, null, {type: 'Point', coordinates: [3, 4]}]
  ],
  [
    'geoarrow.linestring',
    [
      {
        type: 'LineString',
        coordinates: [
          [-5, -6],
          [-7, -8]
        ]
      },
      null,
      {
        type: 'LineString',
        coordinates: [
          [3, 4],
          [7, 8]
        ]
      }
    ]
  ],
  [
    'geoarrow.polygon',
    [
      {
        type: 'Polygon',
        coordinates: [
          [
            [-5, -6],
            [-7, -6],
            [-7, -8],
            [-5, -6]
          ]
        ]
      },
      null,
      {
        type: 'Polygon',
        coordinates: [
          [
            [3, 4],
            [7, 4],
            [7, 8],
            [3, 4]
          ]
        ]
      }
    ]
  ],
  [
    'geoarrow.geometry',
    [
      {type: 'Point', coordinates: [-5, -6]},
      null,
      {
        type: 'LineString',
        coordinates: [
          [3, 4],
          [7, 8]
        ]
      }
    ]
  ]
] as const)(
  'GeoArrow imports physical Arrow slices without applying offsets twice: %s',
  (encoding, rows) => {
    const column = makeGeoArrowColumnFromGeometryRows(rows as never, {encoding, dimension: 'xy'});
    const vector = makeArrowVectorFromGeoArrowColumn(column).slice(1, 3);
    const adapted = makeGeoArrowColumnFromArrowVector(vector, {encoding});
    expect(materializeGeoArrowRows(adapted)).toEqual(rows.slice(1));
  }
);
