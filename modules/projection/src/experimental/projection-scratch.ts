// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original per-instance scratch pool; recursive hooks receive reusable independent leases.
import type {ProjectionPoint} from './types';

function createPoint(): ProjectionPoint {
  return {x: 0, y: 0, z: 0};
}
/** Allocate once per observed call depth, rather than once per recursive call. */
export class ProjectionScratch {
  readonly point: ProjectionPoint = createPoint();
  private readonly points: ProjectionPoint[] = [this.point];
  private active = 0;
  get depth(): number {
    return this.active;
  }
  acquire(): ProjectionPoint {
    const index = this.active++;
    this.points[index] ||= createPoint();
    return this.points[index];
  }
  release(point: ProjectionPoint): void {
    if (this.active > 0 && this.points[this.active - 1] === point) this.active--;
  }
}
