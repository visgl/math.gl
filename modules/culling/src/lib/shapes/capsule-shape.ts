// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  closestDistanceToCircleArc2D,
  closestDistanceToSegment2D,
  ImplicitShapeBase,
  solveQuadratic,
  type ImplicitShape,
  type LocalRayIntersection
} from './implicit-shape';

const EPSILON = 1e-6;

export type CapsuleShapeProps = {
  height?: number;
  radiusBottom?: number;
  radiusTop?: number;
  matrix?: readonly number[];
};

/** Analytic glTF capsule: the convex hull of two spheres on the Y axis. */
export class CapsuleShape extends ImplicitShapeBase {
  readonly type = 'capsule' as const;
  readonly height: number;
  readonly radiusBottom: number;
  readonly radiusTop: number;

  constructor(props: CapsuleShapeProps = {}) {
    super(props.matrix);
    this.height = props.height ?? 1;
    this.radiusBottom = props.radiusBottom ?? 0.5;
    this.radiusTop = props.radiusTop ?? 0.5;
    if (!Number.isFinite(this.height) || this.height <= 0)
      throw new Error('Capsule height must be greater than zero');
    if (![this.radiusBottom, this.radiusTop].every(value => Number.isFinite(value) && value >= 0))
      throw new Error('Capsule radii must be non-negative');
    if (this.radiusBottom === 0 && this.radiusTop === 0)
      throw new Error('At least one capsule radius must be greater than zero');
  }

  clone(): CapsuleShape {
    return new CapsuleShape({
      height: this.height,
      radiusBottom: this.radiusBottom,
      radiusTop: this.radiusTop,
      matrix: this.matrix
    });
  }
  override equals(shape: ImplicitShape): boolean {
    return (
      shape instanceof CapsuleShape &&
      super.equals(shape) &&
      this.height === shape.height &&
      this.radiusBottom === shape.radiusBottom &&
      this.radiusTop === shape.radiusTop
    );
  }
  containsLocalPoint(point: readonly number[]): boolean {
    const profile = this.getProfile();
    const radial = Math.hypot(point[0], point[2]);
    if (profile.sphere)
      return (
        Math.hypot(radial, point[1] - profile.sphere.center) <= profile.sphere.radius + EPSILON
      );
    if (point[1] < profile.bottom.y)
      return Math.hypot(radial, point[1] + this.height / 2) <= this.radiusBottom + EPSILON;
    if (point[1] > profile.top.y)
      return Math.hypot(radial, point[1] - this.height / 2) <= this.radiusTop + EPSILON;
    const t = (point[1] - profile.bottom.y) / (profile.top.y - profile.bottom.y);
    return (
      radial <= profile.bottom.radius + (profile.top.radius - profile.bottom.radius) * t + EPSILON
    );
  }
  distanceToLocalPoint(point: readonly number[]): number {
    if (this.containsLocalPoint(point)) return 0;
    const profile = this.getProfile();
    const radial = Math.hypot(point[0], point[2]);
    if (profile.sphere)
      return Math.max(
        0,
        Math.hypot(radial, point[1] - profile.sphere.center) - profile.sphere.radius
      );
    const delta = this.radiusTop - this.radiusBottom;
    const sideNormalY = -delta / this.height;
    const bottomArc = closestDistanceToCircleArc2D(
      radial,
      point[1],
      -this.height / 2,
      this.radiusBottom,
      -1,
      sideNormalY
    );
    const topArc = closestDistanceToCircleArc2D(
      radial,
      point[1],
      this.height / 2,
      this.radiusTop,
      sideNormalY,
      1
    );
    const side = closestDistanceToSegment2D(
      radial,
      point[1],
      profile.bottom.radius,
      profile.bottom.y,
      profile.top.radius,
      profile.top.y
    );
    return Math.min(bottomArc, topArc, side);
  }
  supportLocal(direction: readonly number[]): readonly number[] {
    const length = Math.hypot(...direction);
    const unit = length ? direction.map(value => value / length) : [1, 0, 0];
    const bottom = [
      unit[0] * this.radiusBottom,
      -this.height / 2 + unit[1] * this.radiusBottom,
      unit[2] * this.radiusBottom
    ];
    const top = [
      unit[0] * this.radiusTop,
      this.height / 2 + unit[1] * this.radiusTop,
      unit[2] * this.radiusTop
    ];
    return dot(top, direction) >= dot(bottom, direction) ? top : bottom;
  }
  intersectLocalRay(
    origin: readonly number[],
    direction: readonly number[]
  ): LocalRayIntersection | undefined {
    const profile = this.getProfile();
    if (profile.sphere)
      return intersectSphere(origin, direction, profile.sphere.center, profile.sphere.radius);
    const candidates: LocalRayIntersection[] = [];
    const slope = (profile.top.radius - profile.bottom.radius) / (profile.top.y - profile.bottom.y);
    const intercept = profile.bottom.radius - slope * profile.bottom.y;
    const radialAtOrigin = intercept + slope * origin[1];
    const radialAlongRay = slope * direction[1];
    for (const distance of solveQuadratic(
      direction[0] ** 2 + direction[2] ** 2 - radialAlongRay ** 2,
      2 * (origin[0] * direction[0] + origin[2] * direction[2] - radialAtOrigin * radialAlongRay),
      origin[0] ** 2 + origin[2] ** 2 - radialAtOrigin ** 2
    )) {
      const y = origin[1] + distance * direction[1];
      if (distance >= 0 && y >= profile.bottom.y - EPSILON && y <= profile.top.y + EPSILON) {
        const x = origin[0] + distance * direction[0];
        const z = origin[2] + distance * direction[2];
        const radial = Math.hypot(x, z) || 1;
        const normal = [x / radial, -slope, z / radial];
        const length = Math.hypot(...normal);
        candidates.push({distance, normal: normal.map(value => value / length)});
      }
    }
    for (const bottomHit of intersectSphereRoots(
      origin,
      direction,
      -this.height / 2,
      this.radiusBottom
    )) {
      const y = origin[1] + bottomHit.distance * direction[1];
      if (y <= profile.bottom.y + EPSILON) candidates.push(bottomHit);
    }
    for (const topHit of intersectSphereRoots(origin, direction, this.height / 2, this.radiusTop)) {
      const y = origin[1] + topHit.distance * direction[1];
      if (y >= profile.top.y - EPSILON) candidates.push(topHit);
    }
    return candidates.sort((a, b) => a.distance - b.distance)[0];
  }

  private getProfile(): {
    sphere?: {center: number; radius: number};
    bottom: {radius: number; y: number};
    top: {radius: number; y: number};
  } {
    const delta = this.radiusTop - this.radiusBottom;
    if (Math.abs(delta) >= this.height) {
      const topWins = this.radiusTop >= this.radiusBottom;
      return {
        sphere: {
          center: topWins ? this.height / 2 : -this.height / 2,
          radius: topWins ? this.radiusTop : this.radiusBottom
        },
        bottom: {radius: 0, y: 0},
        top: {radius: 0, y: 0}
      };
    }
    const sinSlope = delta / this.height;
    const radialNormal = Math.sqrt(1 - sinSlope * sinSlope);
    const normalY = -sinSlope;
    return {
      bottom: {
        radius: this.radiusBottom * radialNormal,
        y: -this.height / 2 + this.radiusBottom * normalY
      },
      top: {radius: this.radiusTop * radialNormal, y: this.height / 2 + this.radiusTop * normalY}
    };
  }
}

function intersectSphere(
  origin: readonly number[],
  direction: readonly number[],
  centerY: number,
  radius: number
): LocalRayIntersection | undefined {
  return intersectSphereRoots(origin, direction, centerY, radius)[0];
}

function intersectSphereRoots(
  origin: readonly number[],
  direction: readonly number[],
  centerY: number,
  radius: number
): LocalRayIntersection[] {
  if (radius === 0) return [];
  const relative = [origin[0], origin[1] - centerY, origin[2]];
  return solveQuadratic(
    dot(direction, direction),
    2 * dot(relative, direction),
    dot(relative, relative) - radius * radius
  )
    .filter(distance => distance >= 0)
    .map(distance => ({
      distance,
      normal: relative.map((value, i) => (value + distance * direction[i]) / radius)
    }));
}

function dot(a: readonly number[], b: readonly number[]): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
