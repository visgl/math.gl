// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {geoEquirectangular, geoOrthographic} from 'd3-geo';
import {
  GeoArrowBuilder,
  makeGeoArrowColumnFromGeometryRows,
  streamGeoArrow,
  tessellateGeoArrowStream,
  sliceGeoArrowColumn
} from '../../src/geoarrow/index';
import type {GeoArrowGeometryValue, GeoArrowGeometryStream} from '../../src/geoarrow/index';
const polygon: GeoArrowGeometryValue = {
  type: 'Polygon',
  coordinates: [
    [
      [0, 0],
      [4, 0],
      [4, 4],
      [0, 4],
      [0, 0]
    ],
    [
      [1, 1],
      [1, 3],
      [3, 3],
      [3, 1],
      [1, 1]
    ]
  ]
};
const seam: GeoArrowGeometryValue = {
  type: 'Polygon',
  coordinates: [
    [
      [170, -10],
      [170, 10],
      [-170, 10],
      [-170, -10],
      [170, -10]
    ]
  ]
};
function sink(events: unknown[]): GeoArrowGeometryStream {
  return {
    point: (x, y) => events.push([x, y]),
    lineStart: () => events.push('lineStart'),
    lineEnd: () => events.push('lineEnd'),
    polygonStart: () => events.push('polygonStart'),
    polygonEnd: () => events.push('polygonEnd')
  };
}
test('physical streams retain chunked/sliced null row identities and omit closing vertices', () => {
  const column = GeoArrowBuilder.build([null, polygon, null, polygon], {
    encoding: 'geoarrow.polygon',
    dimension: 'xy'
  });
  const sliced = sliceGeoArrowColumn(column, 1, 3);
  const rows: number[] = [],
    events: unknown[] = [];
  streamGeoArrow(sliced, sink(events), {
    sourceRowOffset: 20,
    onRowStart: i => rows.push(i),
    onRowEnd: i => rows.push(-i)
  });
  expect(rows).toEqual([20, -20, 21, -21]);
  expect(events.filter(Array.isArray)).toHaveLength(8);
  expect(events[0]).toBe('polygonStart');
  expect(events.at(-1)).toBe('polygonEnd');
  expect(tessellateGeoArrowStream(sliced, {sourceRowOffset: 20}).polygonSourceRows).toEqual(
    new Uint32Array([20])
  );
});
test('streams traverse separated, mixed and collection geometry without materialization', () => {
  const values: GeoArrowGeometryValue[] = [
    {
      type: 'GeometryCollection',
      geometries: [
        {
          type: 'MultiPoint',
          coordinates: [
            [1, 2],
            [3, 4]
          ]
        },
        {
          type: 'MultiLineString',
          coordinates: [
            [
              [0, 0],
              [1, 1]
            ]
          ]
        },
        {
          type: 'MultiPolygon',
          coordinates: [(polygon as Extract<GeoArrowGeometryValue, {type: 'Polygon'}>).coordinates]
        }
      ]
    }
  ];
  const column = makeGeoArrowColumnFromGeometryRows(values, {
    encoding: 'geoarrow.geometry',
    dimension: 'xy',
    coordinateLayout: 'separated'
  });
  const events: unknown[] = [];
  streamGeoArrow(column, sink(events));
  expect(events.filter(Array.isArray)).toHaveLength(12);
  expect(tessellateGeoArrowStream(column).polygonSourceRows).toEqual(new Uint32Array([0]));
});
test('stream tessellation classifies holes and disconnected exteriors independently of winding', () => {
  const column = GeoArrowBuilder.build([polygon], {encoding: 'geoarrow.polygon', dimension: 'xy'});
  const mesh = tessellateGeoArrowStream(column);
  let area = 0;
  for (let i = 0; i < mesh.indices.length; i += 3) {
    const [a, b, c] = Array.from(mesh.indices.slice(i, i + 3), n => [
      mesh.positions[n * 2],
      mesh.positions[n * 2 + 1]
    ]);
    area += Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])) / 2;
  }
  expect(area).toBeCloseTo(12);
  const disjoint = tessellateGeoArrowStream(column, {
    createStream: out => ({
      ...out,
      polygonEnd() {
        out.lineStart();
        for (const [x, y] of [
          [10, 0],
          [11, 0],
          [10, 1]
        ])
          out.point(x, y);
        out.lineEnd();
        out.polygonEnd();
      }
    })
  });
  expect(disjoint.polygonStarts.length).toBe(3);
  expect(disjoint.polygonSourceRows).toEqual(new Uint32Array([0, 0]));
});
test('D3 stream cuts the antimeridian and clips the far hemisphere', () => {
  const column = GeoArrowBuilder.build([seam], {encoding: 'geoarrow.polygon', dimension: 'xy'});
  const projection = geoEquirectangular().scale(1).translate([0, 0]);
  const mesh = tessellateGeoArrowStream(column, {createStream: s => projection.stream(s)});
  expect(mesh.polygonSourceRows.length).toBe(2);
  expect(Array.from(mesh.polygonSourceRows)).toEqual([0, 0]);
  expect(mesh.positions.every(Number.isFinite)).toBe(true);
  expect(
    tessellateGeoArrowStream(column, {createStream: s => geoOrthographic().stream(s)}).indices
      .length
  ).toBe(0);
});
test('stream contracts reject unsupported dimensions, invalid storage and exhausted budgets', () => {
  const column = GeoArrowBuilder.build([polygon], {encoding: 'geoarrow.polygon', dimension: 'xy'});
  const events: unknown[] = [];
  expect(() => streamGeoArrow({...column, dimension: 'xyz'}, sink(events))).toThrow();
  expect(() => streamGeoArrow({...column, encoding: 'geoarrow.wkb'}, sink(events))).toThrow();
  expect(() => streamGeoArrow(column, sink(events), {sourceRowOffset: -1})).toThrow();
  expect(() =>
    streamGeoArrow(
      {
        ...column,
        chunks: [
          {kind: 'list', length: 1, offsets: new Int32Array([0, 999]), child: column.chunks[0]}
        ]
      },
      sink(events)
    )
  ).toThrow();
  for (const opts of [
    {maxVertices: 1},
    {maxTriangles: 0},
    {maxRingComparisons: 0},
    {maxVertices: -1},
    {sourceRowOffset: 2 ** 32},
    {limits: {maximumRows: 0}}
  ])
    expect(() => tessellateGeoArrowStream(column, opts)).toThrow();
  expect(() =>
    tessellateGeoArrowStream(column, {createStream: s => ({...s, polygonEnd() {}})})
  ).toThrow(/flush/);
  expect(() =>
    tessellateGeoArrowStream(column, {
      createStream: s => ({
        ...s,
        point() {
          s.point(NaN, 0);
        }
      })
    })
  ).toThrow(/point/);
});

test('stream rejects hidden higher dimensions and handles empty points', () => {
  const mixed = makeGeoArrowColumnFromGeometryRows([{type: 'Point', coordinates: [1, 2, 3]}], {
    encoding: 'geoarrow.geometry',
    dimension: 'xyz'
  });
  expect(() => streamGeoArrow({...mixed, dimension: 'xy'}, sink([]))).toThrow(/XY/);
  const empty = GeoArrowBuilder.build([{type: 'Point', coordinates: [NaN, NaN]}], {
    encoding: 'geoarrow.point',
    dimension: 'xy'
  });
  const events: unknown[] = [];
  streamGeoArrow(empty, sink(events));
  expect(events).toEqual([]);
  const bad = GeoArrowBuilder.build([{type: 'Point', coordinates: [1, Infinity]}], {
    encoding: 'geoarrow.point',
    dimension: 'xy'
  });
  expect(() => streamGeoArrow(bad, sink([]))).toThrow(/Nonfinite/);
});

test('stream sink rejects malformed event sequences and drops degenerate rings', () => {
  const column = GeoArrowBuilder.build([polygon], {encoding: 'geoarrow.polygon', dimension: 'xy'});
  for (const createStream of [
    (out: GeoArrowGeometryStream) => ({
      ...out,
      polygonStart() {
        out.polygonStart();
        out.polygonStart();
      }
    }),
    (out: GeoArrowGeometryStream) => ({
      ...out,
      lineStart() {
        out.lineStart();
        out.lineStart();
      }
    }),
    (out: GeoArrowGeometryStream) => ({...out, lineStart() {}}),
    (out: GeoArrowGeometryStream) => ({
      ...out,
      lineEnd() {
        out.lineEnd();
        out.lineEnd();
      }
    }),
    (out: GeoArrowGeometryStream) => ({
      ...out,
      polygonEnd() {
        out.polygonEnd();
        out.polygonEnd();
      }
    })
  ])
    expect(() => tessellateGeoArrowStream(column, {createStream})).toThrow();
  const result = tessellateGeoArrowStream(column, {
    createStream: out => ({
      ...out,
      point() {
        out.point(0, 0);
      }
    })
  });
  expect(result.indices.length).toBe(0);
});
