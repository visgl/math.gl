// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  convertGeoArrowColumn,
  GeoArrowBuilder,
  getGeoArrowBounds,
  getGeoArrowTransferList,
  getGeoArrowVertexCount,
  inspectGeoArrowColumn,
  interleaveGeoArrowCoordinates,
  makeGeoArrowColumnFromGeometryRows,
  sliceGeoArrowColumn,
  validateGeoArrowColumn,
  type GeoArrowColumn,
  type GeoArrowDimension,
  type GeoArrowGeometryValue
} from '../src/index';
import {prepareGeoArrowTransfer} from '../src/worker';

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
