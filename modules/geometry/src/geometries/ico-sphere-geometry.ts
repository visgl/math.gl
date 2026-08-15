// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Geometry} from '../lib/geometry';
import {assertPositive, assertSegments, type PrimitiveGeometryProps} from './geometry-helpers';

export type IcoSphereGeometryProps = PrimitiveGeometryProps & {
  radius?: number;
  iterations?: number;
};

/** Subdivided icosahedron projected onto a sphere. Returned as a non-indexed triangle list. */
export class IcoSphereGeometry extends Geometry {
  constructor(props: IcoSphereGeometryProps = {}) {
    const {radius = 0.5, iterations = 0} = props;
    assertPositive(radius, 'radius');
    assertSegments(iterations, 'iterations', 0);
    if (iterations > 8) throw new Error('iterations must be <= 8');
    const t = (1 + Math.sqrt(5)) / 2;
    const vertices = [
      [-1, t, 0],
      [1, t, 0],
      [-1, -t, 0],
      [1, -t, 0],
      [0, -1, t],
      [0, 1, t],
      [0, -1, -t],
      [0, 1, -t],
      [t, 0, -1],
      [t, 0, 1],
      [-t, 0, -1],
      [-t, 0, 1]
    ].map(normalize);
    let faces = [
      [0, 11, 5],
      [0, 5, 1],
      [0, 1, 7],
      [0, 7, 10],
      [0, 10, 11],
      [1, 5, 9],
      [5, 11, 4],
      [11, 10, 2],
      [10, 7, 6],
      [7, 1, 8],
      [3, 9, 4],
      [3, 4, 2],
      [3, 2, 6],
      [3, 6, 8],
      [3, 8, 9],
      [4, 9, 5],
      [2, 4, 11],
      [6, 2, 10],
      [8, 6, 7],
      [9, 8, 1]
    ].map(face => face.map(index => vertices[index]));
    for (let iteration = 0; iteration < iterations; iteration++) {
      const subdivided: number[][][] = [];
      for (const [a, b, c] of faces) {
        const ab = normalize([a[0] + b[0], a[1] + b[1], a[2] + b[2]]);
        const bc = normalize([b[0] + c[0], b[1] + c[1], b[2] + c[2]]);
        const ca = normalize([c[0] + a[0], c[1] + a[1], c[2] + a[2]]);
        subdivided.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
      }
      faces = subdivided;
    }
    const positions: number[] = [];
    const normals: number[] = [];
    const texCoords: number[] = [];
    for (const face of faces) {
      for (const normal of face) {
        positions.push(normal[0] * radius, normal[1] * radius, normal[2] * radius);
        normals.push(...normal);
        texCoords.push(
          0.5 + Math.atan2(normal[0], normal[2]) / (2 * Math.PI),
          0.5 - Math.asin(normal[1]) / Math.PI
        );
      }
    }
    super({
      id: props.id,
      topology: 'triangle-list',
      attributes: {
        POSITION: {size: 3, value: new Float32Array(positions)},
        NORMAL: {size: 3, value: new Float32Array(normals)},
        TEXCOORD_0: {size: 2, value: new Float32Array(texCoords)},
        ...props.attributes
      }
    });
  }
}

function normalize(vector: number[]): number[] {
  const length = Math.hypot(...vector);
  return vector.map(component => component / length);
}
