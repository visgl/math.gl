// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Geometry} from '../lib/geometry';
import {
  assertPositive,
  assertSegments,
  makeIndices,
  type PrimitiveGeometryProps
} from './geometry-helpers';

export type PlaneGeometryProps = PrimitiveGeometryProps & {
  sizeX: number;
  sizeZ: number;
  nx?: number;
  nz?: number;
};

/** Tessellates a finite glTF plane in XZ with its front face and normal pointing +Y. */
export class PlaneGeometry extends Geometry {
  constructor(props: PlaneGeometryProps) {
    const {sizeX, sizeZ, nx = 1, nz = 1} = props;
    assertPositive(sizeX, 'sizeX');
    assertPositive(sizeZ, 'sizeZ');
    assertSegments(nx, 'nx');
    assertSegments(nz, 'nz');
    const positions: number[] = [];
    const normals: number[] = [];
    const texCoords: number[] = [];
    const indexValues: number[] = [];
    for (let z = 0; z <= nz; z++) {
      const v = z / nz;
      for (let x = 0; x <= nx; x++) {
        const u = x / nx;
        positions.push((u - 0.5) * sizeX, 0, (0.5 - v) * sizeZ);
        normals.push(0, 1, 0);
        texCoords.push(u, v);
      }
    }
    const stride = nx + 1;
    for (let z = 0; z < nz; z++) {
      for (let x = 0; x < nx; x++) {
        const a = z * stride + x;
        const b = a + 1;
        const c = a + stride;
        const d = c + 1;
        indexValues.push(a, b, d, a, d, c);
      }
    }
    const vertexCount = positions.length / 3;
    super({
      id: props.id,
      topology: 'triangle-list',
      indices: makeIndices(vertexCount, indexValues),
      attributes: {
        POSITION: {size: 3, value: new Float32Array(positions)},
        NORMAL: {size: 3, value: new Float32Array(normals)},
        TEXCOORD_0: {size: 2, value: new Float32Array(texCoords)},
        ...props.attributes
      }
    });
  }
}
