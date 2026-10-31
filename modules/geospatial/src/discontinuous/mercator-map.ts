// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import polygonClipping from 'polygon-clipping';
import {tracePolygonConstraints, composePolygonEdge} from './polygon-constraints';
import {sourceArc} from './source-arc';
import {
  DiscontinuousMap,
  type GeographicPosition,
  type MapLine,
  type MapRegion,
  type MapSamplingOptions
} from './map-layout';
import {angle, coordinates, geographic, RAD, unit, type Vector} from './math';

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
        // Locate the latitude cut on the sampled source great-circle arc, not
        // on its projected chord. Retain the parent segment throughout this stage.
        const endpoint = (t: number) => {
          if (t === 0 || t === 1) return {xy: at(t), source: part.sourceCoordinates[i - 1 + t], t};
          const va = geographic(part.sourceCoordinates[i - 1]),
            vb = geographic(part.sourceCoordinates[i]),
            arc = angle(va, vb);
          const sourceAt = (t: number) => {
            if (!arc) return part.sourceCoordinates[i - 1];
            const a = Math.sin((1 - t) * arc) / Math.sin(arc),
              b = Math.sin(t * arc) / Math.sin(arc);
            return coordinates(unit(va.map((v, k) => a * v + b * vb[k]) as Vector));
          };
          const latitude = Math.sign(at(t)[1]) * this.limit;
          let lo = 0,
            hi = 1;
          for (let j = 0; j < 52; j++) {
            const mid = (lo + hi) / 2;
            if (sourceAt(mid)[1] < latitude === part.sourceCoordinates[i - 1][1] < latitude)
              lo = mid;
            else hi = mid;
          }
          const f = (lo + hi) / 2,
            source = sourceAt(f);
          const xy = super.projectPoint(source, part.regionId)!.position;
          return {xy, source, t: f};
        };
        const start = endpoint(t0),
          end = endpoint(t1);
        const append = (point: typeof start, index: number) => {
          current!.coordinates.push(point.xy);
          current!.sourceCoordinates.push(point.source);
          const source = part.provenance,
            target = current!.provenance;
          if (!source || !target) return;
          const segment = source.segments[i];
          const from = source.segments[i - 1] === segment ? source.parameters[i - 1] : 0;
          target.segments.push(point.t === 0 || point.t === 1 ? source.segments[index] : segment);
          target.parameters.push(
            point.t === 0 || point.t === 1
              ? source.parameters[index]
              : from + point.t * (source.parameters[i] - from)
          );
          target.vertices.push(
            point.t === 0 || point.t === 1 ? source.vertices[index] : 0xffffffff
          );
          if (options?.pathDistances)
            target.angularDistances.push(
              source.angularDistances[i - 1] +
                point.t * (source.angularDistances[i] - source.angularDistances[i - 1])
            );
        };
        if (!current || t0 > 0) {
          current = {
            regionId: part.regionId,
            coordinates: [],
            sourceCoordinates: [],
            ...(part.provenance
              ? {
                  provenance: {
                    segments: [],
                    parameters: [],
                    vertices: [],
                    angularDistances: [],
                    ...(options?.pathBoundaries
                      ? {startReason: t0 > 0 ? 'coverage-boundary' : part.provenance.startReason}
                      : {})
                  }
                }
              : {})
          };
          result.push(current);
          append(start, i - 1);
        }
        append(end, i);
        if (current.provenance && options?.pathBoundaries)
          current.provenance.endReason = t1 < 1 ? 'coverage-boundary' : part.provenance!.endReason;
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
      polygonClipping.intersection(part.coordinates, box).map(polygon => {
        const traced = tracePolygonConstraints(
          part.coordinates,
          polygon,
          1e-10,
          part.edgeProvenance
        );
        const sources = traced.rings.map(r => r.map(p => this.source(p)));
        traced.owners.forEach((owners, r) =>
          owners.forEach((owner, i) => {
            if (!owner) return;
            const [parentRing, parentEdge] = owner,
              a = part.sourceCoordinates[parentRing][parentEdge],
              b = part.sourceCoordinates[parentRing][parentEdge + 1],
              at = sourceArc(a, b);
            for (const j of [i, i + 1]) {
              const q = traced.rings[r][j],
                first = part.coordinates[parentRing][parentEdge],
                last = part.coordinates[parentRing][parentEdge + 1];
              if (Math.hypot(q[0] - first[0], q[1] - first[1]) < 1e-10 * this.radius)
                sources[r][j] = [...a];
              else if (Math.hypot(q[0] - last[0], q[1] - last[1]) < 1e-10 * this.radius)
                sources[r][j] = [...b];
              else {
                const latitude = Math.sign(q[1]) * this.limit;
                let lo = 0,
                  hi = 1;
                if (a[1] < latitude === b[1] < latitude)
                  throw new Error('Unresolved Mercator source constraint intersection');
                for (let k = 0; k < 52; k++) {
                  const mid = (lo + hi) / 2;
                  if (at(mid)[1] < latitude === a[1] < latitude) lo = mid;
                  else hi = mid;
                }
                sources[r][j] = at((lo + hi) / 2);
              }
            }
          })
        );
        for (const r of sources) r[r.length - 1] = [...r[0]];
        return {
          regionId: part.regionId,
          sourceCoordinates: sources,
          coordinates: sources.map(r => r.map(p => super.projectPoint(p, part.regionId)!.position)),
          ...(options?.polygonEdgeProvenance
            ? {
                edgeProvenance: traced.owners.map((owners, r) =>
                  owners.map((owner, i) => {
                    if (owner) {
                      const [pr, pe] = owner;
                      return composePolygonEdge(
                        part.edgeProvenance![pr][pe],
                        part.sourceCoordinates[pr][pe],
                        part.sourceCoordinates[pr][pe + 1],
                        sources[r][i],
                        sources[r][i + 1]
                      );
                    }
                    if (
                      !sources[r]
                        .slice(i, i + 2)
                        .every(p => Math.abs(Math.abs(p[1]) - this.limit) < 1e-7)
                    )
                      throw new Error('Unknown Mercator clipping constraint');
                    return {
                      kind: 'coverage-boundary' as const,
                      ring: 0xffffffff,
                      segment: 0xffffffff,
                      t0: 0,
                      t1: 0
                    };
                  })
                )
              }
            : {})
        };
      })
    );
  }
}
