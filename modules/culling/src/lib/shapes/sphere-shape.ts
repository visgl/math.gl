// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {
  ImplicitShapeBase,
  solveQuadratic,
  type ImplicitShape,
  type LocalRayIntersection
} from './implicit-shape';

const EPSILON = 1e-6;

export type SphereShapeProps = {radius?: number; matrix?: readonly number[]};

/** Analytic glTF sphere shape. */
export class SphereShape extends ImplicitShapeBase {
  readonly type = 'sphere' as const;
  readonly radius: number;
  constructor(props: SphereShapeProps = {}) {
    super(props.matrix);
    this.radius = props.radius ?? 0.5;
    if (!Number.isFinite(this.radius) || this.radius <= 0)
      throw new Error('Sphere radius must be greater than zero');
  }
  clone(): SphereShape {
    return new SphereShape({radius: this.radius, matrix: this.matrix});
  }
  override equals(shape: ImplicitShape): boolean {
    return shape instanceof SphereShape && super.equals(shape) && this.radius === shape.radius;
  }
  containsLocalPoint(point: readonly number[]): boolean {
    return Math.hypot(...point) <= this.radius + EPSILON;
  }
  distanceToLocalPoint(point: readonly number[]): number {
    return Math.max(0, Math.hypot(...point) - this.radius);
  }
  supportLocal(direction: readonly number[]): readonly number[] {
    const length = Math.hypot(...direction);
    return length ? direction.map(value => (value / length) * this.radius) : [this.radius, 0, 0];
  }
  intersectLocalRay(
    origin: readonly number[],
    direction: readonly number[]
  ): LocalRayIntersection | undefined {
    const roots = solveQuadratic(
      dot(direction, direction),
      2 * dot(origin, direction),
      dot(origin, origin) - this.radius * this.radius
    );
    const distance = roots.find(value => value >= 0);
    if (distance === undefined) return undefined;
    const point = origin.map((value, i) => value + distance * direction[i]);
    return {distance, normal: point.map(value => value / this.radius)};
  }
}

function dot(a: readonly number[], b: readonly number[]): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
