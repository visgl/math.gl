// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Vector, DataType, BufferType, type Data, type Field, type Schema} from 'apache-arrow';
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
  const column = makeGeoArrowColumnFromArrowVector(vector, options);
  if (column.encoding === 'geoarrow.box')
    throw new Error(
      'Coordinate mapping does not accept box storage; map geometry coordinates and recompute bounds instead.'
    );
  return preserveArrowType(
    makeArrowVectorFromGeoArrowColumn(mapColumnCoordinates(column, mapper)),
    vector.type
  );
}

/** Returns a rewound native polygon vector through the Arrow-independent kernel. */
export function rewindGeoArrow(
  vector: Vector,
  options?: MakeGeoArrowColumnFromArrowVectorOptions & RewindGeoArrowOptions
): Vector {
  const column = makeGeoArrowColumnFromArrowVector(vector, options);
  if (column.encoding === 'geoarrow.box') return vector;
  return preserveArrowType(
    makeArrowVectorFromGeoArrowColumn(rewindColumn(column, options)),
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
  let buffers = data.buffers;
  const rebuiltType = data.type;
  if (
    DataType.isDenseUnion(type) &&
    DataType.isDenseUnion(rebuiltType) &&
    type.typeIds.some((typeId, index) => typeId !== rebuiltType.typeIds[index])
  ) {
    const typeIds = Int8Array.from((data.typeIds as Int8Array).subarray(0, data.length), typeId => {
      const childIndex = rebuiltType.typeIdToChildIndex[typeId];
      if (childIndex === undefined)
        throw new Error('Rebuilt GeoArrow union tag has no source child.');
      return type.typeIds[childIndex]!;
    });
    buffers = {...data.buffers, [BufferType.TYPE]: typeIds};
  }
  return data.clone(type, data.offset, data.length, data.nullCount, buffers, children);
}
