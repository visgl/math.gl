// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Vector3} from '@math.gl/core';
import type {CullingResult} from '../../constants';
import {ImplicitShapeBase, type ImplicitShape, type LocalRayIntersection} from './implicit-shape';
import type {AxisAlignedBoundingBox} from '../bounding-volumes/axis-aligned-bounding-box';
import type {BoundingSphere} from '../bounding-volumes/bounding-sphere';
import type {Plane} from '../plane';

export type PlaneShapeProps = {sizeX?: number; sizeZ?: number; matrix?: readonly number[]};

/** Analytic glTF plane. The surface faces +Y and the negative-Y half-space is inside. */
export class PlaneShape extends ImplicitShapeBase {
  readonly type = 'plane' as const;
  readonly sizeX?: number;
  readonly sizeZ?: number;
  constructor(props: PlaneShapeProps = {}) {
    super(props.matrix);
    this.sizeX = props.sizeX;
    this.sizeZ = props.sizeZ;
    if (this.sizeX !== undefined && (!Number.isFinite(this.sizeX) || this.sizeX <= 0))
      throw new Error('Plane sizeX must be greater than zero');
    if (this.sizeZ !== undefined && (!Number.isFinite(this.sizeZ) || this.sizeZ <= 0))
      throw new Error('Plane sizeZ must be greater than zero');
  }
  clone(): PlaneShape {
    return new PlaneShape({sizeX: this.sizeX, sizeZ: this.sizeZ, matrix: this.matrix});
  }
  override equals(shape: ImplicitShape): boolean {
    return (
      shape instanceof PlaneShape &&
      super.equals(shape) &&
      this.sizeX === shape.sizeX &&
      this.sizeZ === shape.sizeZ
    );
  }
  containsLocalPoint(point: readonly number[]): boolean {
    return point[1] <= 1e-12;
  }
  distanceToLocalPoint(point: readonly number[]): number {
    return Math.max(0, point[1]);
  }
  supportLocal(): readonly number[] {
    throw new Error('An unbounded plane half-space has no finite support point');
  }
  intersectLocalRay(
    origin: readonly number[],
    direction: readonly number[]
  ): LocalRayIntersection | undefined {
    if (Math.abs(direction[1]) < 1e-15) return undefined;
    const distance = -origin[1] / direction[1];
    if (distance < 0) return undefined;
    const x = origin[0] + distance * direction[0];
    const z = origin[2] + distance * direction[2];
    if (this.sizeX !== undefined && Math.abs(x) > this.sizeX / 2 + 1e-12) return undefined;
    if (this.sizeZ !== undefined && Math.abs(z) > this.sizeZ / 2 + 1e-12) return undefined;
    return {distance, normal: [0, 1, 0]};
  }
  override intersectPlane(plane: Plane): CullingResult {
    const boundaryPoint = new Vector3(0, 0, 0).transform(this.matrix);
    const inverse = this.inverseMatrix;
    const boundaryNormal = new Vector3(inverse[1], inverse[5], inverse[9]).normalize();
    const alignment = boundaryNormal.dot(plane.normal);
    if (Math.abs(Math.abs(alignment) - 1) > 1e-10) return 'intersecting';
    const boundaryDistance = plane.getPointDistance(boundaryPoint);
    if (alignment < 0 && boundaryDistance > 0) return 'inside';
    if (alignment > 0 && boundaryDistance < 0) return 'outside';
    return 'intersecting';
  }
  override getAxisAlignedBoundingBox(): AxisAlignedBoundingBox | undefined {
    return undefined;
  }
  override getBoundingSphere(): BoundingSphere | undefined {
    return undefined;
  }
}
