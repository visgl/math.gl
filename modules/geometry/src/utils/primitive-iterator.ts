// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GeometryInput} from './geometry';
import {getAttributeValues, getPositionAttribute, isGeometry} from './geometry';

/** One dereferenced point, line, or triangle primitive. */
export type Primitive = {
  attributes: object;
  type: 'point-list' | 'line-list' | 'triangle-list';
  i1: number;
  i2?: number;
  i3?: number;
  primitiveIndex: number;
};

/**
 * Iterates through a geometry's primitives and dereferences optional indices.
 * The optional range is zero-based and end-exclusive.
 */
export function* makePrimitiveIterator(
  geometry: GeometryInput,
  {start = 0, end}: {start?: number; end?: number} = {}
): Iterable<Primitive> {
  if (!isGeometry(geometry)) {
    throw new TypeError('Geometry with a supported topology and attributes is required');
  }
  const {attributes, topology} = geometry;
  const indices = geometry.indices ? getAttributeValues(geometry.indices) : undefined;
  if (end === undefined) {
    if (indices) {
      end = indices.length;
    } else {
      const position = getPositionAttribute(geometry);
      end = getAttributeValues(position).length / (position.size || 3);
    }
  }

  const dereference = (index: number): number => Number(indices ? indices[index] : index);
  let primitiveIndex = 0;

  switch (topology) {
    case 'point-list':
      for (let index = start; index < end; index++) {
        yield {
          attributes,
          type: 'point-list',
          i1: dereference(index),
          primitiveIndex: primitiveIndex++
        };
      }
      return;

    case 'line-list':
      for (let index = start; index + 1 < end; index += 2) {
        yield {
          attributes,
          type: 'line-list',
          i1: dereference(index),
          i2: dereference(index + 1),
          primitiveIndex: primitiveIndex++
        };
      }
      return;

    case 'line-strip':
      for (let index = start; index + 1 < end; index++) {
        yield {
          attributes,
          type: 'line-list',
          i1: dereference(index),
          i2: dereference(index + 1),
          primitiveIndex: primitiveIndex++
        };
      }
      return;

    case 'line-loop':
      for (let index = start; index < end; index++) {
        yield {
          attributes,
          type: 'line-list',
          i1: dereference(index),
          i2: dereference(index + 1 < end ? index + 1 : start),
          primitiveIndex: primitiveIndex++
        };
      }
      return;

    case 'triangle-list':
      for (let index = start; index + 2 < end; index += 3) {
        yield {
          attributes,
          type: 'triangle-list',
          i1: dereference(index),
          i2: dereference(index + 1),
          i3: dereference(index + 2),
          primitiveIndex: primitiveIndex++
        };
      }
      return;

    case 'triangle-strip':
      for (let index = start; index + 2 < end; index++) {
        const odd = (index - start) % 2 === 1;
        yield {
          attributes,
          type: 'triangle-list',
          i1: dereference(odd ? index + 1 : index),
          i2: dereference(odd ? index : index + 1),
          i3: dereference(index + 2),
          primitiveIndex: primitiveIndex++
        };
      }
      return;

    case 'triangle-fan':
      for (let index = start + 1; index + 1 < end; index++) {
        yield {
          attributes,
          type: 'triangle-list',
          i1: dereference(start),
          i2: dereference(index),
          i3: dereference(index + 1),
          primitiveIndex: primitiveIndex++
        };
      }
      return;
  }
}
