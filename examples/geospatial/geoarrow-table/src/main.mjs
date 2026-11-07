// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {
  getGeometryColumnsFromSchema,
  makeGeoArrowColumnFromArrowVector,
  makeArrowVectorFromGeoArrowColumn,
  getGeoArrowBounds,
  mapGeoArrowCoordinates
} from '@math.gl/geospatial/geoarrow';
import {materializeGeoArrowRows} from '@math.gl/geospatial/geoarrow-utils';

const vector = arrow.vectorFromArray(
  [[1, 2], null, [3, 4]],
  new arrow.FixedSizeList(2, new arrow.Field('xy', new arrow.Float64()))
);
const field = new arrow.Field(
  'geometry',
  vector.type,
  true,
  new Map([
    ['ARROW:extension:name', 'geoarrow.point'],
    ['ARROW:extension:metadata', JSON.stringify({edges: 'planar'})]
  ])
);
const table = new arrow.Table(new arrow.Schema([field]), {geometry: vector});
const column = makeGeoArrowColumnFromArrowVector(table.getChild('geometry'), {field});
const roundTrip = makeArrowVectorFromGeoArrowColumn(column);
const moved = mapGeoArrowCoordinates(vector, ([x, y]) => [x + 10, y + 20], {field});
// biome-ignore lint/suspicious/noConsole: This CLI prints the table conversion results.
console.log(
  JSON.stringify(
    {
      encoding: getGeometryColumnsFromSchema(table.schema).get('geometry').encoding,
      bounds: getGeoArrowBounds(vector, {field}),
      movedBounds: getGeoArrowBounds(moved, {field}),
      roundTripRows: roundTrip.length,
      rows: materializeGeoArrowRows(column)
    },
    null,
    2
  )
);
