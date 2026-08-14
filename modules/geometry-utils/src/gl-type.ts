// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TypedArray, TypedArrayConstructor} from '@math.gl/types';
import {GL_TYPE} from './constants';

const GL_TYPE_TO_ARRAY_TYPE: Record<number, TypedArrayConstructor> = {
  [GL_TYPE.DOUBLE]: Float64Array,
  [GL_TYPE.FLOAT]: Float32Array,
  [GL_TYPE.UNSIGNED_SHORT]: Uint16Array,
  [GL_TYPE.UNSIGNED_INT]: Uint32Array,
  [GL_TYPE.UNSIGNED_BYTE]: Uint8Array,
  [GL_TYPE.BYTE]: Int8Array,
  [GL_TYPE.SHORT]: Int16Array,
  [GL_TYPE.INT]: Int32Array,
  [GL_TYPE.UNSIGNED_SHORT_4_4_4_4]: Uint16Array,
  [GL_TYPE.UNSIGNED_SHORT_5_5_5_1]: Uint16Array,
  [GL_TYPE.UNSIGNED_SHORT_5_6_5]: Uint16Array
};

const NAME_TO_GL_TYPE: Record<string, number> = Object.fromEntries(
  Object.entries(GL_TYPE).map(([name, glType]) => [name, glType])
);

const TYPE_CONVERSION_ERROR = 'Failed to convert GL type';

/** Converts between WebGL component constants and JavaScript typed arrays. */
export default class GLType {
  /** Returns the WebGL component constant for a typed array or typed-array constructor. */
  static fromTypedArray(arrayOrType: TypedArray | TypedArrayConstructor): number {
    const arrayType = ArrayBuffer.isView(arrayOrType) ? arrayOrType.constructor : arrayOrType;
    for (const [glType, candidateArrayType] of Object.entries(GL_TYPE_TO_ARRAY_TYPE)) {
      if (candidateArrayType === arrayType) {
        return Number(glType);
      }
    }
    throw new Error(TYPE_CONVERSION_ERROR);
  }

  /** Returns a WebGL component constant from its uppercase name. */
  static fromName(name: string): number {
    const glType = NAME_TO_GL_TYPE[name];
    if (glType === undefined) {
      throw new Error(TYPE_CONVERSION_ERROR);
    }
    return glType;
  }

  /** Returns the typed-array constructor for a WebGL component constant. */
  static getArrayType(glType: number): TypedArrayConstructor {
    const ArrayType = GL_TYPE_TO_ARRAY_TYPE[glType];
    if (!ArrayType) {
      throw new Error(TYPE_CONVERSION_ERROR);
    }
    return ArrayType;
  }

  /** Returns the size in bytes of one element of a WebGL component type. */
  static getByteSize(glType: number): number {
    return GLType.getArrayType(glType).BYTES_PER_ELEMENT;
  }

  /** Returns whether a value is a supported WebGL component type. */
  static validate(glType: number): boolean {
    return Boolean(GL_TYPE_TO_ARRAY_TYPE[glType]);
  }

  /** Creates a typed view over an ArrayBuffer or an existing ArrayBuffer view. */
  static createTypedArray(
    glType: number,
    buffer: ArrayBufferLike | ArrayBufferView,
    byteOffset = 0,
    length?: number
  ): TypedArray {
    const ArrayType = GLType.getArrayType(glType);
    const arrayBuffer = ArrayBuffer.isView(buffer) ? buffer.buffer : buffer;
    const viewByteOffset = ArrayBuffer.isView(buffer) ? buffer.byteOffset : 0;
    const resolvedByteOffset = viewByteOffset + byteOffset;
    const resolvedLength =
      length ?? Math.floor((buffer.byteLength - byteOffset) / ArrayType.BYTES_PER_ELEMENT);
    return new ArrayType(arrayBuffer as ArrayBuffer, resolvedByteOffset, resolvedLength);
  }
}
