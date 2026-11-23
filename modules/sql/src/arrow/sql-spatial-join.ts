// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {DataType, type Table} from 'apache-arrow';
import {
  getGeoArrowFieldInfo,
  getGeoArrowVectorRowBounds,
  visitWKB,
  type GeoArrowBounds
} from '@math.gl/core/arrow';
import type {Expression} from '../expressions';
import {compileArrowExpression} from './compiler';
import {gatherArrowJoin, makeArrowJoinSchema} from './relational-query';
import {indexedSpatialJoin} from './spatial-join';
import type {ArrowFunctionPackage} from './types';

/** SQL predicates with conservative planar envelope bounds. */
const indexedPredicates = new Set(['ST_INTERSECTS', 'ST_CONTAINS', 'ST_DWITHIN']);

/** Extracts a supported standalone spatial call from a JOIN condition. */
export function spatialJoinCall(on: Expression): readonly Expression[] | undefined {
  if (on.type !== 'CallExpression' || on.callee.type !== 'Identifier' || !on.sqlFunction)
    return undefined;
  const name = String(on.callee['name']).toUpperCase();
  if (!indexedPredicates.has(name)) return undefined;
  if (on.arguments.length !== (name === 'ST_DWITHIN' ? 3 : 2))
    throw new Error(`${name} has the wrong number of spatial JOIN arguments`);
  return on.arguments as readonly Expression[];
}

/** Derives the radius once so every candidate probe uses the same threshold. */
export function spatialJoinRadius(argument?: Expression): number {
  if (!argument) return 0;
  if (
    argument.type !== 'Literal' ||
    typeof argument.value !== 'number' ||
    !Number.isFinite(argument.value) ||
    argument.value < 0
  )
    throw new Error('Spatial JOIN ST_DWithin requires a constant finite nonnegative radius');
  return argument.value;
}

/** Walks serialized coordinates directly to avoid decoding WKB before exact refinement. */
function wkbBounds(value: Uint8Array): GeoArrowBounds | null {
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  visitWKB(value, {
    coordinate(x, y) {
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }
  });
  return x0 === Infinity ? null : [x0, y0, x1, y1];
}

/** Prepares a geometry-only input for candidate refinement. */
function geometryInput(table: Table, name: string) {
  const index = table.schema.fields.findIndex(field => field.name === name);
  const field = table.schema.fields[index];
  const info = field && getGeoArrowFieldInfo(field);
  if (!field || !info || info.encoding === 'geoarrow.wkt' || info.encoding === 'geoarrow.box')
    throw new Error(`Spatial JOIN requires a GeoArrow geometry column: ${name}`);
  if (info.metadata['edges'] === 'spherical')
    throw new Error('Spatial JOIN requires planar geometry');
  const geometry = table.selectAt([index]);
  return {
    table,
    geometry,
    /** Reads one envelope per row without copying native coordinate buffers. */
    bounds() {
      if (!table.numRows) return [];
      const vector = geometry.getChildAt(0)!;
      if (info.encoding !== 'geoarrow.wkb') return getGeoArrowVectorRowBounds(vector, {field});
      return Array.from(vector, bytes => (bytes === null ? null : wkbBounds(bytes)));
    }
  };
}

/** Executes a SQL spatial join using the same candidate index as GeoDataFrame. */
export function sqlSpatialJoin(
  left: Table,
  right: Table,
  leftName: string,
  rightName: string,
  rightPrefix: string,
  on: Expression,
  radius: number,
  retainUnmatched: boolean,
  functions?: readonly ArrowFunctionPackage[],
  signal?: AbortSignal
): Table {
  const a = geometryInput(left, leftName);
  const b = geometryInput(right, rightName);
  const inputSchema = makeArrowJoinSchema(a.geometry, b.geometry, rightPrefix);
  const predicate = compileArrowExpression(on, {inputSchema, functions});
  if (!DataType.isBool(predicate.outputField.type))
    throw new Error('Spatial JOIN predicate must return Boolean');
  return indexedSpatialJoin(
    a,
    b,
    {rightPrefix, radius, retainUnmatched, signal},
    (leftRows, rightRows) =>
      predicate.evaluateTable(
        gatherArrowJoin(a.geometry, b.geometry, leftRows, rightRows, inputSchema),
        {signal}
      )
  );
}
