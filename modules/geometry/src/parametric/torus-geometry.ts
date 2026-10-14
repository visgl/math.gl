// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {Geometry} from '../lib/geometry';
import {
  assertPositive,
  assertSegments,
  makeIndices,
  type PrimitiveGeometryProps
} from '../geometries/geometry-helpers';
import {ParametricGeometry} from './parametric-geometry';
export type TorusGeometryProps = PrimitiveGeometryProps & {
  majorRadius?: number;
  minorRadius?: number;
  majorSegments?: number;
  minorSegments?: number;
  /** Sweep in radians, (0, 2π]. Partial sweeps have open ends unless cap is enabled. */
  arc?: number;
  /** Rotation in radians about Y; positive angles turn toward negative Z. */
  startAngle?: number;
  /** Close partial sweeps with flat end disks. Ignored for a full revolution. */
  cap?: boolean;
};
/** Ring torus around Y, with outward analytic normals and separate UV seam rows. */
export class TorusGeometry extends ParametricGeometry {
  constructor(props: TorusGeometryProps = {}) {
    const {
      majorRadius = 1,
      minorRadius = 0.3,
      majorSegments = 48,
      minorSegments = 24,
      arc = Math.PI * 2,
      startAngle = 0,
      cap = false
    } = props;
    assertPositive(majorRadius, 'majorRadius');
    assertPositive(minorRadius, 'minorRadius');
    if (minorRadius >= majorRadius)
      throw new RangeError('Ring torus requires minorRadius < majorRadius');
    if (!Number.isFinite(arc) || arc <= 0 || arc > Math.PI * 2)
      throw new RangeError('arc must be in (0, 2π]');
    assertSegments(majorSegments, 'majorSegments', 3);
    assertSegments(minorSegments, 'minorSegments', 3);
    if (!Number.isFinite(startAngle)) throw new RangeError('startAngle must be finite');
    const hasCaps = cap && arc < Math.PI * 2;
    super({
      ...props,
      attributes: hasCaps ? undefined : props.attributes,
      uSegments: majorSegments,
      vSegments: minorSegments,
      periodicU: arc === Math.PI * 2,
      periodicV: true,
      sample: (u, v) => {
        const theta = startAngle + u * arc,
          phi = v * Math.PI * 2,
          radius = majorRadius + minorRadius * Math.cos(phi);
        return [radius * Math.cos(theta), minorRadius * Math.sin(phi), -radius * Math.sin(theta)];
      },
      normal: (u, v) => [
        Math.cos(v * Math.PI * 2) * Math.cos(startAngle + u * arc),
        Math.sin(v * Math.PI * 2),
        -Math.cos(v * Math.PI * 2) * Math.sin(startAngle + u * arc)
      ]
    });
    if (hasCaps) {
      const surfacePositions = this.attributes['POSITION'].value;
      const positions = Array.from(surfacePositions);
      const normals = Array.from(this.attributes['NORMAL'].value);
      const textureCoordinates = Array.from(this.attributes['TEXCOORD_0'].value);
      const indices = Array.from(this.indices!.value);
      for (const [angle, direction] of [
        [startAngle, -1],
        [startAngle + arc, 1]
      ]) {
        const normal = [-Math.sin(angle) * direction, 0, -Math.cos(angle) * direction];
        const centerIndex = positions.length / 3;
        positions.push(majorRadius * Math.cos(angle), 0, -majorRadius * Math.sin(angle));
        normals.push(...normal);
        textureCoordinates.push(0.5, 0.5);
        for (let minorSegment = 0; minorSegment <= minorSegments; minorSegment++) {
          // The final disk vertex duplicates the first exactly, matching the tube UV seam.
          const tubeAngle = ((minorSegment % minorSegments) * Math.PI * 2) / minorSegments;
          // Copy boundary positions so disk and tube edges match bit for bit.
          const boundaryOffset =
            (minorSegment * (majorSegments + 1) + (direction < 0 ? 0 : majorSegments)) * 3;
          positions.push(...surfacePositions.slice(boundaryOffset, boundaryOffset + 3));
          normals.push(...normal);
          textureCoordinates.push((Math.cos(tubeAngle) + 1) / 2, (Math.sin(tubeAngle) + 1) / 2);
          if (minorSegment < minorSegments) {
            const firstIndex = centerIndex + minorSegment + 1;
            const secondIndex = firstIndex + 1;
            indices.push(
              centerIndex,
              ...(direction > 0 ? [secondIndex, firstIndex] : [firstIndex, secondIndex])
            );
          }
        }
      }
      const cappedGeometry = new Geometry({
        id: this.id,
        topology: this.topology,
        indices: makeIndices(positions.length / 3, indices),
        attributes: {
          POSITION: {size: 3, value: new Float32Array(positions)},
          NORMAL: {size: 3, value: new Float32Array(normals)},
          TEXCOORD_0: {size: 2, value: new Float32Array(textureCoordinates)},
          ...props.attributes
        }
      });
      // Finish construction with validated cap data while retaining ParametricGeometry inheritance.
      Object.assign(this, {
        attributes: cappedGeometry.attributes,
        indices: cappedGeometry.indices,
        vertexCount: cappedGeometry.vertexCount
      });
    }
  }
}
