// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import polygonClipping from 'polygon-clipping';
import {
  DiscontinuousMap,
  type GeographicPosition,
  type MapLine,
  type MapRegion,
  type MapSamplingOptions
} from './map-layout';
import {geographic, RAD, type Vector} from './math';

/** Spherical Mercator, clipped to a finite latitude band after seam splitting. */
export class MercatorMap extends DiscontinuousMap {
  readonly limit: number;
  private readonly ymax: number;
  constructor(
    readonly radius = 1,
    readonly centralMeridian = 0,
    maxLatitude = 85.0511287798066
  ) {
    if (
      !Number.isFinite(radius) ||
      radius <= 0 ||
      !Number.isFinite(centralMeridian) ||
      !Number.isFinite(maxLatitude) ||
      maxLatitude <= 0 ||
      maxLatitude >= 90
    )
      throw new Error('Invalid Mercator radius, central meridian or latitude limit');
    const regions: MapRegion[] = [];
    for (const sign of [1, -1])
      for (let i = 0; i < 4; i++) {
        const west = -180 + i * 90,
          east = west + 90,
          center = west + 45;
        regions.push({
          id: `${sign > 0 ? 'north' : 'south'}-${i}`,
          layout: {kind: 'main'},
          boundary: [
            [west + centralMeridian, sign * 90],
            [west + centralMeridian, 0],
            [east + centralMeridian, 0]
          ],
          interior: [center + centralMeridian, sign * 45],
          project: ([lon, lat]) => {
            const delta = ((((lon - centralMeridian - center + 180) % 360) + 360) % 360) - 180;
            // Keep longitude unchanged in the finite polar extension. Tapering
            // X toward zero moves latitude-band intersections into other charts.
            // Directional pole limits are supplied below; the extension is clipped.
            const outside = Math.max(0, Math.abs(lat) - maxLatitude);

            const phi = Math.min(Math.abs(lat), maxLatitude) * RAD;
            return [
              radius * (center + delta) * RAD,
              radius * Math.sign(lat) * (Math.asinh(Math.tan(phi)) + outside * RAD)
            ];
          },
          unproject: ([x, y]) => [
            x / radius / RAD + centralMeridian,
            Math.atan(Math.sinh(y / radius)) / RAD
          ]
        });
      }
    super(regions);
    this.limit = maxLatitude;
    this.ymax = radius * Math.asinh(Math.tan(maxLatitude * RAD));
  }
  protected override resolveSourceLimit(point: Vector, towards: Vector): Vector {
    if (Math.hypot(point[0], point[1]) < 1e-14 && Math.hypot(towards[0], towards[1]) > 1e-14)
      return geographic([Math.atan2(towards[1], towards[0]) / RAD, point[2] > 0 ? 90 : -90]);
    return point;
  }
  override containsConvexPolygon(): boolean {
    return false;
  }
  override findRegions(p: GeographicPosition) {
    geographic(p);
    return Math.abs(p[1]) <= this.limit + 1e-10 ? super.findRegions(p) : [];
  }
  override projectPoint(p: GeographicPosition, id?: string) {
    geographic(p);
    return Math.abs(p[1]) <= this.limit + 1e-10 ? super.projectPoint(p, id) : null;
  }
  override unprojectPoint(p: GeographicPosition, id?: string) {
    return super
      .unprojectPoint(p, id)
      .filter(hit => Math.abs(hit.position[1]) <= this.limit + 1e-10);
  }
  private source([x, y]: GeographicPosition): [number, number] {
    return [
      x / this.radius / RAD + this.centralMeridian,
      Math.atan(Math.sinh(y / this.radius)) / RAD
    ];
  }
  override projectLine(
    line: readonly GeographicPosition[],
    options?: MapSamplingOptions
  ): MapLine[] {
    const result: MapLine[] = [];
    for (const part of super.projectLine(line, options)) {
      let current: MapLine | undefined;
      for (let i = 1; i < part.coordinates.length; i++) {
        const a = part.coordinates[i - 1],
          b = part.coordinates[i];
        const dy = b[1] - a[1];
        const t0 = dy
          ? Math.max(0, Math.min((-this.ymax - a[1]) / dy, (this.ymax - a[1]) / dy))
          : 0;
        const t1 = dy
          ? Math.min(1, Math.max((-this.ymax - a[1]) / dy, (this.ymax - a[1]) / dy))
          : 1;
        if (t0 > t1 || (!dy && Math.abs(a[1]) > this.ymax)) {
          current = undefined;
          continue;
        }
        const at = (t: number): [number, number] => [a[0] + (b[0] - a[0]) * t, a[1] + dy * t];
        const start = at(t0),
          end = at(t1);
        if (!current || t0 > 0) {
          current = {
            regionId: part.regionId,
            coordinates: [start],
            sourceCoordinates: [this.source(start)]
          };
          result.push(current);
        }
        current.coordinates.push(end);
        current.sourceCoordinates.push(this.source(end));
        if (t1 < 1) current = undefined;
      }
    }
    return result;
  }
  override projectPolygon(
    rings: readonly (readonly GeographicPosition[])[],
    options?: MapSamplingOptions
  ) {
    const x = Math.PI * this.radius,
      y = this.ymax;
    const box: [number, number][][] = [
      [
        [-x, -y],
        [x, -y],
        [x, y],
        [-x, y],
        [-x, -y]
      ]
    ];
    return super.projectPolygon(rings, options).flatMap(part =>
      polygonClipping.intersection(part.coordinates, box).map(coordinates => ({
        regionId: part.regionId,
        coordinates,
        sourceCoordinates: coordinates.map(ring => ring.map(p => this.source(p)))
      }))
    );
  }
}
