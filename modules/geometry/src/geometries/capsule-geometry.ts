// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Geometry} from '../lib/geometry';
import {
  assertNonNegative,
  assertPositive,
  assertSegments,
  type PrimitiveGeometryProps
} from './geometry-helpers';
import {makeSurfaceOfRevolution, type ProfileRing} from './surface-of-revolution';

export type CapsuleGeometryProps = PrimitiveGeometryProps & {
  height?: number;
  radiusBottom?: number;
  radiusTop?: number;
  nradial?: number;
  ncap?: number;
  nvertical?: number;
};

/** Tessellates the convex hull of two endpoint spheres described by the glTF capsule shape. */
export class CapsuleGeometry extends Geometry {
  constructor(props: CapsuleGeometryProps = {}) {
    const {
      height = 1,
      radiusBottom = 0.5,
      radiusTop = 0.5,
      nradial = 10,
      ncap = 5,
      nvertical = 1
    } = props;
    assertPositive(height, 'height');
    assertNonNegative(radiusBottom, 'radiusBottom');
    assertNonNegative(radiusTop, 'radiusTop');
    if (radiusBottom === 0 && radiusTop === 0)
      throw new Error('At least one radius must be greater than zero');
    assertSegments(nradial, 'nradial', 3);
    assertSegments(ncap, 'ncap', 1);
    assertSegments(nvertical, 'nvertical', 1);

    const rings: ProfileRing[] = [];
    const deltaRadius = radiusTop - radiusBottom;
    if (Math.abs(deltaRadius) >= height) {
      const topWins = radiusTop >= radiusBottom;
      const radius = topWins ? radiusTop : radiusBottom;
      const center = topWins ? height / 2 : -height / 2;
      addSphereRings(rings, center, radius, ncap * 2);
    } else {
      const sinSlope = deltaRadius / height;
      const radialNormal = Math.sqrt(1 - sinSlope * sinSlope);
      const sideNormalY = -sinSlope;
      const bottomCenter = -height / 2;
      const topCenter = height / 2;
      for (let i = 0; i <= ncap; i++) {
        const normalY = -1 + ((sideNormalY + 1) * i) / ncap;
        const normalRadius = Math.sqrt(Math.max(0, 1 - normalY * normalY));
        rings.push({
          radius: radiusBottom * normalRadius,
          y: bottomCenter + radiusBottom * normalY,
          normalRadius,
          normalY
        });
      }
      for (let i = 1; i <= nvertical; i++) {
        const t = i / nvertical;
        const radius = radiusBottom + deltaRadius * t;
        const center = bottomCenter + height * t;
        rings.push({
          radius: radius * radialNormal,
          y: center + radius * sideNormalY,
          normalRadius: radialNormal,
          normalY: sideNormalY
        });
      }
      for (let i = 1; i <= ncap; i++) {
        const normalY = sideNormalY + ((1 - sideNormalY) * i) / ncap;
        const normalRadius = Math.sqrt(Math.max(0, 1 - normalY * normalY));
        rings.push({
          radius: radiusTop * normalRadius,
          y: topCenter + radiusTop * normalY,
          normalRadius,
          normalY
        });
      }
    }
    const mesh = makeSurfaceOfRevolution(rings, nradial);
    super({
      id: props.id,
      topology: 'triangle-list',
      indices: mesh.indexArray,
      attributes: {
        POSITION: {size: 3, value: new Float32Array(mesh.positions)},
        NORMAL: {size: 3, value: new Float32Array(mesh.normals)},
        TEXCOORD_0: {size: 2, value: new Float32Array(mesh.texCoords)},
        ...props.attributes
      }
    });
  }
}

function addSphereRings(
  rings: ProfileRing[],
  center: number,
  radius: number,
  segments: number
): void {
  for (let i = 0; i <= segments; i++) {
    const angle = -Math.PI / 2 + (i / segments) * Math.PI;
    const normalRadius = Math.cos(angle);
    const normalY = Math.sin(angle);
    rings.push({
      radius: radius * normalRadius,
      y: center + radius * normalY,
      normalRadius,
      normalY
    });
  }
}
