// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original per-instance scalar scratch lease; recursive hooks receive independent storage.
import type {ProjectionPoint} from './types';

/** Reuse one point for ordinary calls without exposing shared scratch to recursive hooks. */
export class ProjectionScratch {
  readonly point: ProjectionPoint = {x: 0, y: 0, z: 0};
  private busy = false;
  acquire(): ProjectionPoint {
    if (this.busy) return {x: 0, y: 0, z: 0};
    this.busy = true;
    return this.point;
  }
  release(point: ProjectionPoint): void {
    if (point === this.point) this.busy = false;
  }
}
