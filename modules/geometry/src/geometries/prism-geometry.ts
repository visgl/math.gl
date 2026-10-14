// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Geometry} from '../lib/geometry';
import {assertPositive, type PrimitiveGeometryProps} from './geometry-helpers';
import {
  PrimitiveMeshBuilder,
  FULL_CIRCLE,
  radial,
  validateArc,
  vertex,
  type Vector,
  type Vertex
} from './primitive-mesh-builder';
export type PrismGeometryProps = PrimitiveGeometryProps & {
  radius?: number;
  height?: number;
  sides?: number;
  startAngle?: number;
};
/** Closed regular prism, centered at the origin with Y vertical and flat side normals. */
export class PrismGeometry extends Geometry {
  constructor(props: PrismGeometryProps = {}) {
    const {radius = 1, height = 1, sides = 6, startAngle = 0} = props;
    assertPositive(radius, 'radius');
    assertPositive(height, 'height');
    validateArc(sides, startAngle, FULL_CIRCLE);
    const mesh = new PrimitiveMeshBuilder();
    for (let segment = 0; segment < sides; segment++) {
      const firstAngle = startAngle + (segment * FULL_CIRCLE) / sides;
      const secondAngle = startAngle + ((segment + 1) * FULL_CIRCLE) / sides;
      const normal = radial((firstAngle + secondAngle) / 2);
      const secondCornerAngle = segment === sides - 1 ? startAngle : secondAngle;
      mesh.quad(
        vertex(radius, -height / 2, firstAngle, normal, [segment / sides, 0]),
        vertex(radius, height / 2, firstAngle, normal, [segment / sides, 1]),
        vertex(radius, height / 2, secondCornerAngle, normal, [(segment + 1) / sides, 1]),
        vertex(radius, -height / 2, secondCornerAngle, normal, [(segment + 1) / sides, 0])
      );
      for (const direction of [-1, 1]) {
        const capNormal: Vector = [0, direction, 0];
        const center: Vertex = {
          position: [0, (direction * height) / 2, 0],
          normal: capNormal,
          textureCoordinates: [0.5, 0.5]
        };
        mesh.triangle(
          center,
          vertex(radius, (direction * height) / 2, firstAngle, capNormal),
          vertex(radius, (direction * height) / 2, secondCornerAngle, capNormal)
        );
      }
    }
    super(mesh.getProps(props));
  }
}
