// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Geometry} from '../lib/geometry';
import {
  assertNonNegative,
  assertPositive,
  assertSegments,
  makeIndices,
  type PrimitiveGeometryProps
} from './geometry-helpers';

export type TruncatedConeGeometryProps = PrimitiveGeometryProps & {
  topRadius?: number;
  bottomRadius?: number;
  topCap?: boolean;
  bottomCap?: boolean;
  height?: number;
  nradial?: number;
  nvertical?: number;
  verticalAxis?: 'x' | 'y' | 'z';
};

/** General truncated cone primitive, adapted from luma.gl's CPU tessellator. */
export class TruncatedConeGeometry extends Geometry {
  constructor(props: TruncatedConeGeometryProps = {}) {
    const {
      topRadius = 0,
      bottomRadius = 0,
      topCap = false,
      bottomCap = false,
      height = 1,
      nradial = 10,
      nvertical = 1,
      verticalAxis = 'y'
    } = props;
    assertNonNegative(topRadius, 'topRadius');
    assertNonNegative(bottomRadius, 'bottomRadius');
    if (topRadius === 0 && bottomRadius === 0)
      throw new Error('At least one radius must be greater than zero');
    assertPositive(height, 'height');
    assertSegments(nradial, 'nradial', 3);
    assertSegments(nvertical, 'nvertical');

    const positions: number[] = [];
    const normals: number[] = [];
    const texCoords: number[] = [];
    const indices: number[] = [];
    const stride = nradial + 1;
    const slope = (bottomRadius - topRadius) / height;
    const normalScale = 1 / Math.hypot(1, slope);

    const addRing = (
      radius: number,
      y: number,
      normalRadius: number,
      normalY: number,
      v: number
    ): number => {
      const ring = positions.length / 3 / stride;
      for (let radial = 0; radial <= nradial; radial++) {
        const u = radial / nradial;
        const angle = u * Math.PI * 2;
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);
        const point = orient([sin * radius, y, cos * radius], verticalAxis);
        const normal = orient([sin * normalRadius, normalY, cos * normalRadius], verticalAxis);
        positions.push(...point);
        normals.push(...normal);
        texCoords.push(u, v);
      }
      return ring;
    };
    const connect = (lower: number, upper: number): void => {
      for (let radial = 0; radial < nradial; radial++) {
        const a = lower * stride + radial;
        const b = a + 1;
        const c = upper * stride + radial;
        const d = c + 1;
        indices.push(a, b, d, a, d, c);
      }
    };

    let previous: number | undefined;
    if (bottomCap) {
      const center = addRing(0, -height / 2, 0, -1, 0);
      const edge = addRing(bottomRadius, -height / 2, 0, -1, 1);
      connect(center, edge);
      previous = addRing(bottomRadius, -height / 2, normalScale, slope * normalScale, 0);
    }
    for (let vertical = 0; vertical <= nvertical; vertical++) {
      const v = vertical / nvertical;
      const radius = bottomRadius + (topRadius - bottomRadius) * v;
      const ring = addRing(radius, (v - 0.5) * height, normalScale, slope * normalScale, v);
      if (previous !== undefined && !(bottomCap && vertical === 0)) connect(previous, ring);
      previous = ring;
    }
    if (topCap && previous !== undefined) {
      const edge = addRing(topRadius, height / 2, 0, 1, 1);
      const center = addRing(0, height / 2, 0, 1, 0);
      connect(edge, center);
    }

    const vertexCount = positions.length / 3;
    super({
      id: props.id,
      topology: 'triangle-list',
      indices: makeIndices(vertexCount, indices),
      attributes: {
        POSITION: {size: 3, value: new Float32Array(positions)},
        NORMAL: {size: 3, value: new Float32Array(normals)},
        TEXCOORD_0: {size: 2, value: new Float32Array(texCoords)},
        ...props.attributes
      }
    });
  }
}

function orient(vector: readonly number[], axis: 'x' | 'y' | 'z'): number[] {
  switch (axis) {
    case 'x':
      return [vector[1], vector[2], vector[0]];
    case 'z':
      return [vector[2], vector[0], vector[1]];
    default:
      return [vector[0], vector[1], vector[2]];
  }
}
