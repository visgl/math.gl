// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {
  GeoArrowBuilder,
  makeGeoArrowColumnFromGeometryRows,
  materializeGeoArrowRows,
  sliceGeoArrowColumn,
  type GeoArrowColumn
} from '../src/index';

test.each(['interleaved', 'separated'] as const)(
  'materialization preserves sliced chunked null and empty rows (%s)',
  coordinateLayout => {
    const source = GeoArrowBuilder.build(
      [
        {type: 'LineString', coordinates: [[99, 99]]},
        null,
        {type: 'LineString', coordinates: []},
        {
          type: 'LineString',
          coordinates: [
            [1, 2],
            [3, 4]
          ]
        }
      ],
      {encoding: 'geoarrow.linestring', coordinateLayout}
    );
    const first = sliceGeoArrowColumn(source, 1, 3);
    const last = sliceGeoArrowColumn(source, 3, 4);
    const column = {...source, chunks: [...first.chunks, ...last.chunks]};
    expect(materializeGeoArrowRows(column)).toEqual([
      null,
      {type: 'LineString', coordinates: []},
      {
        type: 'LineString',
        coordinates: [
          [1, 2],
          [3, 4]
        ]
      }
    ]);
    expect(materializeGeoArrowRows(source)[0]).toEqual({
      type: 'LineString',
      coordinates: [[99, 99]]
    });
    const rows = materializeGeoArrowRows(column);
    (rows[2] as {coordinates: number[][]}).coordinates[0][0] = 100;
    expect(materializeGeoArrowRows(column)[2]).toEqual({
      type: 'LineString',
      coordinates: [
        [1, 2],
        [3, 4]
      ]
    });
  }
);

test.each(['interleaved', 'separated'] as const)(
  'materialization distinguishes empty points from null rows (%s)',
  coordinateLayout => {
    const validity = {values: new Uint8Array([3])};
    const chunks: GeoArrowColumn['chunks'] =
      coordinateLayout === 'interleaved'
        ? [
            {
              kind: 'fixed-size-list',
              size: 2,
              length: 3,
              validity,
              child: {
                kind: 'primitive',
                length: 6,
                values: new Float64Array([NaN, NaN, 10, 20, 30, 40]),
                validity: {values: new Uint8Array([3])}
              }
            }
          ]
        : [
            {
              kind: 'struct',
              length: 3,
              validity,
              children: {
                x: {
                  kind: 'primitive',
                  length: 3,
                  values: new Float64Array([NaN, 10, 30]),
                  validity: {values: new Uint8Array([1])}
                },
                y: {
                  kind: 'primitive',
                  length: 3,
                  values: new Float64Array([NaN, 20, 40]),
                  validity: {values: new Uint8Array([1])}
                }
              }
            }
          ];
    const column: GeoArrowColumn = {
      encoding: 'geoarrow.point',
      dimension: 'xy',
      coordinateLayout,
      chunks
    };
    expect(materializeGeoArrowRows(column)).toEqual([
      {type: 'Point', coordinates: []},
      {type: 'Point', coordinates: []},
      null
    ]);
    expect(materializeGeoArrowRows(sliceGeoArrowColumn(column, 1, 3))).toEqual([
      {type: 'Point', coordinates: []},
      null
    ]);
  }
);

test('materialization preserves union child nulls and geometry collections', () => {
  const rows = [
    {type: 'Point' as const, coordinates: [1, 2]},
    null,
    {
      type: 'GeometryCollection' as const,
      geometries: [{type: 'LineString' as const, coordinates: []}]
    }
  ];
  expect(materializeGeoArrowRows(makeGeoArrowColumnFromGeometryRows(rows))).toEqual(rows);
});

test.each(['geoarrow.wkb', 'geoarrow.wkt'] as const)(
  'materialization requires explicit decoding of %s',
  encoding => {
    const column: GeoArrowColumn = {encoding, dimension: 'xy', chunks: []};
    expect(() => materializeGeoArrowRows(column)).toThrow(
      'Serialized GeoArrow columns must be decoded before materialization'
    );
  }
);
