// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type {TypedArray, TypedArrayConstructor} from '@math.gl/types';

export {GL, GL_TYPE, GL_PRIMITIVE, GL_PRIMITIVE_MODE} from './constants';
export {default as GLType} from './gl-type';

export type {Geometry, GeometryAttribute} from './geometry';
export {isGeometry} from './geometry';

export type {Primitive} from './primitive-iterator';
export {makeAttributeIterator} from './attribute-iterator';
export {makePrimitiveIterator} from './primitive-iterator';
export {computeVertexNormals} from './compute-vertex-normals';

export {encodeRGB565, decodeRGB565} from './rgb565';
export {concatTypedArrays} from './typed-array-utils';

export {
  octEncodeInRange,
  octEncode,
  octEncodeToVector4,
  octDecodeInRange,
  octDecode,
  octDecodeFromVector4,
  octPackFloat,
  octEncodeFloat,
  octDecodeFloat,
  octPack,
  octUnpack,
  compressTextureCoordinates,
  decompressTextureCoordinates,
  zigZagDeltaDecode
} from './attribute-compression';

export {emod} from './coordinates';
