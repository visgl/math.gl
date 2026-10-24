// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {DiscontinuousMap, type GeographicPosition, type MapSamplingOptions} from './map-layout';
import {geographic, coordinates, RAD, type Position, type Vector} from './math';
export function sphericalRotation([yaw, pitch, roll = 0]: readonly number[]) {
  const rotate = (v: Vector, axis: number, a: number): Vector => {
    const result = [...v] as Vector,
      i = (axis + 1) % 3,
      j = (axis + 2) % 3,
      c = Math.cos(a),
      s = Math.sin(a);
    result[i] = c * v[i] - s * v[j];
    result[j] = s * v[i] + c * v[j];
    return result;
  };
  return {
    local: (p: GeographicPosition): Position =>
      coordinates(
        rotate(rotate(rotate(geographic(p), 2, yaw * RAD), 1, -pitch * RAD), 0, roll * RAD)
      ),
    source: (p: GeographicPosition): Position =>
      coordinates(
        rotate(rotate(rotate(geographic(p), 0, -roll * RAD), 1, pitch * RAD), 2, -yaw * RAD)
      )
  };
}
/** Rotate a preset's geographic chart system without changing its planar net. */
export class RotatedMap extends DiscontinuousMap {
  private readonly rotation: ReturnType<typeof sphericalRotation>;
  constructor(
    private readonly base: DiscontinuousMap,
    angles: readonly number[]
  ) {
    const rotation = sphericalRotation(angles);
    super(
      base.regions.map(r => ({
        ...r,
        boundary: r.boundary.map(rotation.source),
        interior: rotation.source(r.interior),
        project: p => r.project(rotation.local(p)),
        unproject: p => {
          const q = r.unproject(p);
          return q ? rotation.source(q) : null;
        }
      }))
    );
    this.rotation = rotation;
  }
  override containsConvexPolygon(ring: readonly GeographicPosition[], id: string) {
    return this.base.containsConvexPolygon(ring.map(this.rotation.local), id);
  }
  override findRegions(p: GeographicPosition) {
    return this.base.findRegions(this.rotation.local(p));
  }
  override projectPoint(p: GeographicPosition, id?: string) {
    return this.base.projectPoint(this.rotation.local(p), id);
  }
  override unprojectPoint(p: GeographicPosition, id?: string) {
    return this.base
      .unprojectPoint(p, id)
      .map(q => ({...q, position: this.rotation.source(q.position)}));
  }
  override projectLine(line: readonly GeographicPosition[], options?: MapSamplingOptions) {
    return this.base
      .projectLine(line.map(this.rotation.local), options)
      .map(p => ({...p, sourceCoordinates: p.sourceCoordinates.map(this.rotation.source)}));
  }
  override projectPolygon(
    rings: readonly (readonly GeographicPosition[])[],
    options?: MapSamplingOptions
  ) {
    return this.base
      .projectPolygon(
        rings.map(r => r.map(this.rotation.local)),
        options
      )
      .map(p => ({
        ...p,
        sourceCoordinates: p.sourceCoordinates.map(r => r.map(this.rotation.source))
      }));
  }
  override getRegionOutlines(id: string, options?: MapSamplingOptions) {
    return this.base.getRegionOutlines(id, options);
  }
}
