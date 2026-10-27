// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original atlas descriptor adapter over the existing adaptive subdivision engine; upstream solver notices retained.
import {
  subdividePolyline,
  type SubdividePolylineOptions,
  type SubdividedPolyline
} from '@math.gl/geometry/polygon';
import {Context, same, type Edge} from '../geographic-seams/edge';
import {GeographicSeamError} from '../geographic-seams/types';
import type {GeodesicParameters} from '../ellipsoid-geodesic';
import {circleCurve, sliceCurve, type Curve} from './curves';
import {normal, position, ANGULAR, type Circle} from './math';
import type {GeographicAtlasRing, GeographicAtlasEdge, GeographicAtlasSource} from './types';
export type AtlasSubdivisionOptions = Omit<SubdividePolylineOptions, 'size' | 'createEdgeSampler'>;
export type SubdividedAtlasPolyline = SubdividedPolyline & {edges: GeographicAtlasSource[]};
export type SubdividedAtlasRing = SubdividedPolyline & {edges: GeographicAtlasEdge[]};
export function subdivideAtlasRing(
  sources: {edge: Edge; curve: Curve}[],
  boundaries: Circle[],
  ring: GeographicAtlasRing,
  options: AtlasSubdivisionOptions,
  context: Context,
  axes: GeodesicParameters,
  closed = true
): SubdividedAtlasRing {
  const settings = {...options},
    size = context.size,
    points = context.read(ring.positions),
    descriptors = ring.edges.map(e =>
      e.kind === 'source' ? {...e, source: {...e.source}} : {...e}
    );
  if (
    (size !== 2 && size !== 3) ||
    points.length < (closed ? 2 : 1) ||
    descriptors.length !== points.length - 1 ||
    (closed && !same(points[0], points[points.length - 1]))
  )
    throw new GeographicSeamError(
      'input',
      'Invalid atlas path dimensions, closure or descriptor count'
    );
  const ratio = axes.semiMinorAxis / axes.semiMajorAxis,
    Rmax = axes.semiMajorAxis * Math.max(1, ratio * ratio, 1 / ratio);
  const curves = descriptors.map((e, i) => {
    let curve: Curve;
    if (e.kind === 'source') {
      const s = e.source;
      if (
        ![s.startFraction, s.endFraction].every(Number.isFinite) ||
        Math.min(s.startFraction, s.endFraction) < 0 ||
        Math.max(s.startFraction, s.endFraction) > 1
      )
        throw new GeographicSeamError('input', 'Invalid atlas source interval');
      const source = sources.find(
        p =>
          p.edge.source?.ringIndex === s.ringIndex &&
          p.edge.source.edgeIndex === s.edgeIndex &&
          Math.min(s.startFraction, s.endFraction) >= p.edge.source.startFraction &&
          Math.max(s.startFraction, s.endFraction) <= p.edge.source.endFraction
      );
      if (!source)
        throw new GeographicSeamError(
          'input',
          'Atlas source interval is not in the original rings'
        );
      const original = source.edge.source!,
        delta = original.endFraction - original.startFraction;
      curve = sliceCurve(
        source.curve,
        (s.startFraction - original.startFraction) / delta,
        (s.endFraction - original.startFraction) / delta
      );
    } else {
      const boundary = boundaries.find(b => b.id === e.boundary);
      if (
        !boundary ||
        ![e.startAngle, e.endAngle].every(Number.isFinite) ||
        Math.abs(e.endAngle - e.startAngle) > 2 * Math.PI
      )
        throw new GeographicSeamError('input', 'Invalid atlas boundary interval');
      curve = circleCurve(
        boundary,
        e.startAngle,
        e.endAngle,
        points[i].slice(2),
        points[i + 1].slice(2)
      );
    }
    for (const t of [0, 1])
      if (
        Math.hypot(...normal(curve.sample(t)).map((x, j) => x - normal(points[i + t])[j])) > ANGULAR
      )
        throw new GeographicSeamError('input', 'Atlas descriptor does not match its endpoints');
    return curve;
  });
  const result = subdividePolyline(new Float64Array(points.flat()), {
    ...settings,
    size,
    transform: p => {
      context.tick();
      return settings.transform(p);
    },
    createEdgeSampler: (a, b, index) => {
      const curve = curves[index];
      return {
        length: curve.speed * Rmax,
        sample: t => {
          context.tick();
          if (t === 0) return a.slice();
          if (t === 1) return b.slice();
          const p = curve.sample(t);
          return position(normal(p), p.slice(2));
        }
      };
    }
  });
  const edges: GeographicAtlasEdge[] = [];
  for (let i = 1; i < result.segmentIndices.length; i++) {
    const index = result.segmentIndices[i],
      edge = descriptors[index],
      lo = result.segmentIndices[i - 1] === index ? result.segmentFractions[i - 1] : 0,
      hi = result.segmentFractions[i];
    if (edge.kind === 'source') {
      const s = edge.source,
        d = s.endFraction - s.startFraction;
      edges.push({
        kind: 'source',
        source: {
          ...s,
          startFraction: s.startFraction + d * lo,
          endFraction: s.startFraction + d * hi
        }
      });
    } else {
      const d = edge.endAngle - edge.startAngle;
      edges.push({
        ...edge,
        startAngle: edge.startAngle + d * lo,
        endAngle: edge.startAngle + d * hi
      });
    }
  }
  return {...result, edges};
}
