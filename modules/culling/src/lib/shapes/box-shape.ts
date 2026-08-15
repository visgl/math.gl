// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ImplicitShapeBase, type ImplicitShape, type LocalRayIntersection} from './implicit-shape';

const EPSILON = 1e-6;

export type BoxShapeProps = {size?: readonly [number, number, number]; matrix?: readonly number[]};

/** Analytic glTF box shape. */
export class BoxShape extends ImplicitShapeBase {
  readonly type = 'box' as const;
  readonly size: readonly [number, number, number];
  private readonly halfSize: readonly [number, number, number];

  constructor(props: BoxShapeProps = {}) {
    super(props.matrix);
    this.size = props.size ? [...props.size] : [1, 1, 1];
    if (this.size.some(value => !Number.isFinite(value) || value <= 0))
      throw new Error('Box size values must be greater than zero');
    this.halfSize = [this.size[0] / 2, this.size[1] / 2, this.size[2] / 2];
  }

  clone(): BoxShape {
    return new BoxShape({size: this.size, matrix: this.matrix});
  }
  override equals(shape: ImplicitShape): boolean {
    return (
      shape instanceof BoxShape &&
      super.equals(shape) &&
      this.size.every((value, i) => value === shape.size[i])
    );
  }
  containsLocalPoint(point: readonly number[]): boolean {
    return point.every((value, i) => Math.abs(value) <= this.halfSize[i] + EPSILON);
  }
  distanceToLocalPoint(point: readonly number[]): number {
    return Math.hypot(...point.map((value, i) => Math.max(0, Math.abs(value) - this.halfSize[i])));
  }
  supportLocal(direction: readonly number[]): readonly number[] {
    return direction.map((value, i) => (value < 0 ? -this.halfSize[i] : this.halfSize[i]));
  }
  intersectLocalRay(
    origin: readonly number[],
    direction: readonly number[]
  ): LocalRayIntersection | undefined {
    let near = -Infinity;
    let far = Infinity;
    let nearAxis = 0;
    let farAxis = 0;
    for (let axis = 0; axis < 3; axis++) {
      if (Math.abs(direction[axis]) < 1e-15) {
        if (Math.abs(origin[axis]) > this.halfSize[axis]) return undefined;
        continue;
      }
      let t1 = (-this.halfSize[axis] - origin[axis]) / direction[axis];
      let t2 = (this.halfSize[axis] - origin[axis]) / direction[axis];
      if (t1 > t2) [t1, t2] = [t2, t1];
      if (t1 > near) {
        near = t1;
        nearAxis = axis;
      }
      if (t2 < far) {
        far = t2;
        farAxis = axis;
      }
      if (near > far) return undefined;
    }
    const distance = near >= 0 ? near : far;
    if (distance < 0 || !Number.isFinite(distance)) return undefined;
    const axis = near >= 0 ? nearAxis : farAxis;
    const pointCoordinate = origin[axis] + distance * direction[axis];
    const normal = [0, 0, 0];
    normal[axis] = pointCoordinate < 0 ? -1 : 1;
    return {distance, normal};
  }
}
