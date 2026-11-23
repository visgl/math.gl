// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  GeoArrowBuilder,
  makeArrowVectorFromGeoArrowColumn,
  makeGeoArrowColumnFromArrowVector,
  materializeGeoArrowRows,
  parseWKT
} from '@math.gl/core/arrow';
import {createSTCoverageSimplify} from '@math.gl/geospatial/st-functions';
import {queryArrowSQL} from '@math.gl/sql/query';
import {Field, Int32, Schema, Table, vectorFromArray} from 'apache-arrow';
import {expect, test} from 'vitest';

/** Right feature whose shared border runs opposite the left feature's border. */
const right = 'POLYGON((5 0,10 0,10 10,5 10,6 5,5 0))';
/** Shared border with a one-unit excursion. */
const leftShell = '(0 0,5 0,6 5,5 10,0 10,0 0)';

/** Builds two adjacent polygon features in different input batches. */
function coverage(
  left: string,
  rightGeometry = right,
  encoding: 'geoarrow.polygon' | 'geoarrow.multipolygon' = 'geoarrow.polygon'
) {
  const geometry = makeArrowVectorFromGeoArrowColumn(
    GeoArrowBuilder.build([parseWKT(left), parseWKT(rightGeometry), null], {encoding})
  );
  const id = vectorFromArray([11, 12, 13], new Int32());
  const schema = new Schema([
    new Field('id', id.type, false),
    new Field(
      'geometry',
      geometry.type,
      true,
      new Map([
        ['ARROW:extension:name', encoding],
        ['ARROW:extension:metadata', '{"crs":"EPSG:3857"}']
      ])
    )
  ]);
  const table = new Table(schema, {id, geometry});
  return new Table(schema, [...table.slice(0, 1).batches, ...table.slice(1).batches]);
}

/** Runs the whole-coverage table function through SQL. */
function simplify(table: Table, tolerance: number) {
  const result = queryArrowSQL(
    'SELECT * FROM ST_CoverageSimplify(parcels)',
    new Map([['parcels', table]]),
    {functions: [createSTCoverageSimplify({geometry: 'geometry', tolerance})]}
  );
  return {
    result,
    rows: materializeGeoArrowRows(
      makeGeoArrowColumnFromArrowVector(result.getChild('geometry')!, {
        field: result.schema.fields[1]!
      })
    )
  };
}

test('simplifies a shared edge in both input batches without changing the coverage outline', () => {
  const left = `POLYGON(${leftShell})`;
  const table = coverage(left);
  const {result, rows} = simplify(table, 1);
  expect(rows).toEqual([
    parseWKT('POLYGON((0 0,5 0,5 10,0 10,0 0))'),
    parseWKT('POLYGON((5 0,10 0,10 10,5 10,5 0))'),
    null
  ]);
  expect([...result.getChild('id')!]).toEqual([11, 12, 13]);
  expect(result.schema.fields[1]!.metadata).toEqual(table.schema.fields[1]!.metadata);
  expect(result.batches.map(batch => batch.numRows)).toEqual([1, 2]);
  expect(simplify(table, 0.99).rows).toEqual([parseWKT(left), parseWKT(right), null]);
});

test('retains a shared bend when a hole obstructs the replacement', () => {
  const left = `POLYGON(${leftShell},(5.2 4.8,5.2 5.2,5.4 5.2,5.4 4.8,5.2 4.8))`;
  expect(simplify(coverage(left), 1).rows).toEqual([parseWKT(left), parseWKT(right), null]);
});

test('preserves multipolygon components and attributes while simplifying a shared component edge', () => {
  const left = `MULTIPOLYGON((${leftShell}),((20 0,22 0,22 2,20 2,20 0)))`;
  const other = 'MULTIPOLYGON(((5 0,10 0,10 10,5 10,6 5,5 0)))';
  const table = coverage(left, other, 'geoarrow.multipolygon');
  const {result, rows} = simplify(table, 1);
  expect(rows).toEqual([
    parseWKT('MULTIPOLYGON(((0 0,5 0,5 10,0 10,0 0)),((20 0,22 0,22 2,20 2,20 0)))'),
    parseWKT('MULTIPOLYGON(((5 0,10 0,10 10,5 10,5 0)))'),
    null
  ]);
  expect(result.batches[0]!.data.children[0]!.values.buffer).toBe(
    table.batches[0]!.data.children[0]!.values.buffer
  );
});
