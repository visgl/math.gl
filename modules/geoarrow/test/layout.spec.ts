// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  convertGeoArrowColumn,
  GeoArrowBuilder,
  getGeoArrowBounds,
  getGeoArrowRowBounds,
  getGeoArrowTransferList,
  getGeoArrowVertexCount,
  inspectGeoArrowColumn,
  interleaveGeoArrowCoordinates,
  makeGeoArrowColumnFromGeometryRows,
  sliceGeoArrowColumn,
  validateGeoArrowColumn,
  type GeoArrowArray,
  type GeoArrowColumn,
  type GeoArrowDimension,
  type GeoArrowGeometryValue
} from '../src/index';
import {prepareGeoArrowTransfer} from '../src/worker';
import {getEncodingForGeometryValue, isGeoArrowValueValid, sliceGeoArrowArray} from '../src/layout';

const concreteFixtures: GeoArrowGeometryValue[] = [
  {type: 'Point', coordinates: [1, 2]},
  {
    type: 'LineString',
    coordinates: [
      [0, 0],
      [1, 1]
    ]
  },
  {
    type: 'Polygon',
    coordinates: [
      [
        [0, 0],
        [2, 0],
        [2, 2],
        [0, 0]
      ]
    ]
  },
  {
    type: 'MultiPoint',
    coordinates: [
      [0, 0],
      [1, 1]
    ]
  },
  {
    type: 'MultiLineString',
    coordinates: [
      [
        [0, 0],
        [1, 1]
      ],
      [
        [2, 2],
        [3, 3]
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
          [2, 2],
          [0, 0]
        ]
      ]
    ]
  }
];

test('GeoArrowBuilder writes all concrete geometry families', () => {
  for (const fixture of concreteFixtures) {
    const column = makeGeoArrowColumnFromGeometryRows([fixture, null]);
    const inspection = inspectGeoArrowColumn(column);
    expect(inspection.valid, fixture.type).toBe(true);
    expect(inspection.rowCount).toBe(2);
    expect(inspection.nullCount).toBe(1);
    expect(inspection.coordinateCount).toBeGreaterThan(0);
  }
});

test('GeoArrowBuilder measure and write passes have exact parity', () => {
  const rows: Array<GeoArrowGeometryValue | null> = [
    {
      type: 'Polygon',
      coordinates: [
        [
          [0, 0, 5, 9],
          [4, 0, 6, 9],
          [0, 4, 7, 9],
          [0, 0, 5, 9]
        ]
      ]
    },
    null,
    {type: 'Polygon', coordinates: []}
  ];
  const options = {
    encoding: 'geoarrow.polygon' as const,
    dimension: 'xyzm' as const,
    coordinateLayout: 'separated' as const,
    offsetType: 'int64' as const
  };
  const measure = new GeoArrowBuilder({...options, mode: 'measure'});
  rows.forEach(row => measure.append(row));
  const target = measure.allocateTarget();
  const write = new GeoArrowBuilder({...options, mode: 'write', target});
  rows.forEach(row => write.append(row));
  const column = write.finish();

  expect(measure.getMeasurement()).toEqual(write.getMeasurement());
  expect(target.geometryOffsets).toBeInstanceOf(BigInt64Array);
  expect(validateGeoArrowColumn(column).valid).toBe(true);
  expect(getGeoArrowBounds(column)).toEqual([0, 0, 4, 4]);
  expect(getGeoArrowVertexCount(column)).toBe(4);
});

test('GeoArrowBuilder event API writes coordinates without Arrow objects', () => {
  const options = {
    encoding: 'geoarrow.linestring' as const,
    dimension: 'xy' as const,
    coordinateLayout: 'interleaved' as const
  };
  const measure = new GeoArrowBuilder({...options, mode: 'measure'});
  measure
    .beginGeometry('LineString', 'xy', 2)
    .beginRing(2)
    .writeCoordinate(1, 2)
    .writeCoordinate(3, 4)
    .endGeometry();
  const write = new GeoArrowBuilder({...options, mode: 'write', target: measure.allocateTarget()});
  write
    .beginGeometry('LineString', 'xy', 2)
    .beginRing(2)
    .writeCoordinate(1, 2)
    .writeCoordinate(3, 4)
    .endGeometry();
  const column = write.finish();
  expect(getGeoArrowVertexCount(column)).toBe(2);
  expect(getGeoArrowBounds(column)).toEqual([1, 2, 3, 4]);
});

test('dimensions, coordinate layouts and Int32/Int64 offsets conform', () => {
  const dimensions: GeoArrowDimension[] = ['xy', 'xyz', 'xym', 'xyzm'];
  for (const dimension of dimensions) {
    const size = dimension === 'xy' ? 2 : dimension === 'xyzm' ? 4 : 3;
    const coordinate = Array.from({length: size}, (_, index) => index + 1);
    for (const coordinateLayout of ['interleaved', 'separated'] as const) {
      for (const offsetType of ['int32', 'int64'] as const) {
        const column = GeoArrowBuilder.build(
          [{type: 'LineString', coordinates: [coordinate, coordinate]}],
          {encoding: 'geoarrow.linestring', dimension, coordinateLayout, offsetType}
        );
        expect(validateGeoArrowColumn(column).valid).toBe(true);
        expect(getGeoArrowVertexCount(column)).toBe(2);
        const interleaved = interleaveGeoArrowCoordinates(column);
        expect(interleaved.coordinateLayout).toBe('interleaved');
        expect(getGeoArrowBounds(interleaved)).toEqual([1, 2, 1, 2]);
      }
    }
  }
});

test('identity conversion and full slices preserve descriptor and buffer identity', () => {
  const column = GeoArrowBuilder.build([{type: 'Point', coordinates: [1, 2]}], {
    encoding: 'geoarrow.point'
  });
  const buffers = getGeoArrowTransferList(column);
  expect(convertGeoArrowColumn(column)).toBe(column);
  expect(interleaveGeoArrowCoordinates(column)).toBe(column);
  expect(sliceGeoArrowColumn(column)).toBe(column);
  expect(getGeoArrowTransferList(column)[0]).toBe(buffers[0]);
  const transfer = prepareGeoArrowTransfer(column);
  expect(transfer.column).toBe(column);
  expect(transfer.transferList).toEqual(buffers);
});

test('sliced validity bitmaps, chunks, nulls and empties are honored', () => {
  const first = GeoArrowBuilder.build(
    [
      {type: 'Point', coordinates: [0, 0]},
      null,
      {type: 'Point', coordinates: [2, 2]},
      {type: 'Point', coordinates: [3, 3]}
    ],
    {encoding: 'geoarrow.point'}
  );
  const second = GeoArrowBuilder.build([{type: 'Point', coordinates: [4, 4]}, null], {
    encoding: 'geoarrow.point'
  });
  const chunked: GeoArrowColumn = {...first, chunks: [...first.chunks, ...second.chunks]};
  const sliced = sliceGeoArrowColumn(chunked, 1, 5);
  expect(inspectGeoArrowColumn(sliced)).toMatchObject({
    rowCount: 4,
    nullCount: 1,
    coordinateCount: 3
  });
  expect(getGeoArrowBounds(sliced)).toEqual([2, 2, 4, 4]);
  expect(getGeoArrowRowBounds(sliced)).toEqual([null, [2, 2, 2, 2], [3, 3, 3, 3], [4, 4, 4, 4]]);
});

test('dense unions and geometry collections dispatch without row-shape assumptions', () => {
  const column = makeGeoArrowColumnFromGeometryRows([
    {type: 'Point', coordinates: [1, 2]},
    null,
    {
      type: 'LineString',
      coordinates: [
        [3, 4],
        [5, 6]
      ]
    },
    {
      type: 'GeometryCollection',
      geometries: [
        {type: 'Point', coordinates: [7, 8]},
        {
          type: 'Polygon',
          coordinates: [
            [
              [0, 0],
              [1, 0],
              [0, 1],
              [0, 0]
            ]
          ]
        }
      ]
    }
  ]);
  expect(column.encoding).toBe('geoarrow.geometry');
  expect(validateGeoArrowColumn(column).valid).toBe(true);
  expect(inspectGeoArrowColumn(column)).toMatchObject({rowCount: 4, nullCount: 1});
  expect(getGeoArrowVertexCount(column)).toBe(8);
  expect(getGeoArrowBounds(column)).toEqual([0, 0, 7, 8]);
});

test('validation reports malformed layouts and unsafe offsets', () => {
  const malformed: GeoArrowColumn = {
    encoding: 'geoarrow.linestring',
    dimension: 'xy',
    coordinateLayout: 'interleaved',
    chunks: [
      {
        kind: 'list',
        length: 1,
        offsets: new Int32Array([0, 3]),
        child: {
          kind: 'fixed-size-list',
          length: 1,
          size: 2,
          child: {kind: 'primitive', length: 2, values: new Float64Array(2)}
        },
        validity: {values: new Uint8Array(0)}
      }
    ]
  };
  const validation = validateGeoArrowColumn(malformed);
  expect(validation.valid).toBe(false);
  expect(validation.issues.map(issue => issue.code)).toContain('invalid-validity');
  expect(validation.issues.map(issue => issue.code)).toContain('invalid-offset');

  const wrongPoint: GeoArrowColumn = {
    encoding: 'geoarrow.point',
    dimension: 'xy',
    coordinateLayout: 'interleaved',
    chunks: [{kind: 'primitive', length: 1, values: new Float64Array([1])}]
  };
  expect(validateGeoArrowColumn(wrongPoint).issues.map(issue => issue.code)).toContain(
    'invalid-layout'
  );

  const unsafeOffsets: GeoArrowColumn = {
    encoding: 'geoarrow.linestring',
    dimension: 'xy',
    coordinateLayout: 'interleaved',
    chunks: [
      {
        kind: 'list',
        length: 1,
        offsets: new BigInt64Array([BigInt(Number.MAX_SAFE_INTEGER) + 1n, 0n]),
        child: {
          kind: 'fixed-size-list',
          length: 0,
          size: 2,
          child: {kind: 'primitive', length: 0, values: new Float64Array(0)}
        }
      }
    ]
  };
  expect(validateGeoArrowColumn(unsafeOffsets).issues.map(issue => issue.code)).toContain(
    'unsafe-offset'
  );

  for (const offset of [-1, 0.5]) {
    const invalidFixedSizeList: GeoArrowColumn = {
      encoding: 'geoarrow.point',
      dimension: 'xy',
      coordinateLayout: 'interleaved',
      chunks: [
        {
          kind: 'fixed-size-list',
          length: 1,
          size: 2,
          offset,
          child: {kind: 'primitive', length: 2, values: new Float64Array([1, 2])}
        }
      ]
    };
    expect(validateGeoArrowColumn(invalidFixedSizeList).issues.map(issue => issue.code)).toContain(
      'invalid-offset'
    );
  }
});

test('layout validation covers every physical storage and logical encoding guard', () => {
  const primitive = (length = 1): GeoArrowArray => ({
    kind: 'primitive',
    length,
    values: new Float64Array(length)
  });
  const column = (
    encoding: GeoArrowColumn['encoding'],
    chunk: GeoArrowArray,
    layout: GeoArrowColumn['coordinateLayout'] = 'interleaved'
  ): GeoArrowColumn => ({
    encoding,
    dimension: 'xy',
    coordinateLayout: layout,
    chunks: [chunk]
  });
  const codes = (value: GeoArrowColumn): string[] =>
    validateGeoArrowColumn(value).issues.map(issue => issue.code);

  expect(isGeoArrowValueValid(undefined, 0)).toBe(true);
  expect(isGeoArrowValueValid({values: new Uint8Array([0b00000100]), bitOffset: 2}, 0)).toBe(true);
  expect(isGeoArrowValueValid({values: new Uint8Array([0b00000100]), bitOffset: 2}, 1)).toBe(false);
  expect(getEncodingForGeometryValue({type: 'Point', coordinates: [0, 0]})).toBe('geoarrow.point');

  expect(codes(column('geoarrow.wkb', primitive()))).toContain('invalid-layout');
  expect(
    codes(
      column('geoarrow.wkt', {
        ...primitive(),
        kind: 'serialized',
        encoding: 'binary',
        offsets: new Int32Array([0, 0]),
        values: new Uint8Array()
      } as GeoArrowArray)
    )
  ).toContain('invalid-layout');
  expect(codes(column('geoarrow.box', primitive()))).toContain('invalid-layout');
  expect(codes({...column('geoarrow.point', primitive()), coordinateLayout: null})).toContain(
    'invalid-layout'
  );
  expect(
    codes(
      column('geoarrow.point', {
        kind: 'list',
        length: 1,
        offsets: new Int32Array([0, 1]),
        child: primitive()
      })
    )
  ).toContain('invalid-layout');
  expect(
    codes(
      column('geoarrow.point', {kind: 'fixed-size-list', length: 1, size: 2, child: primitive()})
    )
  ).toContain('invalid-child');
  expect(
    codes(
      column(
        'geoarrow.point',
        {kind: 'struct', length: 1, children: {x: primitive()}} as GeoArrowArray,
        'separated'
      )
    )
  ).toContain('invalid-layout');
  expect(codes(column('geoarrow.geometry', primitive()))).toContain('invalid-layout');
  expect(codes(column('geoarrow.geometrycollection', primitive()))).toContain('invalid-layout');

  const invalidUnion: GeoArrowArray = {
    kind: 'dense-union',
    length: 1,
    typeIds: new Int8Array([9]),
    valueOffsets: new Int32Array([4]),
    children: [
      {name: 'point', typeId: 1, data: primitive()},
      {name: 'point', typeId: 1, data: primitive()},
      {name: 'mystery', typeId: 2, data: primitive()}
    ]
  };
  expect(codes(column('geoarrow.geometry', invalidUnion))).toEqual(
    expect.arrayContaining(['invalid-union', 'invalid-layout'])
  );

  expect(sliceGeoArrowArray(primitive(3), 1, 3)).toMatchObject({length: 2, offset: 1});
  expect(
    sliceGeoArrowArray({kind: 'fixed-size-list', length: 3, size: 2, child: primitive(6)}, 1, 3)
  ).toMatchObject({length: 2, offset: 1});
  expect(
    sliceGeoArrowArray(
      {kind: 'list', length: 3, offsets: new Int32Array([0, 1, 2, 3]), child: primitive(3)},
      1,
      3
    )
  ).toMatchObject({length: 2, offset: 1});
  expect(
    sliceGeoArrowArray({kind: 'struct', length: 3, children: {x: primitive(3)}}, 1, 3)
  ).toMatchObject({length: 2, offset: 1});
  expect(
    sliceGeoArrowArray(
      {
        kind: 'dense-union',
        length: 3,
        typeIds: new Int8Array(3),
        valueOffsets: new Int32Array(3),
        children: []
      },
      1,
      3
    )
  ).toMatchObject({length: 2, offset: 1});
});

test('box descriptors validate and contribute bounds without coordinate materialization', () => {
  const column: GeoArrowColumn = {
    encoding: 'geoarrow.box',
    dimension: 'xy',
    coordinateLayout: 'separated',
    chunks: [
      {
        kind: 'struct',
        length: 2,
        children: {
          xmin: {kind: 'primitive', length: 2, values: new Float64Array([1, -5])},
          ymin: {kind: 'primitive', length: 2, values: new Float64Array([2, -4])},
          xmax: {kind: 'primitive', length: 2, values: new Float64Array([3, 8])},
          ymax: {kind: 'primitive', length: 2, values: new Float64Array([4, 9])}
        }
      }
    ]
  };
  expect(validateGeoArrowColumn(column).valid).toBe(true);
  expect(getGeoArrowBounds(column)).toEqual([-5, -4, 8, 9]);
  expect(getGeoArrowVertexCount(column)).toBe(0);
});
