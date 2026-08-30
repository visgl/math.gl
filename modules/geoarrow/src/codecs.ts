// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {formatWKT, inspectWKBHeader, parseWKT, visitWKB} from '@math.gl/wkb';
import type {WKBHeader, WKBTraversalOptions} from '@math.gl/wkb';
import {WKBBuilder} from '@math.gl/wkb';
import type {
  GeoArrowColumn,
  GeoArrowCoordinateLayout,
  GeoArrowDenseUnionChild,
  GeoArrowDimension,
  GeoArrowGeometryValue,
  GeoArrowSerialized
} from './types';
import {getGeoArrowDimensionSize} from './types';
import type {GeoArrowBuilderEncoding} from './builder';
import {GeoArrowBuilder, makeGeoArrowColumnFromGeometryRows} from './builder';
import {getGeoArrowOffset, isGeoArrowValueValid, materializeGeometryRow} from './layout';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

/** Buffer controls applied while decoding WKB directly to its final native representation. */
export type DecodeGeoArrowWKBOptions = Readonly<{
  encoding?:
    | GeoArrowBuilderEncoding
    | 'geoarrow.geometry'
    | 'geoarrow.geometrycollection'
    | 'native';
  /** Defaults to `infer`, because serialized Arrow storage has no physical coordinate dimension. */
  dimension?: GeoArrowDimension | 'infer' | 'preserve';
  coordinateLayout?: GeoArrowCoordinateLayout;
  coordinateType?: 'float32' | 'float64';
  offsetType?: 'int32' | 'int64';
  traversal?: WKBTraversalOptions;
}>;

type WKBChunkClassification = {
  families: Uint8Array;
  dimensions: Uint8Array;
};

type WKBDecodeBuilderOptions = {
  dimension: GeoArrowDimension;
  coordinateLayout: GeoArrowCoordinateLayout;
  coordinateType: 'float32' | 'float64';
  offsetType: 'int32' | 'int64';
};

const NULL_FAMILY = 255;

/** Decodes a GeoArrow WKB column into final native physical geometry buffers. */
export function decodeGeoArrowWKB(
  column: GeoArrowColumn,
  options: DecodeGeoArrowWKBOptions = {}
): GeoArrowColumn {
  if (column.encoding !== 'geoarrow.wkb') throw new Error('Expected a geoarrow.wkb column');
  const classifications: WKBChunkClassification[] = [];
  const schemaKeys = new Set<number>();
  const collectionSchemas: Array<Set<number>> = [];
  const rootFamilies = new Set<number>();
  let hasNulls = false;
  let inferredDimension: GeoArrowDimension = 'xy';
  for (const chunk of column.chunks) {
    if (chunk.kind !== 'serialized') throw new Error('Serialized column contains native storage');
    const families = new Uint8Array(chunk.length).fill(NULL_FAMILY);
    const dimensions = new Uint8Array(chunk.length);
    for (let rowIndex = 0; rowIndex < chunk.length; rowIndex++) {
      if (!isGeoArrowValueValid(chunk.validity, rowIndex)) {
        hasNulls = true;
        continue;
      }
      const bytes = getSerializedBytes(chunk, rowIndex);
      const rootHeader = inspectWKBHeader(bytes);
      const rootFamily = getGeometryFamilyIndex(rootHeader.geometryType);
      let rowDimension: GeoArrowDimension = rootHeader.dimension;
      if (rootHeader.geometryType === 'GeometryCollection') {
        const collectionStack: Array<{depth: number; level: number}> = [];
        let concreteRootDepth = -1;
        visitWKB(
          bytes,
          {
            geometry: (header, _count, depth) => {
              rowDimension = mergeDimensions(rowDimension, header.dimension);
              if (concreteRootDepth >= 0 && depth > concreteRootDepth) return;
              concreteRootDepth = -1;
              while (
                collectionStack.length &&
                depth <= collectionStack[collectionStack.length - 1].depth
              ) {
                collectionStack.pop();
              }
              const parent = collectionStack[collectionStack.length - 1];
              if (parent) {
                collectionSchemas[parent.level] ||= new Set<number>();
                collectionSchemas[parent.level].add(
                  getGeometryTypeId(header.geometryType, header.dimension)
                );
              }
              if (header.geometryType === 'GeometryCollection') {
                collectionStack.push({depth, level: parent ? parent.level + 1 : 0});
              } else if (parent) {
                concreteRootDepth = depth;
              }
            }
          },
          options.traversal
        );
      }
      families[rowIndex] = rootFamily;
      dimensions[rowIndex] = getDimensionIndex(rowDimension);
      rootFamilies.add(rootFamily);
      schemaKeys.add(getGeometryTypeIdFromIndices(rootFamily, dimensions[rowIndex]));
      inferredDimension = mergeDimensions(inferredDimension, rowDimension);
    }
    classifications.push({families, dimensions});
  }

  const dimension = resolveDecodeDimension(options.dimension, column.dimension, inferredDimension);
  const forceDimension = Boolean(options.dimension && options.dimension !== 'infer');
  if (forceDimension) {
    schemaKeys.clear();
    for (const classification of classifications) {
      for (let rowIndex = 0; rowIndex < classification.families.length; rowIndex++) {
        const family = classification.families[rowIndex];
        if (family === NULL_FAMILY) continue;
        classification.dimensions[rowIndex] = getDimensionIndex(dimension);
        schemaKeys.add(getGeometryTypeIdFromIndices(family, getDimensionIndex(dimension)));
      }
    }
  }
  const encoding = resolveDecodeEncoding(options.encoding, rootFamilies);
  validateDecodeEncoding(encoding, rootFamilies);
  const builderOptions = {
    dimension,
    coordinateLayout: options.coordinateLayout || 'interleaved',
    coordinateType: options.coordinateType || 'float64',
    offsetType: options.offsetType || 'int32'
  } as const;

  if (encoding !== 'geoarrow.geometry' && encoding !== 'geoarrow.geometrycollection') {
    const chunks = column.chunks.map((chunk, chunkIndex) =>
      decodeConcreteWKBChunk(
        chunk as GeoArrowSerialized,
        classifications[chunkIndex],
        encoding,
        builderOptions,
        options.traversal
      )
    );
    return copyMetadata(column, {
      encoding,
      dimension,
      coordinateLayout: builderOptions.coordinateLayout,
      chunks
    });
  }

  if (encoding === 'geoarrow.geometrycollection') {
    const stableCollectionSchemas = normalizeCollectionSchemas(
      collectionSchemas,
      dimension,
      forceDimension
    );
    const chunks = column.chunks.map((chunk, chunkIndex) =>
      decodeGeometryCollectionWKBChunk(
        chunk as GeoArrowSerialized,
        classifications[chunkIndex],
        undefined,
        stableCollectionSchemas,
        builderOptions,
        options.traversal,
        forceDimension ? dimension : undefined
      )
    );
    return copyMetadata(column, {
      encoding,
      dimension,
      coordinateLayout: builderOptions.coordinateLayout,
      chunks
    });
  }

  if (schemaKeys.size === 0) schemaKeys.add(getGeometryTypeId('Point', dimension));
  if (hasNulls) schemaKeys.add(getGeometryTypeId('Point', dimension));
  const stableSchema = [...schemaKeys].sort((left, right) => left - right);
  const chunks = column.chunks.map((chunk, chunkIndex) =>
    decodeUnionWKBChunk(
      chunk as GeoArrowSerialized,
      classifications[chunkIndex],
      stableSchema,
      normalizeCollectionSchemas(collectionSchemas, dimension, forceDimension),
      builderOptions,
      options.traversal,
      forceDimension ? dimension : undefined
    )
  );
  return copyMetadata(column, {
    encoding: 'geoarrow.geometry',
    dimension,
    coordinateLayout: builderOptions.coordinateLayout,
    chunks
  });
}

/** Counts vertices in serialized WKB chunks without decoding ordinates or allocating rows. */
export function getGeoArrowWKBVertexCount(
  column: GeoArrowColumn,
  traversal?: WKBTraversalOptions
): number {
  if (column.encoding !== 'geoarrow.wkb') throw new Error('Expected a geoarrow.wkb column');
  let vertexCount = 0;
  for (const chunk of column.chunks) {
    if (chunk.kind !== 'serialized') throw new Error('Serialized column contains native storage');
    for (let rowIndex = 0; rowIndex < chunk.length; rowIndex++) {
      if (!isGeoArrowValueValid(chunk.validity, rowIndex)) continue;
      visitWKB(
        getSerializedBytes(chunk, rowIndex),
        {
          geometry: (header, count) => {
            if (header.geometryType === 'Point') vertexCount++;
            else if (header.geometryType === 'LineString') vertexCount += count || 0;
          },
          ring: pointCount => {
            vertexCount += pointCount;
          }
        },
        traversal
      );
    }
  }
  return vertexCount;
}

function decodeConcreteWKBChunk(
  chunk: GeoArrowSerialized,
  classification: WKBChunkClassification,
  encoding: GeoArrowBuilderEncoding,
  options: WKBDecodeBuilderOptions,
  traversal: WKBTraversalOptions | undefined
): import('./types').GeoArrowArray {
  const measure = new GeoArrowBuilder({...options, encoding, mode: 'measure'});
  replaySerializedChunk(chunk, classification, encoding, measure, traversal);
  const write = new GeoArrowBuilder({
    ...options,
    encoding,
    mode: 'write',
    target: measure.allocateTarget()
  });
  replaySerializedChunk(chunk, classification, encoding, write, traversal);
  return write.finish().chunks[0];
}

function replaySerializedChunk(
  chunk: GeoArrowSerialized,
  classification: WKBChunkClassification,
  encoding: GeoArrowBuilderEncoding,
  builder: GeoArrowBuilder,
  traversal: WKBTraversalOptions | undefined
): void {
  const targetType = geometryTypeFromEncoding(encoding);
  for (let rowIndex = 0; rowIndex < chunk.length; rowIndex++) {
    if (classification.families[rowIndex] === NULL_FAMILY) builder.append(null);
    else visitWKBIntoBuilder(getSerializedBytes(chunk, rowIndex), builder, targetType, traversal);
  }
}

function decodeUnionWKBChunk(
  chunk: GeoArrowSerialized,
  classification: WKBChunkClassification,
  stableSchema: readonly number[],
  collectionSchemas: readonly (readonly number[])[],
  options: WKBDecodeBuilderOptions,
  traversal: WKBTraversalOptions | undefined,
  childDimensionOverride: GeoArrowDimension | undefined
): import('./types').GeoArrowDenseUnion {
  const measureBuilders = new Map<number, GeoArrowBuilder>();
  for (const key of stableSchema) {
    const type = getGeometryTypeFromId(key);
    if (type !== 'GeometryCollection') {
      const encoding = encodingFromGeometryType(type);
      measureBuilders.set(
        key,
        new GeoArrowBuilder({
          ...options,
          encoding,
          dimension: getDimensionFromId(key),
          mode: 'measure'
        })
      );
    }
  }
  const typeIds = new Int8Array(chunk.length);
  const valueOffsets = new Int32Array(chunk.length);
  const childCounts = new Map<number, number>();
  const nullKey = stableSchema[0];
  for (let rowIndex = 0; rowIndex < chunk.length; rowIndex++) {
    const family = classification.families[rowIndex];
    const key =
      family === NULL_FAMILY
        ? nullKey
        : getGeometryTypeIdFromIndices(family, classification.dimensions[rowIndex]);
    typeIds[rowIndex] = key;
    valueOffsets[rowIndex] = childCounts.get(key) || 0;
    childCounts.set(key, valueOffsets[rowIndex] + 1);
    const builder = measureBuilders.get(key);
    if (builder) {
      if (family === NULL_FAMILY) builder.append(null);
      else
        visitWKBIntoBuilder(
          getSerializedBytes(chunk, rowIndex),
          builder,
          getConcreteGeometryTypeFromId(key),
          traversal
        );
    }
  }
  const writeBuilders = new Map<number, GeoArrowBuilder>();
  for (const key of stableSchema) {
    if (getGeometryTypeFromId(key) === 'GeometryCollection') continue;
    const measure = measureBuilders.get(key)!;
    writeBuilders.set(
      key,
      new GeoArrowBuilder({
        ...options,
        encoding: encodingFromGeometryType(getConcreteGeometryTypeFromId(key)),
        dimension: getDimensionFromId(key),
        mode: 'write',
        target: measure.allocateTarget()
      })
    );
  }
  for (let rowIndex = 0; rowIndex < chunk.length; rowIndex++) {
    const family = classification.families[rowIndex];
    const key =
      family === NULL_FAMILY
        ? nullKey
        : getGeometryTypeIdFromIndices(family, classification.dimensions[rowIndex]);
    const builder = writeBuilders.get(key);
    if (builder) {
      if (family === NULL_FAMILY) builder.append(null);
      else
        visitWKBIntoBuilder(
          getSerializedBytes(chunk, rowIndex),
          builder,
          getConcreteGeometryTypeFromId(key),
          traversal
        );
    }
  }
  const children: GeoArrowDenseUnionChild[] = stableSchema.map(key => {
    const type = getGeometryTypeFromId(key);
    if (type === 'GeometryCollection') {
      return {
        name: type,
        typeId: key,
        encoding: 'geoarrow.geometrycollection',
        dimension: getDimensionFromId(key),
        coordinateLayout: options.coordinateLayout,
        data: decodeGeometryCollectionWKBChunk(
          chunk,
          classification,
          key,
          collectionSchemas,
          {...options, dimension: getDimensionFromId(key)},
          traversal,
          childDimensionOverride
        )
      };
    }
    const built = writeBuilders.get(key)!.finish();
    return {
      name: getGeometryTypeFromId(key),
      typeId: key,
      encoding: built.encoding,
      dimension: built.dimension,
      coordinateLayout: built.coordinateLayout,
      data: built.chunks[0]
    };
  });
  return {kind: 'dense-union', length: chunk.length, typeIds, valueOffsets, children};
}

type CollectionMeasureLevel = {
  schema: readonly number[];
  rowCount: number;
  childCount: number;
  builders: Map<number, GeoArrowBuilder>;
};

type CollectionWriteLevel = {
  schema: readonly number[];
  rowCursor: number;
  childCursor: number;
  offsets: import('./types').GeoArrowOffsets;
  typeIds: Int8Array;
  valueOffsets: Int32Array;
  childCounts: Map<number, number>;
  builders: Map<number, GeoArrowBuilder>;
};

function decodeGeometryCollectionWKBChunk(
  chunk: GeoArrowSerialized,
  classification: WKBChunkClassification,
  selectorKey: number | undefined,
  schemas: readonly (readonly number[])[],
  options: WKBDecodeBuilderOptions,
  traversal: WKBTraversalOptions | undefined,
  childDimensionOverride: GeoArrowDimension | undefined
): import('./types').GeoArrowList {
  const measureLevels = schemas.map(schema => makeCollectionMeasureLevel(schema, options));
  if (measureLevels.length === 0) measureLevels.push(makeCollectionMeasureLevel([], options));
  forEachSelectedCollectionRow(chunk, classification, selectorKey, (bytes, valid) => {
    if (!valid) {
      measureLevels[0].rowCount++;
      return;
    }
    replayWKBCollection(
      bytes!,
      measureLevels,
      undefined,
      options.dimension,
      traversal,
      childDimensionOverride
    );
  });

  const writeLevels = measureLevels.map(level => makeCollectionWriteLevel(level, options));
  forEachSelectedCollectionRow(chunk, classification, selectorKey, (bytes, valid) => {
    if (!valid) {
      writeCollectionRow(writeLevels[0], 0);
      return;
    }
    replayWKBCollection(
      bytes!,
      measureLevels,
      writeLevels,
      options.dimension,
      traversal,
      childDimensionOverride
    );
  });

  const root = makeCollectionLevelArray(0, measureLevels, writeLevels, options);
  if (selectorKey !== undefined) return root;
  const validity = new Uint8Array(Math.ceil(root.length / 8));
  for (let rowIndex = 0; rowIndex < classification.families.length; rowIndex++) {
    if (classification.families[rowIndex] === getGeometryFamilyIndex('GeometryCollection')) {
      validity[rowIndex >> 3] |= 1 << (rowIndex & 7);
    }
  }
  return {...root, validity: {values: validity}};
}

function forEachSelectedCollectionRow(
  chunk: GeoArrowSerialized,
  classification: WKBChunkClassification,
  selectorKey: number | undefined,
  visitor: (bytes: Uint8Array | undefined, valid: boolean) => void
): void {
  const collectionFamily = getGeometryFamilyIndex('GeometryCollection');
  for (let rowIndex = 0; rowIndex < chunk.length; rowIndex++) {
    const family = classification.families[rowIndex];
    if (selectorKey === undefined) {
      if (family === NULL_FAMILY) visitor(undefined, false);
      else if (family === collectionFamily) visitor(getSerializedBytes(chunk, rowIndex), true);
      else throw new Error('Rows cannot be represented as geoarrow.geometrycollection');
    } else if (
      family === collectionFamily &&
      getGeometryTypeIdFromIndices(family, classification.dimensions[rowIndex]) === selectorKey
    ) {
      visitor(getSerializedBytes(chunk, rowIndex), true);
    }
  }
}

function makeCollectionMeasureLevel(
  schema: readonly number[],
  options: WKBDecodeBuilderOptions
): CollectionMeasureLevel {
  const builders = new Map<number, GeoArrowBuilder>();
  for (const key of schema) {
    const type = getGeometryTypeFromId(key);
    if (type !== 'GeometryCollection') {
      builders.set(
        key,
        new GeoArrowBuilder({
          ...options,
          encoding: encodingFromGeometryType(type),
          dimension: getDimensionFromId(key),
          mode: 'measure'
        })
      );
    }
  }
  return {schema, rowCount: 0, childCount: 0, builders};
}

function makeCollectionWriteLevel(
  measure: CollectionMeasureLevel,
  options: WKBDecodeBuilderOptions
): CollectionWriteLevel {
  const OffsetArray = options.offsetType === 'int64' ? BigInt64Array : Int32Array;
  const builders = new Map<number, GeoArrowBuilder>();
  for (const [key, builder] of measure.builders) {
    builders.set(
      key,
      new GeoArrowBuilder({
        ...options,
        encoding: encodingFromGeometryType(getConcreteGeometryTypeFromId(key)),
        dimension: getDimensionFromId(key),
        mode: 'write',
        target: builder.allocateTarget()
      })
    );
  }
  return {
    schema: measure.schema,
    rowCursor: 0,
    childCursor: 0,
    offsets: new OffsetArray(measure.rowCount + 1),
    typeIds: new Int8Array(measure.childCount),
    valueOffsets: new Int32Array(measure.childCount),
    childCounts: new Map(),
    builders
  };
}

function replayWKBCollection(
  bytes: Uint8Array,
  measureLevels: CollectionMeasureLevel[],
  writeLevels: CollectionWriteLevel[] | undefined,
  collectionDimension: GeoArrowDimension,
  traversal: WKBTraversalOptions | undefined,
  childDimensionOverride: GeoArrowDimension | undefined
): void {
  const collectionStack: Array<{depth: number; level: number}> = [];
  let active:
    | {
        builder: GeoArrowBuilder;
        rootDepth: number;
        rootType: Exclude<WKBHeader['geometryType'], 'GeometryCollection'>;
      }
    | undefined;
  const finishActive = (): void => {
    active?.builder.endGeometry();
    active = undefined;
  };
  visitWKB(
    bytes,
    {
      geometry: (header, count, depth) => {
        if (active && depth > active.rootDepth) {
          if (active.rootType === 'MultiLineString' && header.geometryType === 'LineString') {
            active.builder.beginRing(count);
          } else if (active.rootType === 'MultiPolygon' && header.geometryType === 'Polygon') {
            active.builder.beginPolygon();
          }
          return;
        }
        finishActive();
        while (
          collectionStack.length &&
          depth <= collectionStack[collectionStack.length - 1].depth
        ) {
          collectionStack.pop();
        }
        const parent = collectionStack[collectionStack.length - 1];
        if (header.geometryType === 'GeometryCollection') {
          if (parent) {
            addCollectionChild(
              measureLevels[parent.level],
              writeLevels?.[parent.level],
              getGeometryTypeId('GeometryCollection', collectionDimension)
            );
          }
          const level = parent ? parent.level + 1 : 0;
          if (!measureLevels[level]) {
            measureLevels[level] = makeCollectionMeasureLevel([], {
              dimension: collectionDimension,
              coordinateLayout: 'interleaved',
              coordinateType: 'float64',
              offsetType: 'int32'
            });
          }
          if (writeLevels) writeCollectionRow(writeLevels[level], count || 0);
          else measureLevels[level].rowCount++;
          collectionStack.push({depth, level});
          return;
        }
        if (!parent) throw new Error('Expected a GeometryCollection root');
        const key = getGeometryTypeId(
          header.geometryType,
          childDimensionOverride || header.dimension
        );
        addCollectionChild(measureLevels[parent.level], writeLevels?.[parent.level], key);
        const builder = writeLevels
          ? writeLevels[parent.level].builders.get(key)
          : measureLevels[parent.level].builders.get(key);
        if (!builder) throw new Error(`Missing GeometryCollection child schema for type ID ${key}`);
        builder.beginGeometry(header.geometryType, header.dimension, count);
        active = {builder, rootDepth: depth, rootType: header.geometryType};
      },
      ring: pointCount => active?.builder.beginRing(pointCount),
      coordinate: (x, y, z, m, dimension) =>
        active?.builder.writeCoordinateFromDimension(x, y, z, m, dimension)
    },
    traversal
  );
  finishActive();
}

function addCollectionChild(
  measure: CollectionMeasureLevel,
  write: CollectionWriteLevel | undefined,
  key: number
): void {
  if (!write) {
    measure.childCount++;
    return;
  }
  const index = write.childCursor++;
  write.typeIds[index] = key;
  write.valueOffsets[index] = write.childCounts.get(key) || 0;
  write.childCounts.set(key, write.valueOffsets[index] + 1);
}

function writeCollectionRow(level: CollectionWriteLevel, childCount: number): void {
  level.rowCursor++;
  setGeoArrowOffset(level.offsets, level.rowCursor, level.childCursor + childCount);
}

function makeCollectionLevelArray(
  levelIndex: number,
  measureLevels: readonly CollectionMeasureLevel[],
  writeLevels: readonly CollectionWriteLevel[],
  options: WKBDecodeBuilderOptions
): import('./types').GeoArrowList {
  const measure = measureLevels[levelIndex];
  const write = writeLevels[levelIndex];
  const children: GeoArrowDenseUnionChild[] = measure.schema.map(key => {
    const type = getGeometryTypeFromId(key);
    if (type === 'GeometryCollection') {
      return {
        name: type,
        typeId: key,
        encoding: 'geoarrow.geometrycollection',
        dimension: getDimensionFromId(key),
        coordinateLayout: options.coordinateLayout,
        data: makeCollectionLevelArray(levelIndex + 1, measureLevels, writeLevels, options)
      };
    }
    const built = write.builders.get(key)!.finish();
    return {
      name: type,
      typeId: key,
      encoding: built.encoding,
      dimension: built.dimension,
      coordinateLayout: built.coordinateLayout,
      data: built.chunks[0]
    };
  });
  return {
    kind: 'list',
    length: measure.rowCount,
    offsets: write.offsets,
    child: {
      kind: 'dense-union',
      length: measure.childCount,
      typeIds: write.typeIds,
      valueOffsets: write.valueOffsets,
      children
    }
  };
}

function setGeoArrowOffset(
  offsets: import('./types').GeoArrowOffsets,
  index: number,
  value: number
): void {
  if (offsets instanceof BigInt64Array) offsets[index] = BigInt(value);
  else offsets[index] = value;
}

function normalizeCollectionSchemas(
  schemas: readonly ReadonlySet<number>[],
  dimension: GeoArrowDimension,
  forceDimension: boolean
): number[][] {
  return schemas.map(schema =>
    [...schema]
      .map(key =>
        forceDimension || getGeometryTypeFromId(key) === 'GeometryCollection'
          ? getGeometryTypeId(getGeometryTypeFromId(key), dimension)
          : key
      )
      .filter((key, index, values) => values.indexOf(key) === index)
      .sort((left, right) => left - right)
  );
}

/** Replays one serialized geometry directly into a two-pass GeoArrowBuilder. */
function visitWKBIntoBuilder(
  bytes: Uint8Array,
  builder: GeoArrowBuilder,
  targetType: Exclude<WKBHeader['geometryType'], 'GeometryCollection'>,
  traversal?: WKBTraversalOptions
): void {
  let rootType: WKBHeader['geometryType'] | undefined;
  visitWKB(
    bytes,
    {
      geometry: (header, _count, depth) => {
        if (depth === 0) {
          rootType = header.geometryType;
          builder.beginGeometry(targetType, header.dimension, _count);
          if (rootType === 'LineString' && targetType === 'MultiLineString')
            builder.beginRing(_count);
          if (rootType === 'Polygon' && targetType === 'MultiPolygon') builder.beginPolygon();
        } else if (rootType === 'MultiLineString' && header.geometryType === 'LineString') {
          builder.beginRing(_count);
        } else if (rootType === 'MultiPolygon' && header.geometryType === 'Polygon') {
          builder.beginPolygon();
        }
      },
      ring: pointCount => {
        if (rootType === 'Polygon' || rootType === 'MultiPolygon') builder.beginRing(pointCount);
      },
      coordinate: (x, y, z, m, dimension) => {
        builder.writeCoordinateFromDimension(x, y, z, m, dimension);
      }
    },
    traversal
  );
  builder.endGeometry();
}

function encodingFromGeometryType(
  type: WKBHeader['geometryType']
): Exclude<
  GeoArrowColumn['encoding'],
  | 'geoarrow.geometry'
  | 'geoarrow.geometrycollection'
  | 'geoarrow.box'
  | 'geoarrow.wkb'
  | 'geoarrow.wkt'
> {
  if (type === 'GeometryCollection')
    throw new Error('GeometryCollection requires collection storage');
  return `geoarrow.${type.toLowerCase()}` as Exclude<
    GeoArrowColumn['encoding'],
    | 'geoarrow.geometry'
    | 'geoarrow.geometrycollection'
    | 'geoarrow.box'
    | 'geoarrow.wkb'
    | 'geoarrow.wkt'
  >;
}

function getGeometryTypeId(type: WKBHeader['geometryType'], dimension: GeoArrowDimension): number {
  return getGeometryTypeIdFromIndices(getGeometryFamilyIndex(type), getDimensionIndex(dimension));
}

const GEOMETRY_TYPES: readonly WKBHeader['geometryType'][] = [
  'Point',
  'LineString',
  'Polygon',
  'MultiPoint',
  'MultiLineString',
  'MultiPolygon',
  'GeometryCollection'
];
const DIMENSIONS: readonly GeoArrowDimension[] = ['xy', 'xyz', 'xym', 'xyzm'];

function getGeometryFamilyIndex(type: WKBHeader['geometryType']): number {
  return GEOMETRY_TYPES.indexOf(type);
}

function getDimensionIndex(dimension: GeoArrowDimension): number {
  return DIMENSIONS.indexOf(dimension);
}

function getGeometryTypeIdFromIndices(family: number, dimension: number): number {
  return family * 4 + dimension + 1;
}

function getGeometryTypeFromId(typeId: number): WKBHeader['geometryType'] {
  return GEOMETRY_TYPES[Math.floor((typeId - 1) / 4)];
}

function getConcreteGeometryTypeFromId(
  typeId: number
): Exclude<WKBHeader['geometryType'], 'GeometryCollection'> {
  const type = getGeometryTypeFromId(typeId);
  if (type === 'GeometryCollection')
    throw new Error('GeometryCollection requires collection storage');
  return type;
}

function getDimensionFromId(typeId: number): GeoArrowDimension {
  return DIMENSIONS[(typeId - 1) % 4];
}

function mergeDimensions(left: GeoArrowDimension, right: GeoArrowDimension): GeoArrowDimension {
  const hasZ = left === 'xyz' || left === 'xyzm' || right === 'xyz' || right === 'xyzm';
  const hasM = left === 'xym' || left === 'xyzm' || right === 'xym' || right === 'xyzm';
  return hasZ && hasM ? 'xyzm' : hasZ ? 'xyz' : hasM ? 'xym' : 'xy';
}

function resolveDecodeDimension(
  requested: DecodeGeoArrowWKBOptions['dimension'],
  declared: GeoArrowDimension,
  inferred: GeoArrowDimension
): GeoArrowDimension {
  if (!requested || requested === 'infer') return inferred;
  return requested === 'preserve' ? declared : requested;
}

function resolveDecodeEncoding(
  requested: DecodeGeoArrowWKBOptions['encoding'],
  families: ReadonlySet<number>
): GeoArrowBuilderEncoding | 'geoarrow.geometry' | 'geoarrow.geometrycollection' {
  if (requested && requested !== 'native') return requested;
  if (families.size !== 1) return 'geoarrow.geometry';
  const type = GEOMETRY_TYPES[[...families][0]];
  return type === 'GeometryCollection'
    ? 'geoarrow.geometrycollection'
    : encodingFromGeometryType(type);
}

function validateDecodeEncoding(
  encoding: GeoArrowBuilderEncoding | 'geoarrow.geometry' | 'geoarrow.geometrycollection',
  families: ReadonlySet<number>
): void {
  if (encoding === 'geoarrow.geometry') return;
  if (encoding === 'geoarrow.geometrycollection') {
    const collectionFamily = getGeometryFamilyIndex('GeometryCollection');
    if ([...families].some(family => family !== collectionFamily)) {
      throw new Error('Rows cannot be represented as geoarrow.geometrycollection');
    }
    return;
  }
  const targetType = geometryTypeFromEncoding(encoding);
  for (const family of families) {
    const sourceType = GEOMETRY_TYPES[family];
    const promotable =
      sourceType === targetType ||
      (sourceType === 'Point' && targetType === 'MultiPoint') ||
      (sourceType === 'LineString' && targetType === 'MultiLineString') ||
      (sourceType === 'Polygon' && targetType === 'MultiPolygon');
    if (!promotable) throw new Error(`Rows cannot be represented as ${encoding}`);
  }
}

function geometryTypeFromEncoding(
  encoding: GeoArrowBuilderEncoding
): Exclude<WKBHeader['geometryType'], 'GeometryCollection'> {
  const type = GEOMETRY_TYPES.find(candidate => `geoarrow.${candidate.toLowerCase()}` === encoding);
  if (!type || type === 'GeometryCollection')
    throw new Error(`Unsupported target encoding ${encoding}`);
  return type;
}

/** Encodes a native GeoArrow column as variable-width WKB bytes. */
export function encodeGeoArrowWKB(column: GeoArrowColumn): GeoArrowColumn {
  if (column.encoding === 'geoarrow.wkb') return column;
  return copyMetadata(column, {
    encoding: 'geoarrow.wkb',
    dimension: column.dimension,
    coordinateLayout: null,
    chunks: column.chunks.map(chunk => encodeWKBChunk(column, chunk))
  });
}

function encodeWKBChunk(
  column: GeoArrowColumn,
  chunk: import('./types').GeoArrowArray
): GeoArrowSerialized {
  const offsets = new Int32Array(chunk.length + 1);
  const validity = new Uint8Array(Math.ceil(chunk.length / 8));
  let nullCount = 0;
  for (let rowIndex = 0; rowIndex < chunk.length; rowIndex++) {
    let byteLength = 0;
    if (isPhysicalGeometryRowValid(chunk, rowIndex, column.encoding)) {
      const dimension = getPhysicalGeometryDimension(
        chunk,
        rowIndex,
        column.encoding,
        column.dimension
      );
      const builder = new WKBBuilder({mode: 'measure', dimension});
      writePhysicalGeometry(builder, chunk, rowIndex, column.encoding, dimension);
      byteLength = builder.finishGeometry();
      validity[rowIndex >> 3] |= 1 << (rowIndex & 7);
    } else {
      nullCount++;
    }
    const nextOffset = offsets[rowIndex] + byteLength;
    if (nextOffset > 0x7fffffff) throw new Error('WKB geometry chunk exceeds Int32 offsets');
    offsets[rowIndex + 1] = nextOffset;
  }
  const values = new Uint8Array(offsets[offsets.length - 1]);
  for (let rowIndex = 0; rowIndex < chunk.length; rowIndex++) {
    if (!isPhysicalGeometryRowValid(chunk, rowIndex, column.encoding)) continue;
    const dimension = getPhysicalGeometryDimension(
      chunk,
      rowIndex,
      column.encoding,
      column.dimension
    );
    const builder = new WKBBuilder({
      mode: 'write',
      target: values,
      byteOffset: offsets[rowIndex],
      dimension
    });
    writePhysicalGeometry(builder, chunk, rowIndex, column.encoding, dimension);
    if (offsets[rowIndex] + builder.finishGeometry() !== offsets[rowIndex + 1]) {
      throw new Error('WKB measure and write passes produced different byte lengths');
    }
  }
  return {
    kind: 'serialized',
    encoding: 'binary',
    length: chunk.length,
    offsets,
    values,
    ...(nullCount ? {validity: {values: validity}} : {})
  };
}

function isPhysicalGeometryRowValid(
  array: import('./types').GeoArrowArray,
  rowIndex: number,
  encoding: import('./types').GeoArrowEncoding
): boolean {
  if (!isGeoArrowValueValid(array.validity, rowIndex)) return false;
  if (encoding !== 'geoarrow.geometry' || array.kind !== 'dense-union') return true;
  const physical = (array.offset || 0) + rowIndex;
  const child = array.children.find(candidate => candidate.typeId === array.typeIds[physical]);
  const childIndex = array.valueOffsets[physical];
  return Boolean(
    child &&
      childIndex >= 0 &&
      childIndex < child.data.length &&
      isGeoArrowValueValid(child.data.validity, childIndex)
  );
}

/** Decodes a GeoArrow WKT column into native physical geometry buffers. */
export function decodeGeoArrowWKT(column: GeoArrowColumn): GeoArrowColumn {
  if (column.encoding !== 'geoarrow.wkt') throw new Error('Expected a geoarrow.wkt column');
  const rows = normalizeRowsToDimension(
    decodeSerializedRows(column, bytes => parseWKT(textDecoder.decode(bytes))),
    column.dimension
  );
  return copyMetadata(
    column,
    makeGeoArrowColumnFromGeometryRows(rows, {dimension: column.dimension})
  );
}

/** Encodes a native GeoArrow column as variable-width UTF-8 WKT. */
export function encodeGeoArrowWKT(column: GeoArrowColumn): GeoArrowColumn {
  if (column.encoding === 'geoarrow.wkt') return column;
  const values: Array<Uint8Array | null> = [];
  for (const chunk of column.chunks) {
    for (let rowIndex = 0; rowIndex < chunk.length; rowIndex++) {
      const row = isGeoArrowValueValid(chunk.validity, rowIndex)
        ? materializeGeometryRow(chunk, rowIndex, column.encoding)
        : null;
      values.push(row ? textEncoder.encode(formatWKT(row, column.dimension)) : null);
    }
  }
  return copyMetadata(column, makeSerializedColumn(values, 'geoarrow.wkt', column.dimension));
}

function writePhysicalGeometry(
  builder: WKBBuilder,
  array: import('./types').GeoArrowArray,
  rowIndex: number,
  encoding: import('./types').GeoArrowEncoding,
  dimension: GeoArrowDimension
): void {
  const depth = getEncodingDepth(encoding);
  if (encoding === 'geoarrow.geometry' && array.kind === 'dense-union') {
    const physical = (array.offset || 0) + rowIndex;
    const typeId = array.typeIds[physical];
    const child = array.children.find(candidate => candidate.typeId === typeId);
    if (!child) throw new Error('Dense-union row references an unknown child');
    const childDimension = child.dimension || dimension;
    builder.withDimension(childDimension, () =>
      writePhysicalGeometry(
        builder,
        child.data,
        array.valueOffsets[physical],
        child.encoding || encodingFromName(child.name),
        childDimension
      )
    );
    return;
  }
  if (encoding === 'geoarrow.geometrycollection' && array.kind === 'list') {
    const [first, last] = getListRange(array, rowIndex);
    builder.beginGeometry('GeometryCollection', last - first);
    if (array.child.kind !== 'dense-union')
      throw new Error('GeometryCollection requires dense union child');
    const union = array.child;
    for (let index = first; index < last; index++) {
      const physical = (union.offset || 0) + index;
      const child = union.children.find(candidate => candidate.typeId === union.typeIds[physical]);
      if (child) {
        const childDimension = child.dimension || dimension;
        builder.withDimension(childDimension, () =>
          writePhysicalGeometry(
            builder,
            child.data,
            union.valueOffsets[physical],
            child.encoding || encodingFromName(child.name),
            childDimension
          )
        );
      }
    }
    return;
  }
  if (array.kind !== 'list' && depth > 0) throw new Error(`Invalid ${encoding} storage`);
  const writeCoordinate = (leaf: import('./types').GeoArrowArray, index: number): void => {
    const coordinate = readPhysicalCoordinate(leaf, index);
    if (!coordinate) throw new Error('Invalid GeoArrow coordinate storage');
    if (dimension === 'xym')
      builder.writeCoordinate(coordinate[0], coordinate[1], undefined, coordinate[2]);
    else if (dimension === 'xyzm')
      builder.writeCoordinate(coordinate[0], coordinate[1], coordinate[2], coordinate[3]);
    else builder.writeCoordinate(coordinate[0], coordinate[1], coordinate[2]);
  };
  const writeSequence = (
    leaf: import('./types').GeoArrowArray,
    first: number,
    last: number
  ): void => {
    for (let index = first; index < last; index++) writeCoordinate(leaf, index);
  };
  if (encoding === 'geoarrow.point') {
    builder.beginPoint();
    writeCoordinate(array, rowIndex);
  } else if (encoding === 'geoarrow.linestring' || encoding === 'geoarrow.multipoint') {
    const [first, last] = getListRange(array as import('./types').GeoArrowList, rowIndex);
    if (encoding === 'geoarrow.linestring') {
      builder.beginLineString(last - first);
      writeSequence((array as import('./types').GeoArrowList).child, first, last);
    } else {
      builder.beginMultiPoint(last - first);
      const leaf = (array as import('./types').GeoArrowList).child;
      for (let index = first; index < last; index++) {
        builder.beginPoint();
        writeCoordinate(leaf, index);
      }
    }
  } else if (encoding === 'geoarrow.polygon' || encoding === 'geoarrow.multilinestring') {
    const [first, last] = getListRange(array as import('./types').GeoArrowList, rowIndex);
    const parts = (array as import('./types').GeoArrowList).child;
    if (encoding === 'geoarrow.polygon') builder.beginPolygon(last - first);
    else builder.beginMultiLineString(last - first);
    for (let partIndex = first; partIndex < last; partIndex++) {
      const [ringFirst, ringLast] = getListRange(
        parts as import('./types').GeoArrowList,
        partIndex
      );
      const leaf = (parts as import('./types').GeoArrowList).child;
      if (encoding === 'geoarrow.polygon') builder.beginLinearRing(ringLast - ringFirst);
      else builder.beginLineString(ringLast - ringFirst);
      writeSequence(leaf, ringFirst, ringLast);
    }
  } else if (encoding === 'geoarrow.multipolygon') {
    const [first, last] = getListRange(array as import('./types').GeoArrowList, rowIndex);
    const polygons = (array as import('./types').GeoArrowList).child;
    builder.beginMultiPolygon(last - first);
    for (let polygonIndex = first; polygonIndex < last; polygonIndex++) {
      const [partFirst, partLast] = getListRange(
        polygons as import('./types').GeoArrowList,
        polygonIndex
      );
      const parts = (polygons as import('./types').GeoArrowList).child;
      builder.beginPolygon(partLast - partFirst);
      for (let partIndex = partFirst; partIndex < partLast; partIndex++) {
        const [ringFirst, ringLast] = getListRange(
          parts as import('./types').GeoArrowList,
          partIndex
        );
        builder.beginLinearRing(ringLast - ringFirst);
        writeSequence((parts as import('./types').GeoArrowList).child, ringFirst, ringLast);
      }
    }
  }
}

function getPhysicalGeometryDimension(
  array: import('./types').GeoArrowArray,
  rowIndex: number,
  encoding: import('./types').GeoArrowEncoding,
  dimension: GeoArrowDimension
): GeoArrowDimension {
  if (encoding !== 'geoarrow.geometry' || array.kind !== 'dense-union') return dimension;
  const physical = (array.offset || 0) + rowIndex;
  const child = array.children.find(candidate => candidate.typeId === array.typeIds[physical]);
  return child?.dimension || dimension;
}

function readPhysicalCoordinate(
  array: import('./types').GeoArrowArray,
  index: number
): number[] | null {
  if (array.kind === 'fixed-size-list' && array.child.kind === 'primitive') {
    const logical = (array.offset || 0) + index;
    const values: number[] = [];
    for (let component = 0; component < array.size; component++)
      values.push(
        Number(
          array.child.values[
            (array.child.offset || 0) +
              (logical * array.size + component) * (array.child.stride || 1)
          ]
        )
      );
    return values;
  }
  if (array.kind === 'struct') {
    const logical = (array.offset || 0) + index;
    return ['x', 'y', 'z', 'm'].flatMap(name => {
      const child = array.children[name];
      return child?.kind === 'primitive'
        ? [Number(child.values[(child.offset || 0) + logical * (child.stride || 1)])]
        : [];
    });
  }
  return null;
}

function getListRange(list: import('./types').GeoArrowList, index: number): [number, number] {
  const offset = (list.offset || 0) + index;
  const base =
    typeof (list.offsetBase ?? 0) === 'bigint'
      ? Number(list.offsetBase)
      : Number(list.offsetBase ?? 0);
  return [
    getGeoArrowOffset(list.offsets, offset) - base,
    getGeoArrowOffset(list.offsets, offset + 1) - base
  ];
}

function getEncodingDepth(encoding: import('./types').GeoArrowEncoding): number {
  return encoding === 'geoarrow.point'
    ? 0
    : encoding === 'geoarrow.linestring' || encoding === 'geoarrow.multipoint'
      ? 1
      : encoding === 'geoarrow.polygon' || encoding === 'geoarrow.multilinestring'
        ? 2
        : 3;
}

function encodingFromName(name: string): import('./types').GeoArrowEncoding {
  return `geoarrow.${name.toLowerCase()}` as import('./types').GeoArrowEncoding;
}

function normalizeRowsToDimension(
  rows: readonly (GeoArrowGeometryValue | null)[],
  dimension: GeoArrowDimension
): Array<GeoArrowGeometryValue | null> {
  const size = getGeoArrowDimensionSize(dimension);
  const normalizeGeometry = (geometry: GeoArrowGeometryValue): GeoArrowGeometryValue => {
    if (geometry.type === 'GeometryCollection') {
      return {...geometry, geometries: geometry.geometries.map(normalizeGeometry)};
    }
    return {
      ...geometry,
      coordinates: normalizeCoordinateNesting(geometry.coordinates, size)
    } as GeoArrowGeometryValue;
  };
  return rows.map(row => (row ? normalizeGeometry(row) : null));
}

function normalizeCoordinateNesting(value: readonly unknown[], size: number): unknown {
  if (value.length === 0) return [];
  if (typeof value[0] === 'number') {
    const coordinate = (value as readonly number[]).slice(0, size);
    while (coordinate.length < size) coordinate.push(0);
    return coordinate;
  }
  return value.map(child => normalizeCoordinateNesting(child as readonly unknown[], size));
}

function decodeSerializedRows(
  column: GeoArrowColumn,
  decoder: (bytes: Uint8Array) => GeoArrowGeometryValue
): Array<GeoArrowGeometryValue | null> {
  const rows: Array<GeoArrowGeometryValue | null> = [];
  for (const chunk of column.chunks) {
    if (chunk.kind !== 'serialized') throw new Error('Serialized column contains native storage');
    for (let rowIndex = 0; rowIndex < chunk.length; rowIndex++) {
      if (!isGeoArrowValueValid(chunk.validity, rowIndex)) {
        rows.push(null);
        continue;
      }
      rows.push(decoder(getSerializedBytes(chunk, rowIndex)));
    }
  }
  return rows;
}

function getSerializedBytes(array: GeoArrowSerialized, rowIndex: number): Uint8Array {
  if (array.views) {
    const viewIndex = ((array.offset || 0) + rowIndex) * 4;
    const length = array.views[viewIndex];
    // Arrow BinaryView stores short values inline in the 16-byte view record.
    if (length <= 12) {
      const byteOffset = array.views.byteOffset + viewIndex * 4 + 4;
      return new Uint8Array(array.views.buffer, byteOffset, length);
    }
    const bufferIndex = array.views[viewIndex + 2];
    const byteOffset = array.views[viewIndex + 3];
    const data = array.dataBuffers?.[bufferIndex];
    if (!data) throw new Error(`Serialized view references missing data buffer ${bufferIndex}`);
    return data.subarray(byteOffset, byteOffset + length);
  }
  const offsetIndex = (array.offset || 0) + rowIndex;
  const baseValue = array.offsetBase ?? 0;
  const base = typeof baseValue === 'bigint' ? Number(baseValue) : baseValue;
  const first = getGeoArrowOffset(array.offsets, offsetIndex) - base;
  const last = getGeoArrowOffset(array.offsets, offsetIndex + 1) - base;
  return array.values.subarray(first, last);
}

function makeSerializedColumn(
  rows: readonly (Uint8Array | null)[],
  encoding: 'geoarrow.wkb' | 'geoarrow.wkt',
  dimension: GeoArrowDimension
): GeoArrowColumn {
  let byteLength = 0;
  for (const row of rows) byteLength += row?.byteLength || 0;
  const values = new Uint8Array(byteLength);
  const offsets = new Int32Array(rows.length + 1);
  const validity = new Uint8Array(Math.ceil(rows.length / 8));
  let byteOffset = 0;
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex];
    if (row) {
      values.set(row, byteOffset);
      byteOffset += row.byteLength;
      validity[rowIndex >> 3] |= 1 << (rowIndex & 7);
    }
    offsets[rowIndex + 1] = byteOffset;
  }
  const chunk: GeoArrowSerialized = {
    kind: 'serialized',
    encoding: encoding === 'geoarrow.wkb' ? 'binary' : 'utf8',
    length: rows.length,
    offsets,
    values,
    validity: {values: validity}
  };
  return {encoding, dimension, coordinateLayout: null, chunks: [chunk]};
}

function copyMetadata(source: GeoArrowColumn, target: GeoArrowColumn): GeoArrowColumn {
  return {
    ...target,
    spatialReference: source.spatialReference,
    edges: source.edges,
    metadata: source.metadata
  };
}
