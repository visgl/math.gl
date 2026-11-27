// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  GeoArrowBuilder,
  makeArrowVectorFromGeoArrowColumn,
  type GeoArrowDenseUnion,
  type GeoArrowList,
  type WellKnownGeometry
} from '@math.gl/core/arrow';
import type {NativeSpatialResult} from './spatial-sql';

/** Concrete result children and their canonical XY selectors. */
const concrete = [
  {type: 'Point', encoding: 'geoarrow.point', id: 1},
  {type: 'LineString', encoding: 'geoarrow.linestring', id: 2},
  {type: 'MultiPoint', encoding: 'geoarrow.multipoint', id: 4},
  {type: 'MultiLineString', encoding: 'geoarrow.multilinestring', id: 5}
] as const;

/** Fixed native mixed-geometry layout shared by every batch. */
export function lineIntersectionResult(): NativeSpatialResult {
  /** Builds the result without serializing coordinates or dispatching on per-batch schema. */
  const build: NativeSpatialResult['build'] = rows =>
    makeArrowVectorFromGeoArrowColumn({
      encoding: 'geoarrow.geometry',
      dimension: 'xy',
      coordinateLayout: 'interleaved',
      chunks: [union(rows, true)]
    });
  return {encoding: 'geoarrow.geometry', type: build([]).type, build};
}

/** Builds concrete children and, at the top level, one collection child. */
function union(
  rows: readonly (WellKnownGeometry | null)[],
  collections: boolean
): GeoArrowDenseUnion {
  const groups = concrete.map((): (WellKnownGeometry | null)[] => []);
  const mixed: WellKnownGeometry[] = [];
  const typeIds = new Int8Array(rows.length);
  const valueOffsets = new Int32Array(rows.length);
  for (let row = 0; row < rows.length; row++) {
    const geometry = rows[row] ?? null;
    if (collections && geometry?.type === 'GeometryCollection') {
      typeIds[row] = 7;
      valueOffsets[row] = mixed.length;
      mixed.push(geometry);
    } else {
      const index = geometry ? concrete.findIndex(child => child.type === geometry.type) : 0;
      const group = groups[index];
      if (!group) throw new Error('Unexpected line intersection result geometry');
      typeIds[row] = concrete[index]!.id;
      valueOffsets[row] = group.length;
      group.push(geometry);
    }
  }
  const children: GeoArrowDenseUnion['children'][number][] = concrete.map(
    ({type, encoding, id}, index) => ({
      name: type,
      encoding,
      typeId: id,
      dimension: 'xy',
      coordinateLayout: 'interleaved',
      data: GeoArrowBuilder.build(groups[index]!, {encoding, dimension: 'xy'}).chunks[0]!
    })
  );
  if (collections) {
    children.push({
      name: 'GeometryCollection',
      encoding: 'geoarrow.geometrycollection',
      typeId: 7,
      dimension: 'xy',
      coordinateLayout: 'interleaved',
      data: collection(mixed)
    });
  }
  return {kind: 'dense-union', length: rows.length, typeIds, valueOffsets, children};
}

/** Packs collection children in a fixed inner union. */
function collection(rows: readonly WellKnownGeometry[]): GeoArrowList {
  const members: WellKnownGeometry[] = [];
  const offsets = new Int32Array(rows.length + 1);
  for (let row = 0; row < rows.length; row++) {
    const geometry = rows[row]!;
    if (geometry.type === 'GeometryCollection')
      for (const child of geometry.geometries) members.push(child);
    offsets[row + 1] = members.length;
  }
  return {kind: 'list', length: rows.length, offsets, child: union(members, false)};
}
