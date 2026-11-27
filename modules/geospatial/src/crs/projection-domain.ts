// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

/** Target-plane coordinate in the descriptor's effective horizontal axis order and units. */
export type CRSProjectionDomainPoint = readonly [number, number];
/** Closed ring with at least three distinct vertices; the last point repeats the first. */
export type CRSProjectionDomainRing = readonly CRSProjectionDomainPoint[];
/** One connected domain component. Holes exclude their interiors; winding is immaterial. */
export type CRSProjectionDomainPolygon = Readonly<{
  outer: CRSProjectionDomainRing;
  holes?: readonly CRSProjectionDomainRing[];
}>;
/** A periodic target axis, with a canonical interval [minimum, minimum + period].
 * Both seam edges may carry distinct vertices/attributes. This does not unwrap source geometry.
 */
export type CRSProjectionPeriod = Readonly<{
  axis: 0 | 1;
  minimum: number;
  period: number;
}>;
/** Explicit sampled target-plane validity geometry supplied by a projection backend.
 * Empty polygons mean an empty domain; an absent domain means unknown, not unrestricted.
 * Components must have disjoint interiors, simple outer rings and strictly contained,
 * nonintersecting holes. This is separate from geographic areaOfUse and renderingBounds.
 */
export type CRSProjectionDomain = Readonly<{
  polygons: readonly CRSProjectionDomainPolygon[];
  periodic?: CRSProjectionPeriod;
}>;

/** Snapshot domain geometry for a prepared projection. Validates finite closed nondegenerate
 * rings and period arithmetic, not polygon topology or agreement with a projection algorithm.
 * No engine is loaded, boundary inferred, or clipping performed. Curved boundaries remain
 * approximations at the caller's sampling tolerance. Rebuild when projection parameters change.
 */
export function createCRSProjectionDomain(domain: CRSProjectionDomain): CRSProjectionDomain {
  if (!domain || !Array.isArray(domain.polygons)) throw new RangeError('Invalid projection domain');
  const polygons = Object.freeze(
    Array.from(domain.polygons, polygon => {
      if (!polygon || (polygon.holes !== undefined && !Array.isArray(polygon.holes))) {
        throw new RangeError('Invalid domain polygon');
      }
      return Object.freeze({
        outer: copyRing(polygon.outer),
        ...(polygon.holes === undefined
          ? {}
          : {holes: Object.freeze(Array.from(polygon.holes, copyRing))})
      });
    })
  );
  const period = domain.periodic;
  if (
    period !== undefined &&
    (!period ||
      (period.axis !== 0 && period.axis !== 1) ||
      !Number.isFinite(period.minimum) ||
      !Number.isFinite(period.period) ||
      period.period <= 0 ||
      !Number.isFinite(period.minimum + period.period) ||
      period.minimum + period.period <= period.minimum)
  ) {
    throw new RangeError('Invalid projection period');
  }
  return Object.freeze({
    polygons,
    ...(period === undefined
      ? {}
      : {
          periodic: Object.freeze({
            axis: period.axis,
            minimum: period.minimum,
            period: period.period
          })
        })
  });
}

function copyRing(ring: CRSProjectionDomainRing): CRSProjectionDomainRing {
  if (!Array.isArray(ring) || ring.length < 4) throw new RangeError('Invalid domain ring');
  const points = Array.from(ring, point => {
    if (!Array.isArray(point) || point.length !== 2 || !Array.from(point).every(Number.isFinite)) {
      throw new RangeError('Invalid domain point');
    }
    return Object.freeze([point[0], point[1]]) as CRSProjectionDomainPoint;
  });
  const first = points[0],
    last = points[points.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1])
    throw new RangeError('Domain ring must be closed');
  // Translate before computing area, reducing cancellation for large target-coordinate origins.
  let area = 0;
  for (let i = 1; i + 1 < points.length; i++) {
    const a = points[i],
      b = points[i + 1];
    area += (a[0] - first[0]) * (b[1] - first[1]) - (a[1] - first[1]) * (b[0] - first[0]);
  }
  if (!Number.isFinite(area) || area === 0) throw new RangeError('Degenerate domain ring');
  return Object.freeze(points);
}
