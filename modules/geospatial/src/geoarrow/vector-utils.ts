// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Vector, type Data, type DataType, type Field, type Schema} from 'apache-arrow';
import {
  getGeoArrowBounds as getColumnBounds,
  getGeoArrowRowBounds as getColumnRowBounds,
  getGeoArrowVertexCount as getColumnVertexCount,
  inspectGeoArrowColumn,
  mapGeoArrowCoordinates as mapColumnCoordinates,
  rewindGeoArrow as rewindColumn,
  type GeoArrowBounds,
  type GeoArrowColumnInspection,
  type GeoArrowCoordinateMapper,
  type GeoArrowCoordinateLayout,
  type GeoArrowDimension,
  type RewindGeoArrowOptions
} from '../geoarrow-utils/index';
import {getGeoArrowExtensionMetadata, type GeoArrowExtensionMetadata} from './metadata';
import {
  makeGeoArrowColumnFromArrowVector,
  makeArrowVectorFromGeoArrowColumn,
  assertArrowGeoArrowType,
  inferGeoArrowDimensionFromArrowType,
  inferGeoArrowCoordinateLayoutFromArrowType,
  type MakeGeoArrowColumnFromArrowVectorOptions
} from './arrow-adapter';

/** GeoArrow extension metadata and native layout facts for an Arrow field. */
export type GeoArrowFieldInfo = GeoArrowExtensionMetadata &
  Readonly<{
    /** Semantic native dimension; serialized geometry dimensions require content inspection. */
    dimension: GeoArrowDimension | null;
    /** Native coordinate organization, or null for serialized/mixed storage. */
    coordinateLayout: GeoArrowCoordinateLayout | null;
  }>;

/** Reads a recognized field extension and native layout without decoding geometry rows. */
export function getGeoArrowFieldInfo(field: Field): GeoArrowFieldInfo | null {
  const extension = getGeoArrowExtensionMetadata(field);
  if (!extension) return null;
  assertArrowGeoArrowType(field.type, extension.encoding);
  const serialized = extension.encoding === 'geoarrow.wkb' || extension.encoding === 'geoarrow.wkt';
  return {
    ...extension,
    dimension: serialized ? null : inferGeoArrowDimensionFromArrowType(field.type),
    coordinateLayout: serialized ? null : inferGeoArrowCoordinateLayoutFromArrowType(field.type)
  };
}

/** Discovers recognized GeoArrow columns using Arrow's extension metadata. */
export function getGeometryColumnsFromSchema(
  schema: Schema
): ReadonlyMap<string, GeoArrowFieldInfo> {
  const columns = new Map<string, GeoArrowFieldInfo>();
  for (const field of schema.fields) {
    const info = getGeoArrowFieldInfo(field);
    if (info) columns.set(field.name, info);
  }
  return columns;
}

/** Inspects an Arrow geometry vector through borrowed physical descriptors. */
export function inspectGeoArrowVector(
  vector: Vector,
  options?: MakeGeoArrowColumnFromArrowVectorOptions
): GeoArrowColumnInspection {
  return inspectGeoArrowColumn(makeGeoArrowColumnFromArrowVector(vector, options));
}

/** Computes a coordinate-space extent through the Arrow-independent geometry kernel. */
export function getGeoArrowBounds(
  vector: Vector,
  options?: MakeGeoArrowColumnFromArrowVectorOptions
): GeoArrowBounds | null {
  return getColumnBounds(makeGeoArrowColumnFromArrowVector(vector, options));
}

/** Computes row extents in logical vector order, retaining null rows. */
export function getGeoArrowRowBounds(
  vector: Vector,
  options?: MakeGeoArrowColumnFromArrowVectorOptions
): readonly (GeoArrowBounds | null)[] {
  return getColumnRowBounds(makeGeoArrowColumnFromArrowVector(vector, options));
}

/** Counts native vertices using the existing geometry kernel. */
export function getGeoArrowVertexCount(
  vector: Vector,
  options?: MakeGeoArrowColumnFromArrowVectorOptions
): number {
  return getColumnVertexCount(makeGeoArrowColumnFromArrowVector(vector, options));
}

/** Returns a transformed vector without modifying the input's coordinate buffers. */
export function mapGeoArrowCoordinates(
  vector: Vector,
  mapper: GeoArrowCoordinateMapper,
  options?: MakeGeoArrowColumnFromArrowVectorOptions
): Vector {
  return preserveArrowType(
    makeArrowVectorFromGeoArrowColumn(
      mapColumnCoordinates(makeGeoArrowColumnFromArrowVector(vector, options), mapper)
    ),
    vector.type
  );
}

/** Returns a rewound native polygon vector through the Arrow-independent kernel. */
export function rewindGeoArrow(
  vector: Vector,
  options?: MakeGeoArrowColumnFromArrowVectorOptions & RewindGeoArrowOptions
): Vector {
  return preserveArrowType(
    makeArrowVectorFromGeoArrowColumn(
      rewindColumn(makeGeoArrowColumnFromArrowVector(vector, options), options)
    ),
    vector.type
  );
}

/** Preserves Arrow child field names, nullability and metadata for topology-preserving kernels. */
function preserveArrowType(vector: Vector, type: DataType): Vector {
  return new Vector(vector.data.map(data => preserveArrowDataType(data, type)));
}

/** Recursively retags compatible physical buffers with the source Arrow type. */
function preserveArrowDataType(data: Data, type: DataType): Data {
  const children = data.children.map((child, index) =>
    preserveArrowDataType(child, type.children[index]!.type)
  );
  return data.clone(type, data.offset, data.length, data.nullCount, data.buffers, children);
}
