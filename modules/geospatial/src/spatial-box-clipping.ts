// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {WellKnownGeometry} from '@math.gl/core/arrow';
import {clipPolyline} from '@math.gl/geometry/polygon';
import {
  polygonOverlay as polygonClipping,
  type OverlayPolygon,
  type OverlayMultiPolygon
} from '@math.gl/geometry/polygon';
import {vertexCount} from './geometry-inspection';
import {planarBounds} from './spatial-planar';

/** Axis-aligned rectangle in planar XY coordinates. */
export type Box = [number, number, number, number];

/** Tests whether a point lies in the interior of the clipping rectangle. */
function containsPoint(point: readonly number[], [minX, minY, maxX, maxY]: Box): boolean {
  const [x, y] = point;
  return x! > minX && x! < maxX && y! > minY && y! < maxY;
}

/** Clips a path without joining fragments across an excursion outside the rectangle. */
function clipPath(path: readonly (readonly number[])[], box: Box): number[][][] {
  if (path.some(point => !Number.isFinite(point[0]) || !Number.isFinite(point[1]))) {
    throw new Error('ST_ClipByBox2D requires finite line coordinates');
  }
  if (path.every(point => containsPoint(point, box))) return [path.map(point => [...point])];
  const [minX, minY, maxX, maxY] = box;
  const paths: number[][][] = [];
  for (const part of clipPolyline(
    path.flatMap(point => [point[0]!, point[1]!]),
    box
  )) {
    let vertices: number[][] = [];
    for (let i = 2; i < part.length; i += 2) {
      const ax = part[i - 2]!;
      const ay = part[i - 1]!;
      const bx = part[i]!;
      const by = part[i + 1]!;
      if (ax === bx && ay === by) continue;
      const boundary =
        (ax === bx && (ax === minX || ax === maxX)) || (ay === by && (ay === minY || ay === maxY));
      if (boundary) {
        if (vertices.length) paths.push(vertices);
        vertices = [];
        continue;
      }
      if (!vertices.length) vertices.push([ax, ay]);
      vertices.push([bx, by]);
    }
    if (vertices.length) paths.push(vertices);
  }
  return paths;
}

/** Clips polygon shells and holes together so disconnected pieces retain their topology. */
export function clipPolygons(
  polygons: readonly (readonly (readonly (readonly number[])[])[])[],
  [minX, minY, maxX, maxY]: Box
): OverlayMultiPolygon {
  const subject: OverlayMultiPolygon = polygons
    .filter(polygon => polygon[0]?.length)
    .map(rings => rings.filter(ring => ring.length).map(ring => ring.map(([x, y]) => [x!, y!])));
  if (!subject.length) return [];
  const rectangle: OverlayPolygon = [
    [
      [minX, minY],
      [maxX, minY],
      [maxX, maxY],
      [minX, maxY],
      [minX, minY]
    ]
  ];
  return polygonClipping.intersection(subject, rectangle);
}

/** Individual geometry types emitted by rectangle clipping. */
type ClipPart = Extract<WellKnownGeometry, {type: 'Point' | 'LineString' | 'Polygon'}>;

/** Clips a geometry to atomic parts so the result can be recombined by geometry type. */
function clipParts(geometry: WellKnownGeometry, box: Box): ClipPart[] {
  switch (geometry.type) {
    case 'Point':
      return containsPoint(geometry.coordinates, box) ? [geometry] : [];
    case 'MultiPoint':
      return geometry.coordinates.flatMap(coordinates =>
        containsPoint(coordinates, box) ? [{type: 'Point', coordinates}] : []
      );
    case 'LineString':
      return geometry.coordinates.length
        ? clipPath(geometry.coordinates, box).map(coordinates => ({
            type: 'LineString',
            coordinates
          }))
        : [];
    case 'MultiLineString':
      return geometry.coordinates.flatMap(path =>
        path.length
          ? clipPath(path, box).map(coordinates => ({type: 'LineString', coordinates}))
          : []
      );
    case 'Polygon':
    case 'MultiPolygon': {
      const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
      return clipPolygons(polygons, box).map(coordinates => ({type: 'Polygon', coordinates}));
    }
    case 'GeometryCollection':
      return geometry.geometries.flatMap(child => clipParts(child, box));
  }
}

/** Returns a single geometry, a homogeneous multipart, or a mixed collection. */
function combineParts(parts: ClipPart[]): WellKnownGeometry {
  if (parts.length === 1) return parts[0]!;
  if (parts.length) {
    if (parts.every(part => part.type === 'Point')) {
      return {type: 'MultiPoint', coordinates: parts.map(part => part.coordinates)};
    }
    if (parts.every(part => part.type === 'LineString')) {
      return {type: 'MultiLineString', coordinates: parts.map(part => part.coordinates)};
    }
    if (parts.every(part => part.type === 'Polygon')) {
      return {type: 'MultiPolygon', coordinates: parts.map(part => part.coordinates)};
    }
  }
  return {type: 'GeometryCollection', geometries: parts};
}

/** Derives the rectangle from a bounds geometry and clips a planar feature. */
export function clipGeometryByBox(
  geometry: WellKnownGeometry,
  boundsGeometry: WellKnownGeometry
): WellKnownGeometry | null {
  const bounds = planarBounds(boundsGeometry);
  if (!bounds) return null;
  if (!bounds.every(Number.isFinite)) throw new Error('ST_ClipByBox2D requires finite bounds');
  if (!vertexCount(geometry)) return geometry;
  if (bounds[0] === bounds[2] || bounds[1] === bounds[3]) {
    throw new Error('ST_ClipByBox2D requires a rectangle with positive width and height');
  }
  return combineParts(clipParts(geometry, bounds as Box));
}
