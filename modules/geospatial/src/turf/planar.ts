// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {WellKnownGeometry} from '@math.gl/core/arrow';

/** A position in the input coordinate system. */
type Position = readonly number[];
/** The positions of an open or closed path. */
type Path = readonly Position[];
/** A polygon's exterior ring followed by interior rings. */
type Rings = readonly Path[];
/** A centroid numerator and its weight. */
type Moments = {
  /** Weighted X numerator. */
  x: number;
  /** Weighted Y numerator. */
  y: number;
  /** Total contribution, in points, length, or area. */
  weight: number;
};

/** Iterates path segments, including the closing segment for polygon rings. */
function visitSegments(
  path: Path,
  closed: boolean,
  visit: (a: Position, b: Position) => void
): void {
  for (let i = 1; i < path.length; i++) visit(path[i - 1]!, path[i]!);
  if (closed && path.length > 1) visit(path[path.length - 1]!, path[0]!);
}

/** Identifies a finite point, excluding WKB NaNs and native empty coordinates. */
function isPresentPoint(position: Position): boolean {
  return Number.isFinite(position[0]) && Number.isFinite(position[1]);
}

/** Iterates position sequences in a supported geometry, retaining path boundaries. */
function visitPaths(geometry: WellKnownGeometry, visit: (path: Path) => void): void {
  switch (geometry.type) {
    case 'Point':
      if (isPresentPoint(geometry.coordinates)) visit([geometry.coordinates]);
      break;
    case 'MultiPoint':
      visit(geometry.coordinates.filter(isPresentPoint));
      break;
    case 'LineString':
      visit(geometry.coordinates);
      break;
    case 'MultiLineString':
    case 'Polygon':
      geometry.coordinates.forEach(visit);
      break;
    case 'MultiPolygon':
      geometry.coordinates.forEach(polygon => polygon.forEach(visit));
      break;
    case 'GeometryCollection':
      geometry.geometries.forEach(child => visitPaths(child, visit));
      break;
  }
}

/** Computes signed ring area and centroid moments relative to a common origin. */
function ringMoments(ring: Path, origin: Position): Moments {
  let weight = 0;
  let x = 0;
  let y = 0;
  visitSegments(ring, true, (a, b) => {
    const ax = a[0]! - origin[0]!;
    const ay = a[1]! - origin[1]!;
    const bx = b[0]! - origin[0]!;
    const by = b[1]! - origin[1]!;
    const cross = ax * by - bx * ay;
    weight += cross;
    x += (ax + bx) * cross;
    y += (ay + by) * cross;
  });
  return {x: x / 6, y: y / 6, weight: weight / 2};
}

/** Removes holes regardless of the orientation of each ring. */
function polygonMoments(rings: Rings, origin: Position): Moments {
  const total = {x: 0, y: 0, weight: 0};
  rings.forEach((ring, index) => {
    const ringResult = ringMoments(ring, origin);
    const sign = Math.sign(ringResult.weight) * (index === 0 ? 1 : -1);
    total.weight += sign * ringResult.weight;
    total.x += sign * ringResult.x;
    total.y += sign * ringResult.y;
  });
  return total;
}

/** Computes planar polygonal area in squared coordinate units. */
export function planarArea(geometry: WellKnownGeometry): number {
  const polygons =
    geometry.type === 'Polygon'
      ? [geometry.coordinates]
      : geometry.type === 'MultiPolygon'
        ? geometry.coordinates
        : [];
  return polygons.reduce(
    (total, rings) => total + polygonMoments(rings, rings[0]?.[0] ?? [0, 0]).weight,
    0
  );
}

/** Computes planar line length in coordinate units. */
export function planarLength(geometry: WellKnownGeometry): number {
  if (geometry.type !== 'LineString' && geometry.type !== 'MultiLineString') return 0;
  let length = 0;
  visitPaths(geometry, path => {
    visitSegments(path, false, (a, b) => {
      length += Math.hypot(b[0]! - a[0]!, b[1]! - a[1]!);
    });
  });
  return length;
}

/** Returns the 2D center of mass of a point, line, polygon or corresponding multi-geometry. */
export function planarCentroid(geometry: WellKnownGeometry): WellKnownGeometry {
  const polygons =
    geometry.type === 'Polygon'
      ? [geometry.coordinates]
      : geometry.type === 'MultiPolygon'
        ? geometry.coordinates
        : [];
  const points = {x: 0, y: 0, weight: 0};
  const lines = {x: 0, y: 0, weight: 0};
  const areas = {x: 0, y: 0, weight: 0};
  let origin: Position | undefined;
  visitPaths(geometry, path => {
    if (!path.length) return;
    origin ??= path[0]!;
    const ox = origin[0]!;
    const oy = origin[1]!;
    if (geometry.type !== 'MultiPoint') {
      visitSegments(path, polygons.length > 0, (a, b) => {
        const weight = Math.hypot(b[0]! - a[0]!, b[1]! - a[1]!);
        lines.x += ((a[0]! - ox + (b[0]! - ox)) / 2) * weight;
        lines.y += ((a[1]! - oy + (b[1]! - oy)) / 2) * weight;
        lines.weight += weight;
      });
    }
    for (const point of path) {
      points.x += point[0]! - ox;
      points.y += point[1]! - oy;
      points.weight++;
    }
  });
  if (!origin) return {type: 'Point', coordinates: []};
  for (const polygon of polygons) {
    const part = polygonMoments(polygon, origin);
    areas.x += part.x;
    areas.y += part.y;
    areas.weight += part.weight;
  }
  const {x, y, weight} = areas.weight ? areas : lines.weight ? lines : points;
  return {
    type: 'Point',
    coordinates: [origin[0]! + x / weight, origin[1]! + y / weight]
  };
}

/** Returns [minX, minY, maxX, maxY], or null for an empty geometry. */
export function planarBounds(geometry: WellKnownGeometry): number[] | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  visitPaths(geometry, path => {
    for (const [x, y] of path) {
      minX = Math.min(minX, x!);
      minY = Math.min(minY, y!);
      maxX = Math.max(maxX, x!);
      maxY = Math.max(maxY, y!);
    }
  });
  return minX <= maxX ? [minX, minY, maxX, maxY] : null;
}

/** Returns the envelope, retaining the input geometry type when empty. */
export function planarEnvelope(geometry: WellKnownGeometry): WellKnownGeometry {
  const bounds = planarBounds(geometry);
  if (!bounds) return geometry;
  const [x0, y0, x1, y1] = bounds as [number, number, number, number];
  if (x0 === x1 && y0 === y1) return {type: 'Point', coordinates: [x0, y0]};
  if (x0 === x1 || y0 === y1) {
    return {
      type: 'LineString',
      coordinates: [
        [x0, y0],
        [x1, y1]
      ]
    };
  }
  return {
    type: 'Polygon',
    coordinates: [
      [
        [x0, y0],
        [x0, y1],
        [x1, y1],
        [x1, y0],
        [x0, y0]
      ]
    ]
  };
}

/** Finds a polygon label point on the widest interior span of a horizontal scan line. */
export function planarPolygonPointOnSurface(geometry: WellKnownGeometry): WellKnownGeometry {
  const polygons =
    geometry.type === 'MultiPolygon'
      ? geometry.coordinates
      : geometry.type === 'Polygon'
        ? [geometry.coordinates]
        : [];
  let coordinates: number[] = [];
  let widest = -1;
  for (const rings of polygons) {
    const shell = rings[0];
    if (!shell?.length) continue;
    let low = Infinity;
    let high = -Infinity;
    for (const point of shell) {
      low = Math.min(low, point[1]!);
      high = Math.max(high, point[1]!);
    }
    const center = low / 2 + high / 2;
    // Choose a scan line between vertex elevations so holes and concavities
    // contribute pairs of crossings even when the envelope center hits a vertex.
    for (const ring of rings) {
      for (const point of ring) {
        const y = point[1]!;
        if (y <= center) low = Math.max(low, y);
        else high = Math.min(high, y);
      }
    }
    const y = low / 2 + high / 2;
    const crossings: number[] = [];
    for (const ring of rings) {
      for (let i = 1; i < ring.length; i++) {
        const a = ring[i - 1]!;
        const b = ring[i]!;
        if (a[1]! > y === b[1]! > y) continue;
        const t = (y - a[1]!) / (b[1]! - a[1]!);
        crossings.push((1 - t) * a[0]! + t * b[0]!);
      }
    }
    crossings.sort((a, b) => a - b);
    if (widest < 0) coordinates = [...shell[0]!];
    for (let i = 1; i < crossings.length; i += 2) {
      const start = crossings[i - 1]!;
      const end = crossings[i]!;
      if (end - start > widest) {
        widest = end - start;
        coordinates = [start / 2 + end / 2, y];
      }
    }
  }
  return {type: 'Point', coordinates};
}
