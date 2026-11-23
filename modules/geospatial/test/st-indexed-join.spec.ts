// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  GeoArrowBuilder,
  makeArrowVectorFromGeoArrowColumn,
  parseWKT,
  writeWKB,
  type GeoArrowBuilderEncoding
} from '@math.gl/core/arrow';
import {ST_CONTAINS, ST_DWITHIN, ST_INTERSECTS} from '@math.gl/geospatial/st-functions';
import {queryArrowSQL} from '@math.gl/sql/query';
import {Binary, Field, Int32, Schema, Table, vectorFromArray} from 'apache-arrow';
import {expect, test} from 'vitest';

/** Builds an indexed-join relation in native or WKB storage. */
function relation(rows: (string | null)[], encoding: GeoArrowBuilderEncoding | 'geoarrow.wkb') {
  const values = rows.map(row => row && parseWKT(row));
  const g =
    encoding === 'geoarrow.wkb'
      ? vectorFromArray(
          values.map(row => row && writeWKB(row)),
          new Binary()
        )
      : makeArrowVectorFromGeoArrowColumn(GeoArrowBuilder.build(values, {encoding}));
  const id = vectorFromArray(
    rows.map((_, index) => index),
    new Int32()
  );
  return new Table(
    new Schema([
      new Field('id', id.type, false),
      new Field('g', g.type, true, new Map([['ARROW:extension:name', encoding]]))
    ]),
    {id, g}
  );
}

test('spatial joins retain exact containment semantics and stable left/right ordering', () => {
  const points = relation(['POINT(0 5)', 'POINT(5 5)', 'POINT(2 2)', null], 'geoarrow.point');
  const areas = relation(
    ['POLYGON((0 0,10 0,10 10,0 10,0 0),(4 4,4 6,6 6,6 4,4 4))', 'POLYGON((1 1,3 1,3 3,1 3,1 1))'],
    'geoarrow.wkb'
  );
  const tables = new Map([
    ['points', points],
    ['areas', areas]
  ]);
  const result = queryArrowSQL(
    'SELECT p.id AS point, a.id AS area FROM points p LEFT JOIN areas a ON ST_Contains(a.g,p.g)',
    tables,
    {functions: [ST_CONTAINS]}
  );
  expect([...result.getChild('point')!]).toEqual([0, 1, 2, 2, 3]);
  expect([...result.getChild('area')!]).toEqual([null, null, 0, 1, null]);
  const intersects = queryArrowSQL(
    'SELECT p.id AS point FROM points p JOIN areas a ON ST_Intersects(p.g,a.g)',
    tables,
    {functions: [ST_INTERSECTS]}
  );
  expect([...intersects.getChild('point')!]).toEqual([0, 2, 2]);
  const empty = queryArrowSQL(
    'SELECT a.g AS geometry FROM points p LEFT JOIN areas a ON ST_Intersects(a.g,p.g)',
    new Map([
      ['points', points],
      ['areas', new Table(areas.schema, [])]
    ]),
    {functions: [ST_INTERSECTS]}
  );
  expect([...empty.getChild('geometry')!]).toEqual([null, null, null, null]);
});

test('proximity expands search bounds and then checks the exact inclusive radius in coordinate units', () => {
  const left = relation(['POINT(0 0)', 'POINT(50 50)'], 'geoarrow.point');
  const right = relation(['POINT(3 4)', 'POINT(4 4)', 'POINT(50 50)'], 'geoarrow.point');
  const tables = new Map([
    ['lhs', left],
    ['rhs', right]
  ]);
  const result = queryArrowSQL(
    'SELECT r.id AS id FROM lhs l JOIN rhs r ON ST_DWithin(l.g,r.g,:radius)',
    tables,
    {functions: [ST_DWITHIN], parameters: {radius: 5}}
  );
  expect([...result.getChild('id')!]).toEqual([0, 2]);
  expect(() =>
    queryArrowSQL('SELECT r.id FROM lhs l JOIN rhs r ON ST_DWithin(l.g,r.g,l.id)', tables, {
      functions: [ST_DWITHIN]
    })
  ).toThrow(/constant finite nonnegative radius/);
});

test('widely separated rows never enter the exact predicate batch', () => {
  const left = relation(['POINT(0 0)', 'POINT(100 100)'], 'geoarrow.point');
  const right = relation(['POINT(0 0)', 'POINT(500 500)', 'POINT(100 100)'], 'geoarrow.point');
  let candidates = 0;
  const predicate: typeof ST_INTERSECTS = {
    ...ST_INTERSECTS,
    /** Counts the rows evaluated by the actual intersection kernel. */
    resolvePrototype(fields) {
      const bound = ST_INTERSECTS.resolvePrototype!(fields)!;
      return {
        ...bound,
        /** Delegates exact refinement with the original argument order. */
        evaluate(vectors, context) {
          candidates += context.length;
          return bound.evaluate(vectors, context);
        }
      };
    }
  };
  const result = queryArrowSQL(
    'SELECT l.id FROM lhs l JOIN rhs r ON ST_Intersects(l.g,r.g)',
    new Map([
      ['lhs', left],
      ['rhs', right]
    ]),
    {functions: [predicate]}
  );
  expect(result.numRows).toBe(2);
  expect(candidates).toBe(2);
});
