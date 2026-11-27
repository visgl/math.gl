// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GeometryInput} from './geometry';
import {getAttributeValues, getPositionAttribute, isGeometry} from './geometry';

/** One dereferenced point, line, or triangle primitive. */
export type Primitive = {
  /** The input geometry’s attribute map. */
  attributes: object;
  /** List topology of the emitted primitive. */
  type: 'point-list' | 'line-list' | 'triangle-list';
  /** Index of the first vertex. */
  i1: number;
  /** Index of the second vertex on a line or triangle. */
  i2?: number;
  /** Index of the third vertex on a triangle. */
  i3?: number;
  /** Zero-based index in this iteration. */
  primitiveIndex: number;
};

/**
 * Iterates through a geometry's primitives and dereferences optional indices.
 *
 * @param geometry - Geometry whose optional indices are dereferenced.
 * @param options - Zero-based, end-exclusive range in the index or vertex sequence.
 */
export function* makePrimitiveIterator(
  geometry: GeometryInput,
  options: {
    /** Offset of the first index or vertex to consider. */
    start?: number;
    /** Exclusive end of the range. Defaults to the index or vertex count. */
    end?: number;
  } = {}
): Iterable<Primitive> {
  if (!isGeometry(geometry)) {
    throw new TypeError('Geometry with a supported topology and attributes is required');
  }
  const {start = 0} = options;
  let end = options.end;
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

  /** Resolves an index-buffer offset or sequential vertex index. */
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
