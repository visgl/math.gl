// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {
  GeoArrowArray,
  GeoArrowColumn,
  GeoArrowCoordinateLayout,
  GeoArrowDenseUnion,
  GeoArrowDimension,
  GeoArrowEncoding,
  GeoArrowNumericArray,
  GeoArrowOffsets,
  GeoArrowValidity
} from '@math.gl/geospatial/geoarrow-utils';
import * as arrow from 'apache-arrow';
import {getGeoArrowExtensionMetadata} from './metadata';
import {validateArrowTableSchema} from '@math.gl/core/arrow';

/** Options for adapting an Apache Arrow vector to math.gl's runtime-neutral GeoArrow ABI. */
export type MakeGeoArrowColumnFromArrowVectorOptions = {
  /** Field providing authoritative GeoArrow extension encoding and metadata. */
  field?: arrow.Field;
  /** GeoArrow extension encoding. Inferred from the physical type when omitted. */
  encoding?: GeoArrowEncoding;
  /** Semantic coordinate dimension. Inferred from native coordinate fields when omitted. */
  dimension?: GeoArrowDimension;
  /** Coordinate organization. Inferred from the physical type when omitted. */
  coordinateLayout?: GeoArrowCoordinateLayout | null;
  /** Opaque extension metadata retained on the descriptor envelope. */
  metadata?: Readonly<Record<string, unknown>>;
};

/**
 * Adapts Apache Arrow physical buffers to `@math.gl/geospatial/geoarrow-utils` borrowed descriptors.
 * Arrow slices already adjust numeric buffers, list offsets, union buffers, and fixed-width
 * children. Their Data.offset is retained only as the validity bitmap's bit offset;
 * copying it onto the geometry descriptor would apply the physical slice twice.
 */
export function makeGeoArrowColumnFromArrowVector(
  vector: arrow.Vector,
  options: MakeGeoArrowColumnFromArrowVectorOptions = {}
): GeoArrowColumn {
  if (options.field) {
    const actualSchema = new arrow.Schema([
      new arrow.Field(options.field.name, vector.type, options.field.nullable)
    ]);
    validateArrowTableSchema(
      new arrow.Table(actualSchema, {[options.field.name]: vector}),
      new arrow.Schema([options.field])
    );
  }
  const extension = options.field ? getGeoArrowExtensionMetadata(options.field) : null;
  const encoding =
    options.encoding ?? extension?.encoding ?? inferGeoArrowEncodingFromArrowType(vector.type);
  assertArrowGeoArrowType(vector.type, encoding, options.dimension);
  const dimension =
    options.dimension ??
    (isSerializedArrowType(vector.type) ? 'xy' : inferGeoArrowDimensionFromArrowType(vector.type));
  const coordinateLayout =
    options.coordinateLayout === undefined
      ? inferGeoArrowCoordinateLayoutFromArrowType(vector.type)
      : options.coordinateLayout;

  return {
    encoding,
    dimension,
    coordinateLayout,
    chunks: vector.data.map(data => makeGeoArrowArrayFromArrowData(data)),
    metadata: options.metadata ?? extension?.metadata
  };
}

/** Converts a math.gl GeoArrow descriptor back to an Apache Arrow vector. */
export function makeArrowVectorFromGeoArrowColumn(column: GeoArrowColumn): arrow.Vector {
  return new arrow.Vector(
    column.chunks.map(chunk =>
      makeArrowDataFromGeoArrowArray(chunk, column.dimension, column.coordinateLayout)
    )
  );
}

/** Infers a GeoArrow encoding from an Apache Arrow physical type. */
export function inferGeoArrowEncodingFromArrowType(type: arrow.DataType): GeoArrowEncoding {
  if (arrow.DataType.isDenseUnion(type)) return 'geoarrow.geometry';
  if (
    arrow.DataType.isBinary(type) ||
    arrow.DataType.isLargeBinary(type) ||
    isOptionalArrowType(type, 'BinaryView')
  ) {
    return 'geoarrow.wkb';
  }
  if (
    arrow.DataType.isUtf8(type) ||
    arrow.DataType.isLargeUtf8(type) ||
    isOptionalArrowType(type, 'Utf8View')
  ) {
    return 'geoarrow.wkt';
  }

  if (arrow.DataType.isStruct(type) && type.children[0]?.name === 'xmin') return 'geoarrow.box';
  if (
    (arrow.DataType.isList(type) || isOptionalArrowType(type, 'LargeList')) &&
    arrow.DataType.isDenseUnion(type.children[0]?.type)
  ) {
    return 'geoarrow.geometrycollection';
  }
  const nesting = getArrowListNesting(type);
  switch (nesting) {
    case 0:
      return 'geoarrow.point';
    case 1:
    case 2:
      throw new Error(
        'Ambiguous GeoArrow list nesting: supply a field extension or explicit encoding.'
      );
    case 3:
      return 'geoarrow.multipolygon';
    default:
      throw new Error(`Cannot infer GeoArrow encoding from Arrow type ${type.toString()}`);
  }
}

/** Infers semantic coordinate dimensions from Arrow coordinate fields. */
export function inferGeoArrowDimensionFromArrowType(type: arrow.DataType): GeoArrowDimension {
  if (arrow.DataType.isFixedSizeList(type)) {
    const childType = type.children[0]?.type;
    if (
      !childType ||
      !arrow.DataType.isFloat(childType) ||
      childType.precision === arrow.Precision.HALF
    ) {
      throw new Error('GeoArrow coordinate leaves require Float32 or Float64 storage.');
    }
    const dimensionName = type.children[0]?.name.toLowerCase();
    if (isGeoArrowDimension(dimensionName)) {
      if (dimensionName.length !== type.listSize)
        throw new Error('GeoArrow coordinate dimension does not match its list size.');
      return dimensionName;
    }
    switch (type.listSize) {
      case 2:
        return 'xy';
      case 3:
        throw new Error(
          'Ambiguous three-component coordinates: use a named xyz/xym child or supply dimension explicitly.'
        );
      case 4:
        return 'xyzm';
      default:
        throw new Error(
          `GeoArrow coordinates require 2, 3, or 4 values, received ${type.listSize}`
        );
    }
  }
  if (arrow.DataType.isStruct(type)) {
    if (
      type.children.some(
        field =>
          !arrow.DataType.isFloat(field.type) || field.type.precision === arrow.Precision.HALF
      )
    ) {
      throw new Error('GeoArrow coordinate leaves require Float32 or Float64 storage.');
    }
    if (new Set(type.children.map(field => (field.type as arrow.Float).precision)).size > 1) {
      throw new Error('GeoArrow coordinate axes must use the same floating-point precision.');
    }
    const names = type.children.map(field => field.name.toLowerCase());
    if (names[0] === 'xmin' && names[1] === 'ymin') {
      return names.includes('zmin')
        ? names.includes('mmin')
          ? 'xyzm'
          : 'xyz'
        : names.includes('mmin')
          ? 'xym'
          : 'xy';
    }
    if (names[0] === 'x' && names[1] === 'y') {
      if (names[2] === 'm') return 'xym';
      if (names[2] === 'z' && names[3] === 'm') return 'xyzm';
      if (names[2] === 'z') return 'xyz';
      return 'xy';
    }
  }
  if (arrow.DataType.isList(type) || isOptionalArrowType(type, 'LargeList')) {
    return inferGeoArrowDimensionFromArrowType(type.children[0].type);
  }
  if (arrow.DataType.isDenseUnion(type)) {
    return type.children.reduce<GeoArrowDimension>(
      (dimension, field, index) =>
        mergeGeoArrowDimensions(
          dimension,
          inferGeoArrowDimensionFromUnionChild(field, type.typeIds[index])
        ),
      'xy'
    );
  }
  throw new Error(`Cannot infer GeoArrow dimension from Arrow type ${type.toString()}`);
}

/** Infers whether Arrow coordinate leaves are interleaved or separated. */
export function inferGeoArrowCoordinateLayoutFromArrowType(
  type: arrow.DataType
): GeoArrowCoordinateLayout | null {
  if (arrow.DataType.isFixedSizeList(type)) return 'interleaved';
  if (arrow.DataType.isStruct(type)) return 'separated';
  if (arrow.DataType.isList(type) || isOptionalArrowType(type, 'LargeList')) {
    return inferGeoArrowCoordinateLayoutFromArrowType(type.children[0].type);
  }
  if (arrow.DataType.isDenseUnion(type)) {
    const layouts = new Set(
      type.children
        .map(field => inferGeoArrowCoordinateLayoutFromArrowType(field.type))
        .filter(layout => layout !== null)
    );
    return layouts.size === 1 ? [...layouts][0]! : null;
  }
  return null;
}

/** Borrows physical Arrow buffers as runtime-independent geometry arrays. */
function makeGeoArrowArrayFromArrowData(data: arrow.Data): GeoArrowArray {
  const validity = makeGeoArrowValidity(data);
  if (arrow.DataType.isFixedSizeList(data.type)) {
    return {
      kind: 'fixed-size-list',
      length: data.length,
      size: data.type.listSize,
      child: makeGeoArrowArrayFromArrowData(data.children[0]),
      validity
    };
  }
  if (arrow.DataType.isList(data.type) || isOptionalArrowType(data.type, 'LargeList')) {
    return {
      kind: 'list',
      length: data.length,
      offsets: data.valueOffsets as GeoArrowOffsets,
      child: makeGeoArrowArrayFromArrowData(data.children[0]),
      validity
    };
  }
  if (arrow.DataType.isStruct(data.type)) {
    const children: Record<string, GeoArrowArray> = {};
    for (let childIndex = 0; childIndex < data.type.children.length; childIndex++) {
      children[data.type.children[childIndex].name] = makeGeoArrowArrayFromArrowData(
        data.children[childIndex]
      );
    }
    return {kind: 'struct', length: data.length, children, validity};
  }
  if (arrow.DataType.isDenseUnion(data.type)) {
    const unionType = data.type as arrow.DenseUnion;
    return {
      kind: 'dense-union',
      length: data.length,
      typeIds: data.typeIds as Int8Array | Uint8Array,
      valueOffsets: data.valueOffsets,
      children: unionType.children.map((field, childIndex) => ({
        name: field.name,
        typeId: unionType.typeIds[childIndex],
        encoding: inferGeoArrowEncodingFromUnionChild(field, unionType.typeIds[childIndex]),
        dimension: inferGeoArrowDimensionFromUnionChild(field, unionType.typeIds[childIndex]),
        coordinateLayout: inferGeoArrowCoordinateLayoutFromArrowType(field.type),
        data: makeGeoArrowArrayFromArrowData(data.children[childIndex])
      }))
    };
  }
  if (isOptionalArrowType(data.type, 'BinaryView') || isOptionalArrowType(data.type, 'Utf8View')) {
    const viewBytes = data.values as Uint8Array;
    return {
      kind: 'serialized',
      encoding: isOptionalArrowType(data.type, 'BinaryView') ? 'binary' : 'utf8',
      length: data.length,
      offsets: new Int32Array(0),
      values: new Uint8Array(0),
      views: new Uint32Array(
        viewBytes.buffer,
        viewBytes.byteOffset,
        Math.floor(viewBytes.byteLength / Uint32Array.BYTES_PER_ELEMENT)
      ),
      dataBuffers: (data as arrow.Data & {variadicBuffers?: Uint8Array[]}).variadicBuffers ?? [],
      validity
    };
  }
  if (isOffsetSerializedArrowType(data.type)) {
    return {
      kind: 'serialized',
      encoding:
        arrow.DataType.isBinary(data.type) || arrow.DataType.isLargeBinary(data.type)
          ? 'binary'
          : 'utf8',
      length: data.length,
      offsets: data.valueOffsets as GeoArrowOffsets,
      values: data.values as Uint8Array,
      validity
    };
  }
  if (arrow.DataType.isInt(data.type) || arrow.DataType.isFloat(data.type)) {
    return {
      kind: 'primitive',
      length: data.length,
      values: data.values as GeoArrowNumericArray,
      validity
    };
  }
  throw new Error(`Unsupported GeoArrow physical Arrow type ${data.type.toString()}`);
}

/** Preserves a sliced validity bitmap with its logical bit offset. */
function makeGeoArrowValidity(data: arrow.Data): GeoArrowValidity | undefined {
  if (data.nullCount === 0 || !data.nullBitmap || data.nullBitmap.length === 0) return undefined;
  return {values: data.nullBitmap, bitOffset: data.offset};
}

/** Builds Arrow Data from physical geometry buffers, copying only when packing is needed. */
function makeArrowDataFromGeoArrowArray(
  array: GeoArrowArray,
  dimension: GeoArrowDimension,
  coordinateLayout: GeoArrowCoordinateLayout | null
): arrow.Data {
  const validity = makeCompactValidity(array.validity, array.length);
  const nullCount = validity ? -1 : 0;
  const validityBuffers = validity ? {[arrow.BufferType.VALIDITY]: validity} : {};

  switch (array.kind) {
    case 'primitive': {
      const values = makePackedPrimitiveValues(array);
      return new arrow.Data(getArrowTypeForValues(values), 0, array.length, nullCount, {
        ...validityBuffers,
        [arrow.BufferType.DATA]: values
      });
    }
    case 'fixed-size-list': {
      const child = makeArrowDataFromGeoArrowArray(array.child, dimension, coordinateLayout);
      const childStart = (array.offset ?? 0) * array.size;
      const slicedChild =
        childStart === 0 && child.length === array.length * array.size
          ? child
          : child.slice(childStart, array.length * array.size);
      const type = new arrow.FixedSizeList(
        array.size,
        new arrow.Field(dimension, slicedChild.type, true)
      );
      return new arrow.Data(type, 0, array.length, nullCount, validityBuffers, [slicedChild]);
    }
    case 'list': {
      const child = makeArrowDataFromGeoArrowArray(array.child, dimension, coordinateLayout);
      const offsets = makeArrowOffsets(array.offsets, array.offset, array.length, array.offsetBase);
      const field = new arrow.Field('value', child.type, true);
      const type =
        offsets instanceof BigInt64Array
          ? createOptionalArrowType('LargeList', field)
          : new arrow.List(field);
      return new arrow.Data(
        type,
        0,
        array.length,
        nullCount,
        {...validityBuffers, [arrow.BufferType.OFFSET]: offsets},
        [child]
      );
    }
    case 'struct': {
      const fields: arrow.Field[] = [];
      const children: arrow.Data[] = [];
      for (const [name, childArray] of Object.entries(array.children)) {
        let child = makeArrowDataFromGeoArrowArray(childArray, dimension, coordinateLayout);
        const childOffset = array.offset ?? 0;
        if (childOffset > 0 || child.length !== array.length) {
          child = child.slice(childOffset, array.length);
        }
        fields.push(new arrow.Field(name, child.type, true));
        children.push(child);
      }
      return new arrow.Data(
        new arrow.Struct(fields),
        0,
        array.length,
        nullCount,
        validityBuffers,
        children
      );
    }
    case 'dense-union':
      return makeArrowDenseUnionData(array, dimension, coordinateLayout);
    case 'serialized': {
      if (array.views) {
        const type =
          array.encoding === 'binary'
            ? createOptionalArrowType('BinaryView')
            : createOptionalArrowType('Utf8View');
        const viewBytes = new Uint8Array(
          array.views.buffer,
          array.views.byteOffset + (array.offset ?? 0) * 4 * Uint32Array.BYTES_PER_ELEMENT,
          array.length * 4 * Uint32Array.BYTES_PER_ELEMENT
        );
        return Reflect.construct(arrow.Data, [
          type,
          0,
          array.length,
          nullCount,
          {...validityBuffers, [arrow.BufferType.DATA]: viewBytes},
          [],
          undefined,
          array.dataBuffers
        ]) as arrow.Data;
      }
      const offsets = makeArrowOffsets(array.offsets, array.offset, array.length, array.offsetBase);
      const type = getSerializedArrowType(array.encoding, offsets);
      return new arrow.Data(type, 0, array.length, nullCount, {
        ...validityBuffers,
        [arrow.BufferType.OFFSET]: offsets,
        [arrow.BufferType.DATA]: array.values
      });
    }
  }
}

/** Builds dense-union data while retaining type IDs and null-child semantics. */
function makeArrowDenseUnionData(
  array: GeoArrowDenseUnion,
  dimension: GeoArrowDimension,
  coordinateLayout: GeoArrowCoordinateLayout | null
): arrow.Data {
  const offset = array.offset ?? 0;
  const sourceTypeIds = array.typeIds.subarray(offset, offset + array.length);
  const typeIds = sourceTypeIds;
  const valueOffsets = array.valueOffsets.subarray(offset, offset + array.length);
  const children = array.children.map(child =>
    makeArrowDataFromGeoArrowArray(
      child.data,
      child.dimension ?? dimension,
      child.coordinateLayout === undefined ? coordinateLayout : child.coordinateLayout
    )
  );

  if (array.validity) {
    for (let rowIndex = 0; rowIndex < array.length; rowIndex++) {
      if (isGeoArrowValueValid(array.validity, rowIndex)) continue;
      const childIndex = array.children.findIndex(child => child.typeId === typeIds[rowIndex]);
      const childOffset = valueOffsets[rowIndex];
      const childValidity = array.children[childIndex]?.data.validity;
      if (
        childIndex < 0 ||
        childOffset < 0 ||
        childOffset >= children[childIndex].length ||
        !childValidity ||
        isGeoArrowValueValid(childValidity, childOffset)
      ) {
        throw new Error('GeoArrow dense-union null does not reference a nullable child value');
      }
    }
  }

  const fields = array.children.map(
    (child, childIndex) =>
      new arrow.Field(
        getArrowUnionChildName(child.name, child.dimension ?? dimension),
        children[childIndex].type,
        true
      )
  );
  const canonicalIds = array.children.map((child, index) =>
    getCanonicalGeoArrowUnionTypeId(
      child.encoding ?? inferGeoArrowEncodingFromUnionChild(fields[index]!),
      child.dimension ?? dimension
    )
  );
  if (new Set(canonicalIds).size !== canonicalIds.length)
    throw new Error('GeoArrow union contains duplicate geometry families and dimensions.');
  const canonicalTypeIds = Int8Array.from(typeIds, sourceId => {
    const childIndex = array.children.findIndex(child => child.typeId === sourceId);
    if (childIndex < 0) throw new Error(`Unknown GeoArrow union type ID ${sourceId}`);
    return canonicalIds[childIndex]!;
  });
  const type = new arrow.DenseUnion(Int32Array.from(canonicalIds), fields);
  return new arrow.Data(
    type,
    0,
    array.length,
    0,
    {[arrow.BufferType.TYPE]: canonicalTypeIds, [arrow.BufferType.OFFSET]: valueOffsets},
    children
  );
}

/** Borrows contiguous scalar values or packs a strided view. */
function makePackedPrimitiveValues(
  array: Extract<GeoArrowArray, {kind: 'primitive'}>
): GeoArrowNumericArray {
  const offset = array.offset ?? 0;
  const stride = array.stride ?? 1;
  if (stride === 1) {
    return array.values.subarray(offset, offset + array.length) as GeoArrowNumericArray;
  }
  const ValuesConstructor = array.values.constructor as {
    new (length: number): GeoArrowNumericArray;
  };
  const values = new ValuesConstructor(array.length);
  for (let index = 0; index < array.length; index++) {
    values[index] = array.values[offset + index * stride] as never;
  }
  return values;
}

/** Maps primitive typed-array storage to an Arrow numeric type. */
function getArrowTypeForValues(values: GeoArrowNumericArray): arrow.DataType {
  if (values instanceof Int8Array) return new arrow.Int8();
  if (values instanceof Uint8Array || values instanceof Uint8ClampedArray) return new arrow.Uint8();
  if (values instanceof Int16Array) return new arrow.Int16();
  if (values instanceof Uint16Array) return new arrow.Uint16();
  if (values instanceof Int32Array) return new arrow.Int32();
  if (values instanceof Uint32Array) return new arrow.Uint32();
  if (values instanceof BigInt64Array) return new arrow.Int64();
  if (values instanceof BigUint64Array) return new arrow.Uint64();
  if (values instanceof Float32Array) return new arrow.Float32();
  if (values instanceof Float64Array) return new arrow.Float64();
  throw new Error(`Unsupported GeoArrow primitive values ${(values as object).constructor.name}`);
}

/** Borrows or rebases a geometry offset buffer. */
function makeArrowOffsets(
  offsets: GeoArrowOffsets,
  offset = 0,
  length: number,
  offsetBase: number | bigint = 0
): GeoArrowOffsets {
  const source = offsets.subarray(offset, offset + length + 1) as GeoArrowOffsets;
  if (offsetBase === 0 || offsetBase === 0n) return source;
  const normalized =
    offsets instanceof BigInt64Array
      ? new BigInt64Array(source.length)
      : new Int32Array(source.length);
  for (let index = 0; index < source.length; index++) {
    if (normalized instanceof BigInt64Array) {
      normalized[index] = BigInt(source[index]) - BigInt(offsetBase);
    } else {
      normalized[index] = Number(source[index]) - Number(offsetBase);
    }
  }
  return normalized;
}

/** Packs a validity bitmap when Arrow requires its first row at bit zero. */
function makeCompactValidity(
  validity: GeoArrowValidity | undefined,
  length: number
): Uint8Array | undefined {
  if (!validity) return undefined;
  const bitOffset = validity.bitOffset ?? 0;
  if (bitOffset === 0 && validity.values.length === Math.ceil(length / 8)) {
    return validity.values;
  }
  const values = new Uint8Array(Math.ceil(length / 8));
  let nullCount = 0;
  for (let index = 0; index < length; index++) {
    if (isGeoArrowValueValid(validity, index)) values[index >> 3] |= 1 << (index & 7);
    else nullCount++;
  }
  return nullCount > 0 ? values : undefined;
}

/** Reads one validity bit at its logical row offset. */
function isGeoArrowValueValid(validity: GeoArrowValidity, index: number): boolean {
  const bitIndex = (validity.bitOffset ?? 0) + index;
  return Boolean(validity.values[bitIndex >> 3] & (1 << (bitIndex & 7)));
}

/** Reads union-child family hints before falling back to physical inference. */
function inferGeoArrowEncodingFromUnionChild(
  field: arrow.Field,
  typeId?: number
): GeoArrowEncoding {
  const kind = typeId === undefined ? 0 : typeId % 10;
  const families: Record<number, GeoArrowEncoding> = {
    1: 'geoarrow.point',
    2: 'geoarrow.linestring',
    3: 'geoarrow.polygon',
    4: 'geoarrow.multipoint',
    5: 'geoarrow.multilinestring',
    6: 'geoarrow.multipolygon',
    7: 'geoarrow.geometrycollection'
  };
  if (typeId !== undefined && typeId >= 1 && typeId <= 37 && families[kind]) return families[kind]!;
  const normalizedName = field.name.replace(/[^a-z]/gi, '').toLowerCase();
  const names: Record<string, GeoArrowEncoding> = {
    point: 'geoarrow.point',
    linestring: 'geoarrow.linestring',
    polygon: 'geoarrow.polygon',
    multipoint: 'geoarrow.multipoint',
    multilinestring: 'geoarrow.multilinestring',
    multipolygon: 'geoarrow.multipolygon',
    geometrycollection: 'geoarrow.geometrycollection'
  };
  for (const [name, encoding] of Object.entries(names)) {
    if (normalizedName.startsWith(name)) return encoding;
  }
  return inferGeoArrowEncodingFromArrowType(field.type);
}

/** Preserves Z and M hints from union-child names. */
function inferGeoArrowDimensionFromUnionChild(
  field: arrow.Field,
  typeId?: number
): GeoArrowDimension {
  if (typeId !== undefined && typeId >= 1 && typeId <= 37 && typeId % 10 >= 1 && typeId % 10 <= 7) {
    return typeId >= 30 ? 'xyzm' : typeId >= 20 ? 'xym' : typeId >= 10 ? 'xyz' : 'xy';
  }
  if (/\sZM$/i.test(field.name)) return 'xyzm';
  if (/\sM$/i.test(field.name)) return 'xym';
  if (/\sZ$/i.test(field.name)) return 'xyz';
  return inferGeoArrowDimensionFromArrowType(field.type);
}

/** Preserves dimensional hints when creating union child fields. */
function getArrowUnionChildName(name: string, dimension: GeoArrowDimension): string {
  if (/\s(?:Z|M|ZM)$/i.test(name) || dimension === 'xy') return name;
  const suffix = dimension === 'xyz' ? 'Z' : dimension === 'xym' ? 'M' : 'ZM';
  return `${name} ${suffix}`;
}

/** Counts native list nesting and verifies a coordinate leaf. */
function getArrowListNesting(type: arrow.DataType): number {
  let nesting = 0;
  let currentType = type;
  while (arrow.DataType.isList(currentType) || isOptionalArrowType(currentType, 'LargeList')) {
    nesting++;
    currentType = currentType.children[0].type;
  }
  if (arrow.DataType.isFixedSizeList(currentType) || arrow.DataType.isStruct(currentType)) {
    return nesting;
  }
  throw new Error(`GeoArrow type does not terminate in coordinates: ${type.toString()}`);
}

/** Selects offset-based WKB/WKT storage from its encoding and offset width. */
function getSerializedArrowType(
  encoding: 'binary' | 'utf8',
  offsets: GeoArrowOffsets
): arrow.DataType {
  if (encoding === 'binary') {
    return offsets instanceof BigInt64Array ? new arrow.LargeBinary() : new arrow.Binary();
  }
  return offsets instanceof BigInt64Array ? new arrow.LargeUtf8() : new arrow.Utf8();
}

/** Tests standard and large binary/string storage. */
function isOffsetSerializedArrowType(type: arrow.DataType): boolean {
  return (
    arrow.DataType.isBinary(type) ||
    arrow.DataType.isLargeBinary(type) ||
    arrow.DataType.isUtf8(type) ||
    arrow.DataType.isLargeUtf8(type)
  );
}

/** Tests offset-based and view-based serialized geometry storage. */
function isSerializedArrowType(type: arrow.DataType): boolean {
  return (
    isOffsetSerializedArrowType(type) ||
    isOptionalArrowType(type, 'BinaryView') ||
    isOptionalArrowType(type, 'Utf8View')
  );
}

/** Tests the four supported semantic coordinate dimensions. */
function isGeoArrowDimension(value: string | undefined): value is GeoArrowDimension {
  return value === 'xy' || value === 'xyz' || value === 'xym' || value === 'xyzm';
}

/** Combines dimensions without confusing measured and elevation components. */
function mergeGeoArrowDimensions(
  left: GeoArrowDimension,
  right: GeoArrowDimension
): GeoArrowDimension {
  if (left === right) return left;
  if (left === 'xy') return right;
  if (right === 'xy') return left;
  if (left === 'xyzm' || right === 'xyzm') return 'xyzm';
  return left === 'xym' && right === 'xym' ? 'xym' : 'xyzm';
}

/** Tests an Arrow type introduced after the minimum supported runtime. */
function isOptionalArrowType(type: arrow.DataType, name: string): boolean {
  const Constructor = (
    arrow as unknown as Record<string, new (...args: unknown[]) => arrow.DataType>
  )[name];
  return Boolean(Constructor && type instanceof Constructor);
}

/** Constructs an optional Arrow type, failing clearly when the installed runtime lacks it. */
function createOptionalArrowType(name: string, ...arguments_: unknown[]): arrow.DataType {
  const Constructor = (
    arrow as unknown as Record<string, new (...args: unknown[]) => arrow.DataType>
  )[name];
  if (!Constructor) throw new Error(`${name} requires a newer Apache Arrow runtime.`);
  return new Constructor(...arguments_);
}

/** Checks physical type/extension agreement without reading coordinate values. */
export function assertArrowGeoArrowType(
  type: arrow.DataType,
  encoding: GeoArrowEncoding,
  dimension?: GeoArrowDimension
): void {
  if (encoding === 'geoarrow.wkb' || encoding === 'geoarrow.wkt') {
    if (!isSerializedArrowType(type) || inferGeoArrowEncodingFromArrowType(type) !== encoding) {
      throw new Error(
        `GeoArrow encoding ${encoding} does not match Arrow storage ${type.toString()}.`
      );
    }
    return;
  }
  if (encoding === 'geoarrow.geometry') {
    if (!arrow.DataType.isDenseUnion(type))
      throw new Error('GeoArrow geometry requires dense-union storage.');
    if (type.typeIds.some(typeId => typeId < 0 || typeId > 127))
      throw new Error('Arrow union tags must be in the range 0 through 127.');
    type.children.forEach((field, index) =>
      assertArrowGeoArrowType(
        field.type,
        inferGeoArrowEncodingFromUnionChild(field, type.typeIds[index]),
        inferGeoArrowDimensionFromUnionChild(field, type.typeIds[index])
      )
    );
    return;
  }
  if (encoding === 'geoarrow.geometrycollection') {
    if (!(arrow.DataType.isList(type) || isOptionalArrowType(type, 'LargeList')))
      throw new Error('GeoArrow geometrycollection requires list storage.');
    assertArrowGeoArrowType(type.children[0]!.type, 'geoarrow.geometry');
    return;
  }
  if (encoding === 'geoarrow.box') {
    if (!arrow.DataType.isStruct(type)) throw new Error('GeoArrow box requires struct storage.');
    const inferred = inferGeoArrowDimensionFromArrowType(type);
    const axes = inferred.split('');
    const names = [...axes.map(axis => `${axis}min`), ...axes.map(axis => `${axis}max`)];
    if (
      type.children.length !== names.length ||
      type.children.some((field, index) => field.name !== names[index])
    )
      throw new Error('GeoArrow box fields must be ordered minimum/maximum coordinate axes.');
    return;
  }
  const depth = {
    'geoarrow.point': 0,
    'geoarrow.linestring': 1,
    'geoarrow.multipoint': 1,
    'geoarrow.polygon': 2,
    'geoarrow.multilinestring': 2,
    'geoarrow.multipolygon': 3
  }[encoding];
  if (depth === undefined) throw new Error(`Unsupported GeoArrow encoding ${encoding}`);
  let coordinate = type;
  for (let level = 0; level < depth; level++) {
    if (!(arrow.DataType.isList(coordinate) || isOptionalArrowType(coordinate, 'LargeList')))
      throw new Error(`GeoArrow ${encoding} requires ${depth} list levels.`);
    coordinate = coordinate.children[0]!.type;
  }
  if (arrow.DataType.isFixedSizeList(coordinate)) {
    const child = coordinate.children[0]?.type;
    if (!child || !arrow.DataType.isFloat(child) || child.precision === arrow.Precision.HALF)
      throw new Error('GeoArrow coordinate leaves require Float32 or Float64 storage.');
    if (
      ![2, 3, 4].includes(coordinate.listSize) ||
      (dimension && coordinate.listSize !== dimension.length)
    )
      throw new Error('GeoArrow coordinate dimension does not match its list size.');
    return;
  }
  if (arrow.DataType.isStruct(coordinate)) {
    const inferred = inferGeoArrowDimensionFromArrowType(coordinate);
    if (
      (dimension && inferred !== dimension) ||
      coordinate.children.map(field => field.name).join('') !== inferred
    )
      throw new Error('GeoArrow separated coordinates must follow x/y/z/m axis order.');
    return;
  }
  throw new Error('GeoArrow native geometry must terminate in floating-point coordinates.');
}

/** Maps descriptor union tags to the GeoArrow wire-format family/dimension IDs. */
function getCanonicalGeoArrowUnionTypeId(
  encoding: GeoArrowEncoding,
  dimension: GeoArrowDimension
): number {
  const families: Partial<Record<GeoArrowEncoding, number>> = {
    'geoarrow.point': 1,
    'geoarrow.linestring': 2,
    'geoarrow.polygon': 3,
    'geoarrow.multipoint': 4,
    'geoarrow.multilinestring': 5,
    'geoarrow.multipolygon': 6,
    'geoarrow.geometrycollection': 7
  };
  const family = families[encoding];
  if (!family) throw new Error('GeoArrow unions require native geometry families.');
  return (
    family + (dimension === 'xyz' ? 10 : dimension === 'xym' ? 20 : dimension === 'xyzm' ? 30 : 0)
  );
}
