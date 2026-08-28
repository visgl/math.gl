// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Matrix4, Vector3} from '@math.gl/core';
import type {CullingResult} from '../../constants';
import {AxisAlignedBoundingBox} from '../bounding-volumes/axis-aligned-bounding-box';
import {BoundingSphere} from '../bounding-volumes/bounding-sphere';
import type {BoundingVolume} from '../bounding-volumes/bounding-volume';
import type {Plane} from '../plane';
import type {Ray} from '../ray';

export type RayIntersection = {
  distance: number;
  point: Vector3;
  normal: Vector3;
  entering: boolean;
};

export interface ImplicitShape extends BoundingVolume {
  readonly type: 'box' | 'capsule' | 'cylinder' | 'plane' | 'sphere';
  readonly matrix: Matrix4;
  clone(): ImplicitShape;
  equals(shape: ImplicitShape): boolean;
  containsPoint(point: readonly number[]): boolean;
  intersectRay(ray: Ray): RayIntersection | undefined;
  getAxisAlignedBoundingBox(): AxisAlignedBoundingBox | undefined;
  getBoundingSphere(): BoundingSphere | undefined;
}

export type LocalRayIntersection = {distance: number; normal: readonly number[]};

/** Shared affine transform, support mapping and query implementation for finite convex shapes. */
export abstract class ImplicitShapeBase implements ImplicitShape {
  abstract readonly type: ImplicitShape['type'];
  readonly matrix: Matrix4;
  protected inverseMatrix: Matrix4;

  constructor(matrix?: readonly number[]) {
    this.matrix = new Matrix4();
    if (matrix) this.matrix.copy(matrix);
    validateAffineMatrix(this.matrix);
    this.inverseMatrix = this.matrix.clone().invert();
  }

  abstract clone(): ImplicitShapeBase;
  abstract containsLocalPoint(point: readonly number[]): boolean;
  abstract distanceToLocalPoint(point: readonly number[]): number;
  abstract supportLocal(direction: readonly number[]): readonly number[];
  abstract intersectLocalRay(
    origin: readonly number[],
    direction: readonly number[]
  ): LocalRayIntersection | undefined;

  equals(shape: ImplicitShape): boolean {
    if (this.type !== shape.type) return false;
    for (let i = 0; i < 16; i++) if (this.matrix[i] !== shape.matrix[i]) return false;
    return true;
  }

  transform(transform: readonly number[]): this {
    const next = new Matrix4().copy(transform);
    validateAffineMatrix(next);
    this.matrix.multiplyLeft(next);
    validateAffineMatrix(this.matrix);
    this.inverseMatrix.copy(this.matrix).invert();
    return this;
  }

  containsPoint(point: readonly number[]): boolean {
    return this.containsLocalPoint(this.inverseMatrix.transformAsPoint(point) as readonly number[]);
  }

  distanceSquaredTo(point: readonly number[]): number {
    const distance = this.distanceTo(point);
    return distance * distance;
  }

  /** Exact for rigid/uniform transforms; conservative estimate for non-uniform scale or shear. */
  distanceTo(point: readonly number[]): number {
    const localPoint = this.inverseMatrix.transformAsPoint(point);
    const localDistance = this.distanceToLocalPoint(localPoint as readonly number[]);
    const scales = this.matrix.getScale();
    return localDistance * Math.min(scales[0], scales[1], scales[2]);
  }

  intersectPlane(plane: Plane): CullingResult {
    const maximum = this.getSupportPoint(plane.normal);
    const minimum = this.getSupportPoint([-plane.normal[0], -plane.normal[1], -plane.normal[2]]);
    const maxDistance = plane.getPointDistance(maximum);
    const minDistance = plane.getPointDistance(minimum);
    if (minDistance > 0) return 'inside';
    if (maxDistance < 0) return 'outside';
    return 'intersecting';
  }

  intersectRay(ray: Ray): RayIntersection | undefined {
    const localOrigin = this.inverseMatrix.transformAsPoint(ray.origin);
    const localDirection = this.inverseMatrix.transformAsVector(ray.direction);
    const hit = this.intersectLocalRay(
      localOrigin as readonly number[],
      localDirection as readonly number[]
    );
    if (!hit || hit.distance < 0) return undefined;
    const point = new Vector3(ray.direction).scale(hit.distance).add(ray.origin);
    const inverse = this.inverseMatrix;
    const normal = new Vector3(
      inverse[0] * hit.normal[0] + inverse[1] * hit.normal[1] + inverse[2] * hit.normal[2],
      inverse[4] * hit.normal[0] + inverse[5] * hit.normal[1] + inverse[6] * hit.normal[2],
      inverse[8] * hit.normal[0] + inverse[9] * hit.normal[1] + inverse[10] * hit.normal[2]
    ).normalize();
    return {distance: hit.distance, point, normal, entering: ray.direction.dot(normal) < 0};
  }

  getAxisAlignedBoundingBox(): AxisAlignedBoundingBox | undefined {
    const minimum = new Vector3();
    const maximum = new Vector3();
    for (let axis = 0; axis < 3; axis++) {
      const direction = [0, 0, 0];
      direction[axis] = 1;
      maximum[axis] = this.getSupportPoint(direction)[axis];
      direction[axis] = -1;
      minimum[axis] = this.getSupportPoint(direction)[axis];
    }
    return new AxisAlignedBoundingBox(minimum, maximum);
  }

  getBoundingSphere(): BoundingSphere | undefined {
    const box = this.getAxisAlignedBoundingBox();
    if (!box) return undefined;
    return new BoundingSphere().fromCornerPoints(box.minimum, box.maximum);
  }

  protected getSupportPoint(worldDirection: readonly number[]): Vector3 {
    const matrix = this.matrix;
    const localDirection = [
      matrix[0] * worldDirection[0] + matrix[1] * worldDirection[1] + matrix[2] * worldDirection[2],
      matrix[4] * worldDirection[0] + matrix[5] * worldDirection[1] + matrix[6] * worldDirection[2],
      matrix[8] * worldDirection[0] + matrix[9] * worldDirection[1] + matrix[10] * worldDirection[2]
    ];
    return new Vector3(this.supportLocal(localDirection)).transform(this.matrix);
  }
}

export function validateAffineMatrix(matrix: readonly number[]): void {
  if (matrix.length !== 16 || matrix.some(value => !Number.isFinite(value))) {
    throw new Error('Shape matrix must contain 16 finite values');
  }
  if (
    Math.abs(matrix[3]) > 1e-12 ||
    Math.abs(matrix[7]) > 1e-12 ||
    Math.abs(matrix[11]) > 1e-12 ||
    Math.abs(matrix[15] - 1) > 1e-12
  ) {
    throw new Error('Shape matrix must be affine');
  }
  if (Math.abs(new Matrix4().copy(matrix).determinant()) < 1e-15)
    throw new Error('Shape matrix must be invertible');
}

export function solveQuadratic(a: number, b: number, c: number): number[] {
  if (Math.abs(a) < 1e-15) return Math.abs(b) < 1e-15 ? [] : [-c / b];
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return [];
  const root = Math.sqrt(Math.max(0, discriminant));
  return [(-b - root) / (2 * a), (-b + root) / (2 * a)].sort((left, right) => left - right);
}

export function closestDistanceToSegment2D(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const denominator = dx * dx + dy * dy;
  const t = denominator
    ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / denominator))
    : 0;
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** Distance in the radial/Y half-plane to a spherical profile arc selected by normal Y range. */
export function closestDistanceToCircleArc2D(
  px: number,
  py: number,
  centerY: number,
  radius: number,
  minimumNormalY: number,
  maximumNormalY: number
): number {
  if (radius === 0) return Math.hypot(px, py - centerY);
  const dx = px;
  const dy = py - centerY;
  const length = Math.hypot(dx, dy);
  const normalY = length ? dy / length : 0;
  if (normalY >= minimumNormalY && normalY <= maximumNormalY) {
    return Math.abs(length - radius);
  }
  const minimumRadius = radius * Math.sqrt(Math.max(0, 1 - minimumNormalY ** 2));
  const maximumRadius = radius * Math.sqrt(Math.max(0, 1 - maximumNormalY ** 2));
  return Math.min(
    Math.hypot(px - minimumRadius, py - (centerY + radius * minimumNormalY)),
    Math.hypot(px - maximumRadius, py - (centerY + radius * maximumNormalY))
  );
}
