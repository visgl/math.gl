// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Geometry, type GeometryAttributeInput} from '../lib/geometry';
import {assertPositive, makeIndices, type PrimitiveGeometryProps} from './geometry-helpers';

export type BoxGeometryProps = PrimitiveGeometryProps & {size?: readonly [number, number, number]};

/** Tessellates the glTF box shape: centered at the origin with total axis lengths `size`. */
export class BoxGeometry extends Geometry {
  constructor(props: BoxGeometryProps = {}) {
    const size = props.size || [1, 1, 1];
    assertPositive(size[0], 'size[0]');
    assertPositive(size[1], 'size[1]');
    assertPositive(size[2], 'size[2]');
    const half = [size[0] / 2, size[1] / 2, size[2] / 2];
    const positions: number[] = [];
    const normals: number[] = [];
    const texCoords: number[] = [];
    const indices: number[] = [];
    const faces = [
      {n: [1, 0, 0], u: [0, 0, -1], v: [0, 1, 0], h1: half[2], h2: half[1]},
      {n: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0], h1: half[2], h2: half[1]},
      {n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, -1], h1: half[0], h2: half[2]},
      {n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1], h1: half[0], h2: half[2]},
      {n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0], h1: half[0], h2: half[1]},
      {n: [0, 0, -1], u: [-1, 0, 0], v: [0, 1, 0], h1: half[0], h2: half[1]}
    ];
    for (const face of faces) {
      const base = positions.length / 3;
      for (const [s, t, u, v] of [
        [-1, -1, 0, 0],
        [1, -1, 1, 0],
        [1, 1, 1, 1],
        [-1, 1, 0, 1]
      ]) {
        positions.push(
          face.n[0] * half[0] + face.u[0] * face.h1 * s + face.v[0] * face.h2 * t,
          face.n[1] * half[1] + face.u[1] * face.h1 * s + face.v[1] * face.h2 * t,
          face.n[2] * half[2] + face.u[2] * face.h1 * s + face.v[2] * face.h2 * t
        );
        normals.push(...face.n);
        texCoords.push(u, v);
      }
      indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
    super({
      id: props.id,
      topology: 'triangle-list',
      indices: makeIndices(24, indices),
      attributes: {
        POSITION: {size: 3, value: new Float32Array(positions)},
        NORMAL: {size: 3, value: new Float32Array(normals)},
        TEXCOORD_0: {size: 2, value: new Float32Array(texCoords)},
        ...props.attributes
      } as Record<string, GeometryAttributeInput>
    });
  }
}

export type CubeGeometryProps = PrimitiveGeometryProps & {size?: number};

/** Convenience alias for an equal-sided box. */
export class CubeGeometry extends BoxGeometry {
  constructor(props: CubeGeometryProps = {}) {
    const size = props.size ?? 1;
    super({...props, size: [size, size, size]});
  }
}
