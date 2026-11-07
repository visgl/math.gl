// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import assert from 'node:assert/strict';
import * as arrow from 'apache-arrow';
import {
  getGeometryColumnsFromSchema, makeGeoArrowColumnFromArrowVector,
  makeArrowVectorFromGeoArrowColumn, getGeoArrowBounds, mapGeoArrowCoordinates
} from '../../src/geoarrow/index.ts';
import {materializeGeoArrowRows, makeGeoArrowColumnFromGeometryRows, sliceGeoArrowColumn} from '../../src/geoarrow-utils/index.ts';

/** Checks borrowing, nulls, slices, semantic metadata, mapping, and newer runtime storage. */
export function checkGeoArrowConformance() {
  const type = new arrow.FixedSizeList(3, new arrow.Field('xym', new arrow.Float64()));
  const vector = arrow.vectorFromArray([[1, 2, 9], null, [3, 4, 10]], type);
  const field = new arrow.Field('geometry', type, true, new Map([['ARROW:extension:name', 'geoarrow.point']]));
  assert.equal(getGeometryColumnsFromSchema(new arrow.Schema([field])).get('geometry').dimension, 'xym');
  const sliced = vector.slice(1).concat(vector.slice(0, 1));
  const column = makeGeoArrowColumnFromArrowVector(sliced, {field});
  assert.deepEqual(materializeGeoArrowRows(column), [null, {type: 'Point', coordinates: [3, 4, 10]}, {type: 'Point', coordinates: [1, 2, 9]}]);
  assert.equal(column.chunks[0].child.values.buffer, sliced.data[0].children[0].values.buffer);
  assert.deepEqual(getGeoArrowBounds(sliced, {field}), [1, 2, 3, 4]);
  const rebuilt = makeArrowVectorFromGeoArrowColumn(column);
  assert.equal(makeGeoArrowColumnFromArrowVector(rebuilt).dimension, 'xym');
  const moved = mapGeoArrowCoordinates(vector, ([x, y, measure]) => [x + 10, y + 20, measure], {field});
  assert.deepEqual(Array.from(moved.get(0)), [11, 22, 9]);
  assert.deepEqual(Array.from(vector.get(0)), [1, 2, 9]);
  for (const [encoding, rows] of [
    ['geoarrow.point', [{type:'Point',coordinates:[-5,-6]},null,{type:'Point',coordinates:[3,4]}]],
    ['geoarrow.linestring', [{type:'LineString',coordinates:[[-5,-6],[-7,-8]]},null,{type:'LineString',coordinates:[[3,4],[7,8]]}]],
    ['geoarrow.polygon', [{type:'Polygon',coordinates:[[[-5,-6],[-7,-6],[-7,-8],[-5,-6]]]},null,{type:'Polygon',coordinates:[[[3,4],[7,4],[7,8],[3,4]]]}]],
    ['geoarrow.geometry', [{type:'Point',coordinates:[-5,-6]},null,{type:'LineString',coordinates:[[3,4],[7,8]]}]]
  ]) {
    const original = makeArrowVectorFromGeoArrowColumn(makeGeoArrowColumnFromGeometryRows(rows, {encoding,dimension:'xy'}));
    assert.deepEqual(materializeGeoArrowRows(makeGeoArrowColumnFromArrowVector(original.slice(1,3), {encoding})), rows.slice(1));
  }
  const optionalTypes = {...arrow};
  if (optionalTypes.LargeList) {
    const list = arrow.vectorFromArray([[[1, 2, 9], [3, 4, 10]], null], new optionalTypes.LargeList(new arrow.Field('vertices', type)));
    const options = {encoding: 'geoarrow.linestring'};
    const adapted = makeGeoArrowColumnFromArrowVector(list, options);
    assert.deepEqual(getGeoArrowBounds(makeArrowVectorFromGeoArrowColumn(adapted), options), [1, 2, 3, 4]);
  }
  if (optionalTypes.Utf8View) {
    const values = ['LINESTRING (0 0, 1 1, 2 2)', null, 'POINT (3 4)'];
    const view = arrow.vectorFromArray(values, new optionalTypes.Utf8View());
    const viewColumn = makeGeoArrowColumnFromArrowVector(view);
    assert.deepEqual(makeArrowVectorFromGeoArrowColumn(viewColumn).toArray(), values);
    assert.deepEqual(makeArrowVectorFromGeoArrowColumn(sliceGeoArrowColumn(viewColumn, 1, 3)).toArray(), values.slice(1));
    assert.deepEqual(makeArrowVectorFromGeoArrowColumn(makeGeoArrowColumnFromArrowVector(view.slice(1,3))).toArray(), values.slice(1));
  }
}
