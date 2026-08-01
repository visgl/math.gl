// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  closestDistanceToSegment2D,
  ImplicitShapeBase,
  solveQuadratic,
  type ImplicitShape,
  type LocalRayIntersection
} from './implicit-shape';

const EPSILON = 1e-6;

export type CylinderShapeProps = {
  height?: number;
  radiusBottom?: number;
  radiusTop?: number;
  matrix?: readonly number[];
};

/** Analytic closed, Y-aligned glTF cylinder shape, including tapered cylinders. */
export class CylinderShape extends ImplicitShapeBase {
  readonly type = 'cylinder' as const;
  readonly height: number;
  readonly radiusBottom: number;
  readonly radiusTop: number;

  constructor(props: CylinderShapeProps = {}) {
    super(props.matrix);
    this.height = props.height ?? 2;
    this.radiusBottom = props.radiusBottom ?? 0.5;
    this.radiusTop = props.radiusTop ?? 0.5;
    if (!Number.isFinite(this.height) || this.height <= 0)
      throw new Error('Cylinder height must be greater than zero');
    if (![this.radiusBottom, this.radiusTop].every(value => Number.isFinite(value) && value >= 0))
      throw new Error('Cylinder radii must be non-negative');
    if (this.radiusBottom === 0 && this.radiusTop === 0)
      throw new Error('At least one cylinder radius must be greater than zero');
  }

  clone(): CylinderShape {
    return new CylinderShape({
      height: this.height,
      radiusBottom: this.radiusBottom,
      radiusTop: this.radiusTop,
      matrix: this.matrix
    });
  }
  override equals(shape: ImplicitShape): boolean {
    return (
      shape instanceof CylinderShape &&
      super.equals(shape) &&
      this.height === shape.height &&
      this.radiusBottom === shape.radiusBottom &&
      this.radiusTop === shape.radiusTop
    );
  }
  containsLocalPoint(point: readonly number[]): boolean {
    const half = this.height / 2;
    if (point[1] < -half - EPSILON || point[1] > half + EPSILON) return false;
    const t = (point[1] + half) / this.height;
    const radius = this.radiusBottom + (this.radiusTop - this.radiusBottom) * t;
    return Math.hypot(point[0], point[2]) <= radius + EPSILON;
  }
  distanceToLocalPoint(point: readonly number[]): number {
    if (this.containsLocalPoint(point)) return 0;
    const radial = Math.hypot(point[0], point[2]);
    const half = this.height / 2;
    const side = closestDistanceToSegment2D(
      radial,
      point[1],
      this.radiusBottom,
      -half,
      this.radiusTop,
      half
    );
    const bottom = closestDistanceToSegment2D(radial, point[1], 0, -half, this.radiusBottom, -half);
    const top = closestDistanceToSegment2D(radial, point[1], 0, half, this.radiusTop, half);
    return Math.min(side, bottom, top);
  }
  supportLocal(direction: readonly number[]): readonly number[] {
    const radialLength = Math.hypot(direction[0], direction[2]);
    const x = radialLength ? direction[0] / radialLength : 1;
    const z = radialLength ? direction[2] / radialLength : 0;
    const half = this.height / 2;
    const bottomValue = radialLength * this.radiusBottom - direction[1] * half;
    const topValue = radialLength * this.radiusTop + direction[1] * half;
    return topValue >= bottomValue
      ? [x * this.radiusTop, half, z * this.radiusTop]
      : [x * this.radiusBottom, -half, z * this.radiusBottom];
  }
  intersectLocalRay(
    origin: readonly number[],
    direction: readonly number[]
  ): LocalRayIntersection | undefined {
    const half = this.height / 2;
    const slope = (this.radiusTop - this.radiusBottom) / this.height;
    const intercept = (this.radiusTop + this.radiusBottom) / 2;
    const radialAtOrigin = intercept + slope * origin[1];
    const radialAlongRay = slope * direction[1];
    const candidates: LocalRayIntersection[] = [];
    const roots = solveQuadratic(
      direction[0] ** 2 + direction[2] ** 2 - radialAlongRay ** 2,
      2 * (origin[0] * direction[0] + origin[2] * direction[2] - radialAtOrigin * radialAlongRay),
      origin[0] ** 2 + origin[2] ** 2 - radialAtOrigin ** 2
    );
    for (const distance of roots) {
      const y = origin[1] + distance * direction[1];
      if (distance >= 0 && y >= -half - EPSILON && y <= half + EPSILON) {
        const x = origin[0] + distance * direction[0];
        const z = origin[2] + distance * direction[2];
        const radial = Math.hypot(x, z) || 1;
        const normal = [x / radial, -slope, z / radial];
        const length = Math.hypot(...normal);
        candidates.push({distance, normal: normal.map(value => value / length)});
      }
    }
    if (Math.abs(direction[1]) > 1e-15) {
      for (const [y, radius, normalY] of [
        [-half, this.radiusBottom, -1],
        [half, this.radiusTop, 1]
      ]) {
        const distance = (y - origin[1]) / direction[1];
        const x = origin[0] + distance * direction[0];
        const z = origin[2] + distance * direction[2];
        if (distance >= 0 && Math.hypot(x, z) <= radius + EPSILON)
          candidates.push({distance, normal: [0, normalY, 0]});
      }
    }
    return candidates.sort((a, b) => a.distance - b.distance)[0];
  }
}
