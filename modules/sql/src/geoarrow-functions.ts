// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Binary, DataType, Field, Precision, Vector, vectorFromArray, type Data} from 'apache-arrow';
import {
  GeoArrowBuilder,
  convertGeoArrowColumn,
  decodeGeoArrowWKB,
  getGeoArrowFieldInfo,
  makeArrowVectorFromGeoArrowColumn,
  makeGeoArrowColumnFromArrowVector,
  type GeoArrowBuilderEncoding,
  type GeoArrowDenseUnionChild,
  type GeoArrowDimension
} from '@math.gl/core/arrow';
import type {ScalarFunction} from './arrow/types';
import {physicalKey} from './arrow/signature';
import {evaluateVectorSpans} from './arrow/vector-mask';

/** The specialized geometry families supported by the conversion package. */
const families = [
  'geoarrow.point',
  'geoarrow.linestring',
  'geoarrow.polygon',
  'geoarrow.multipoint',
  'geoarrow.multilinestring',
  'geoarrow.multipolygon'
] as const;

/** The four native coordinate dimensions in GeoArrow union type-ID order. */
const dimensions = ['xy', 'xyz', 'xym', 'xyzm'] as const;

/** SQL conversion targets. */
type Target = GeoArrowBuilderEncoding | 'geoarrow.wkb' | 'geoarrow.geometry';

/** Controls the physical dimension of new native outputs. */
export type GeoArrowConversionOptions = Readonly<{
  /** Overrides the dimension of new native results. Existing unions retain their schema. */
  dimension?: GeoArrowDimension;
}>;

/** Creates a package of row-preserving WKB and native GeoArrow conversions. */
export function createGeoArrowConversionFunctions(
  options: GeoArrowConversionOptions = {}
): readonly ScalarFunction[] {
  const {dimension} = options;
  const unionSchemas = new Map<GeoArrowDimension | undefined, ReturnType<typeof makeUnionSchema>>();
  const targets: readonly Target[] = ['geoarrow.wkb', ...families, 'geoarrow.geometry'];

  return targets.map(encoding => ({
    kind: 'scalar',
    name:
      encoding === 'geoarrow.geometry'
        ? 'GEOARROW_TO_UNION'
        : `GEOARROW_TO_${encoding.slice(9).toUpperCase()}`,
    prototypes: [],
    resolvePrototype(fields) {
      const source = fields[0];
      if (fields.length !== 1 || !source) return undefined;
      const info = getGeoArrowFieldInfo(source);
      if (!info || info.encoding === 'geoarrow.wkt' || info.encoding === 'geoarrow.box')
        return undefined;

      const outputDimension =
        dimension ?? (info.encoding === 'geoarrow.geometry' ? null : info.dimension) ?? 'xy';
      const identity =
        info.encoding === encoding &&
        (encoding === 'geoarrow.wkb'
          ? DataType.isBinary(source.type)
          : encoding === 'geoarrow.geometry' || outputDimension === info.dimension);
      const unionDimension = dimension ?? info.dimension ?? undefined;
      let union = unionSchemas.get(unionDimension);
      if (encoding === 'geoarrow.geometry' && !identity && !union) {
        union = makeUnionSchema(unionDimension);
        unionSchemas.set(unionDimension, union);
      }
      const type = identity
        ? source.type
        : encoding === 'geoarrow.wkb'
          ? new Binary()
          : encoding === 'geoarrow.geometry'
            ? union!.type
            : makeArrowVectorFromGeoArrowColumn(emptyGeometry(encoding, outputDimension)).type;
      const coordinateType =
        info.encoding !== 'geoarrow.wkb' && !hasFloat64Coordinates(source.type)
          ? 'float64'
          : 'preserve';
      const viewWKB =
        info.encoding === 'geoarrow.wkb' &&
        !DataType.isBinary(source.type) &&
        !DataType.isLargeBinary(source.type);
      const child =
        DataType.isDenseUnion(source.type) &&
        encoding !== 'geoarrow.geometry' &&
        encoding !== 'geoarrow.wkb'
          ? matchingUnionChild(source.type, type, unionTypeId(encoding, outputDimension))
          : undefined;
      const metadata = new Map(source.metadata);
      metadata.set('ARROW:extension:name', encoding);

      /** Converts a contiguous span without reading inactive rows or materializing row objects. */
      const convert = (vector: Vector): Vector => {
        if (identity) return vector;
        const borrowed = child && unwrapUnion(vector, child);
        if (borrowed) return borrowed;
        if (encoding === 'geoarrow.wkb' && viewWKB)
          return vectorFromArray(Array.from(vector), type);
        const column = makeGeoArrowColumnFromArrowVector(vector, {
          field: source
        });
        if (encoding === 'geoarrow.wkb') {
          return makeArrowVectorFromGeoArrowColumn(
            convertGeoArrowColumn(column, {encoding, offsetType: 'int32'})
          );
        }

        const native =
          info.encoding === 'geoarrow.wkb'
            ? decodeGeoArrowWKB(column, {
                encoding,
                dimension:
                  encoding === 'geoarrow.geometry' ? (unionDimension ?? 'infer') : outputDimension
              })
            : column;
        if (info.encoding === 'geoarrow.wkb' && encoding !== 'geoarrow.geometry')
          return makeArrowVectorFromGeoArrowColumn(native);
        const target = convertGeoArrowColumn(native, {
          encoding,
          dimension: encoding === 'geoarrow.geometry' ? unionDimension : outputDimension,
          coordinateLayout: 'interleaved',
          coordinateType,
          offsetType: 'int32',
          unionChildren: encoding === 'geoarrow.geometry' ? union?.children : undefined
        });
        return makeArrowVectorFromGeoArrowColumn(target);
      };

      return {
        arguments: [source],
        result: new Field('geometry', type, source.nullable, metadata),
        nullHandling: 'call',
        evaluate([vector], {activeRows}) {
          return evaluateVectorSpans(vector!, type, activeRows, convert);
        }
      };
    }
  }));
}

/** Builds the same child schema for every batch with the bound input type. */
function makeUnionSchema(dimension?: GeoArrowDimension) {
  const unionChildren: GeoArrowDenseUnionChild[] = families.flatMap(encoding =>
    (dimension ? [dimension] : dimensions).map(childDimension => ({
      name: encoding.slice('geoarrow.'.length),
      encoding,
      dimension: childDimension,
      coordinateLayout: 'interleaved',
      typeId: unionTypeId(encoding, childDimension),
      data: emptyGeometry(encoding, childDimension).chunks[0]
    }))
  );
  const emptyUnion = makeArrowVectorFromGeoArrowColumn({
    encoding: 'geoarrow.geometry',
    dimension: 'xy',
    coordinateLayout: 'interleaved',
    chunks: [
      {
        kind: 'dense-union',
        length: 0,
        typeIds: new Int8Array(0),
        valueOffsets: new Int32Array(0),
        children: unionChildren
      }
    ]
  });
  return {children: unionChildren, type: emptyUnion.type};
}

/** Constructs a typed, zero-row native column for schema binding. */
function emptyGeometry(encoding: GeoArrowBuilderEncoding, dimension: GeoArrowDimension) {
  return GeoArrowBuilder.build([], {encoding, dimension});
}

/** Tests coordinate precision through lists, structs, and union children. */
function hasFloat64Coordinates(type: DataType): boolean {
  if (DataType.isFloat(type)) return type.precision === Precision.DOUBLE;
  return Boolean(
    type.children?.length && type.children.every(field => hasFloat64Coordinates(field.type))
  );
}

/** Returns the GeoArrow wire-format type ID for a concrete union member. */
function unionTypeId(encoding: GeoArrowBuilderEncoding, dimension: GeoArrowDimension): number {
  return families.indexOf(encoding) + dimensions.indexOf(dimension) * 10 + 1;
}

/** Finds a union child whose storage already matches the specialized output. */
function matchingUnionChild(
  union: import('apache-arrow').DenseUnion,
  type: DataType,
  id: number
): {id: number; index: number} | undefined {
  const index = union.typeIdToChildIndex[id];
  if (index !== undefined && physicalKey(union.children[index]!.type) === physicalKey(type))
    return {id, index};
  return undefined;
}

/** Borrows a contiguous child slice when the tags and offsets already match output row order. */
function unwrapUnion(vector: Vector, child: {id: number; index: number}): Vector | undefined {
  const chunks: Data[] = [];
  for (const data of vector.data) {
    const start = data.valueOffsets[0] ?? 0;
    for (let row = 0; row < data.length; row++) {
      if (data.typeIds[row] !== child.id || data.valueOffsets[row] !== start + row)
        return undefined;
    }
    chunks.push(data.children[child.index]!.slice(start, data.length));
  }
  return new Vector(chunks);
}
