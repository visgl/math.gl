// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Binary, DataType, Field, Schema, Table, vectorFromArray} from 'apache-arrow';
import type {TableFunction} from '@math.gl/sql/arrow';
import {getGeoArrowFieldInfo, writeWKB} from '@math.gl/core/arrow';
import {clipGeometryByBox} from './spatial-box-clipping';
import {subdividePolygons} from './spatial-subdivision';
import {
  EXTENSION_NAME,
  geometryTypes,
  planarGeometry,
  readGeometryValue,
  spatialFunction
} from './spatial-sql';

/** Clips a geometry to the XY bounds of an envelope in the same coordinate system. */
export const ST_CLIPBYBOX2D = /* @__PURE__ */ spatialFunction(
  'ST_ClipByBox2D',
  [
    [...geometryTypes, 'GeometryCollection'],
    [...geometryTypes, 'GeometryCollection']
  ],
  /* @__PURE__ */ new Binary(),
  ([geometry, bounds]) => {
    const clipped = clipGeometryByBox(geometry!, bounds!);
    return clipped ? writeWKB(clipped, 'xy') : null;
  }
);

/** Emits polygon subdivisions through a lateral Arrow SQL join using the default vertex cap. */
export const ST_SUBDIVIDE: TableFunction = {
  kind: 'table',
  name: 'ST_Subdivide',
  /** Binds one polygon column and declares a GeoArrow WKB output with its CRS. */
  bindLateral({argument, ordinality}) {
    if (ordinality) throw new Error('ST_Subdivide does not support WITH ORDINALITY');
    const extension = getGeoArrowFieldInfo(argument);
    const encoding = extension?.encoding;
    const isWKB =
      encoding === 'geoarrow.wkb' &&
      (DataType.isBinary(argument.type) || DataType.isLargeBinary(argument.type));
    const isPolygon = encoding === 'geoarrow.polygon' || encoding === 'geoarrow.multipolygon';
    if (!isWKB && !(isPolygon && extension?.dimension === 'xy')) {
      throw new Error('ST_Subdivide requires a 2D GeoArrow Polygon or MultiPolygon');
    }
    if (extension?.metadata['edges'] === 'spherical') {
      throw new Error('ST_Subdivide requires planar geometry');
    }
    const type = new Binary();
    const metadata = new Map(argument.metadata);
    metadata.set(EXTENSION_NAME, 'geoarrow.wkb');
    const outputSchema = new Schema([new Field('geometry', type, false, metadata)]);
    return {
      outputSchema,
      /** Outputs polygon parts grouped by their original parent row indices. */
      evaluate(input, {signal}) {
        const values = input.getChild(argument.name)!;
        const active = Uint8Array.from({length: values.length}, (_, row) =>
          Number(values.isValid(row))
        );
        const read = readGeometryValue(values, argument, active, planarGeometry);
        const parts: Uint8Array[] = [];
        const parentRows: number[] = [];
        for (let row = 0; row < values.length; row++) {
          signal?.throwIfAborted();
          if (!active[row]) continue;
          for (const part of subdividePolygons(read(row), signal)) {
            parts.push(writeWKB(part, 'xy'));
            parentRows.push(row);
          }
        }
        return {
          table: new Table(outputSchema, {geometry: vectorFromArray(parts, type)}),
          parentRows: Int32Array.from(parentRows)
        };
      }
    };
  }
};
