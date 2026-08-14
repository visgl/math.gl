// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TypedArray} from '@math.gl/types';
import {GL} from './constants';
import type {Geometry} from './geometry';
import {getAttributeValues, getPositionAttribute, isGeometry} from './geometry';

/** One dereferenced point, line, or triangle primitive. */
export type Primitive = {
  attributes: object;
  type: number;
  i1: number;
  i2?: number;
  i3?: number;
  primitiveIndex: number;
};

/**
 * Iterates through a geometry's primitives and dereferences optional indices.
 *
 * The legacy argument form `(indices, attributes, mode, start, end)` is also supported.
 */
export function* makePrimitiveIterator(
  geometryOrIndices?: Geometry | TypedArray | {value?: TypedArray; values?: TypedArray},
  attributes: object = {},
  mode?: number,
  start = 0,
  end?: number
): Iterable<Primitive> {
  let indices: TypedArray | undefined;
  if (isGeometry(geometryOrIndices)) {
    const geometry = geometryOrIndices;
    indices = geometry.indices ? getAttributeValues(geometry.indices) : undefined;
    attributes = geometry.attributes;
    mode = geometry.mode;
    if (end === undefined) {
      const position = getPositionAttribute(geometry);
      end = indices?.length ?? getAttributeValues(position).length / (position.size || 3);
    }
  } else if (geometryOrIndices) {
    indices = getAttributeValues(geometryOrIndices);
  }

  if (mode === undefined) {
    throw new Error('Primitive mode is required');
  }
  end ??= indices?.length ?? start;

  const dereference = (index: number): number => Number(indices ? indices[index] : index);
  let primitiveIndex = 0;

  switch (mode) {
    case GL.POINTS:
      for (let index = start; index < end; index++) {
        yield {
          attributes,
          type: GL.POINTS,
          i1: dereference(index),
          primitiveIndex: primitiveIndex++
        };
      }
      return;

    case GL.LINES:
      for (let index = start; index + 1 < end; index += 2) {
        yield {
          attributes,
          type: GL.LINES,
          i1: dereference(index),
          i2: dereference(index + 1),
          primitiveIndex: primitiveIndex++
        };
      }
      return;

    case GL.LINE_STRIP:
      for (let index = start; index + 1 < end; index++) {
        yield {
          attributes,
          type: GL.LINES,
          i1: dereference(index),
          i2: dereference(index + 1),
          primitiveIndex: primitiveIndex++
        };
      }
      return;

    case GL.LINE_LOOP:
      for (let index = start; index < end; index++) {
        yield {
          attributes,
          type: GL.LINES,
          i1: dereference(index),
          i2: dereference(index + 1 < end ? index + 1 : start),
          primitiveIndex: primitiveIndex++
        };
      }
      return;

    case GL.TRIANGLES:
      for (let index = start; index + 2 < end; index += 3) {
        yield {
          attributes,
          type: GL.TRIANGLES,
          i1: dereference(index),
          i2: dereference(index + 1),
          i3: dereference(index + 2),
          primitiveIndex: primitiveIndex++
        };
      }
      return;

    case GL.TRIANGLE_STRIP:
      for (let index = start; index + 2 < end; index++) {
        const odd = (index - start) % 2 === 1;
        yield {
          attributes,
          type: GL.TRIANGLES,
          i1: dereference(odd ? index + 1 : index),
          i2: dereference(odd ? index : index + 1),
          i3: dereference(index + 2),
          primitiveIndex: primitiveIndex++
        };
      }
      return;

    case GL.TRIANGLE_FAN:
      for (let index = start + 1; index + 1 < end; index++) {
        yield {
          attributes,
          type: GL.TRIANGLES,
          i1: dereference(start),
          i2: dereference(index),
          i3: dereference(index + 1),
          primitiveIndex: primitiveIndex++
        };
      }
      return;

    default:
      throw new Error(`Unknown primitive mode ${mode}`);
  }
}
