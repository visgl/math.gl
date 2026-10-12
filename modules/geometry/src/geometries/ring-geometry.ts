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
  type Vector
} from './primitive-mesh-builder';
export type RingGeometryProps = PrimitiveGeometryProps & {
  innerRadius?: number;
  outerRadius?: number;
  height?: number;
  segments?: number;
  startAngle?: number;
  sweepAngle?: number;
};
/** Closed annular sector in XZ, centered vertically with hard top, bottom and end caps. */
export class RingGeometry extends Geometry {
  constructor(props: RingGeometryProps = {}) {
    const {
      innerRadius = 0.5,
      outerRadius = 1,
      height = 0.1,
      segments = 48,
      startAngle = 0,
      sweepAngle = FULL_CIRCLE
    } = props;
    assertPositive(innerRadius, 'innerRadius');
    assertPositive(outerRadius, 'outerRadius');
    assertPositive(height, 'height');
    if (innerRadius >= outerRadius) throw new Error('innerRadius must be smaller than outerRadius');
    validateArc(segments, startAngle, sweepAngle);
    const mesh = new PrimitiveMeshBuilder();
    for (let segment = 0; segment < segments; segment++) {
      const firstAngle = startAngle + (segment * sweepAngle) / segments;
      const secondAngle =
        sweepAngle === FULL_CIRCLE && segment === segments - 1
          ? startAngle
          : startAngle + ((segment + 1) * sweepAngle) / segments;
      const makeCapVertex = (radius: number, height: number, angle: number, normal: Vector) =>
        vertex(radius, height, angle, normal, [
          ((radius * Math.cos(angle)) / outerRadius + 1) / 2,
          ((radius * Math.sin(angle)) / outerRadius + 1) / 2
        ]);
      for (const direction of [-1, 1]) {
        const normal: Vector = [0, direction, 0];
        mesh.quad(
          makeCapVertex(innerRadius, (direction * height) / 2, firstAngle, normal),
          makeCapVertex(outerRadius, (direction * height) / 2, firstAngle, normal),
          makeCapVertex(outerRadius, (direction * height) / 2, secondAngle, normal),
          makeCapVertex(innerRadius, (direction * height) / 2, secondAngle, normal)
        );
      }
      for (const [radius, direction] of [
        [innerRadius, -1],
        [outerRadius, 1]
      ]) {
        mesh.quad(
          vertex(radius, -height / 2, firstAngle, radial(firstAngle, direction), [
            segment / segments,
            0
          ]),
          vertex(radius, height / 2, firstAngle, radial(firstAngle, direction), [
            segment / segments,
            1
          ]),
          vertex(radius, height / 2, secondAngle, radial(secondAngle, direction), [
            (segment + 1) / segments,
            1
          ]),
          vertex(radius, -height / 2, secondAngle, radial(secondAngle, direction), [
            (segment + 1) / segments,
            0
          ])
        );
      }
    }
    if (sweepAngle < FULL_CIRCLE) {
      for (const [angle, direction] of [
        [startAngle, -1],
        [startAngle + sweepAngle, 1]
      ]) {
        const normal: Vector = [-Math.sin(angle) * direction, 0, -Math.cos(angle) * direction];
        mesh.quad(
          vertex(innerRadius, -height / 2, angle, normal, [0, 0]),
          vertex(outerRadius, -height / 2, angle, normal, [1, 0]),
          vertex(outerRadius, height / 2, angle, normal, [1, 1]),
          vertex(innerRadius, height / 2, angle, normal, [0, 1])
        );
      }
    }
    super(mesh.getProps(props));
  }
}
