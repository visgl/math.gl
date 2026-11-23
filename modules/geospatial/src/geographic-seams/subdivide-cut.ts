// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original source-interval and generated-boundary adapter over math.gl's existing adaptive subdivision engine; solver notices remain attached.
import {
  subdividePolyline,
  type SubdividePolylineOptions,
  type SubdividedPolyline,
  type PolylineEdgeSampler
} from '@math.gl/geometry/polygon';
import {GeodesicPath} from '../geodesic-path';
import {RhumbPath} from '../rhumb-path';
import {EllipsoidGeodesic} from '../ellipsoid-geodesic';
import {EllipsoidRhumb} from '../ellipsoid-rhumb';
import {EllipsoidMetrics} from '../ellipsoid-metrics';
import {Context, same, createEdges} from './edge';
import {cutOptions, type GeographicClipOptions} from './cut-options';
import {GeographicSeamError, type GeographicPolygonRing} from './types';
import type {GeographicCutRing, GeographicCutEdge} from '../geographic-cuts';
export type SubdivideGeographicCutRingOptions = GeographicClipOptions &
  Omit<SubdividePolylineOptions, 'createEdgeSampler'>;
export type SubdividedGeographicCutRing = SubdividedPolyline & {edges: GeographicCutEdge[]};
/** Resample original curves after clipping; generated parallels remain parallels.
 * Use the same model/axes/input rings as clipping. Sizes 2/3 and target sizes 2/3.
 * maxSegmentLength is in solver axis units for curves, degrees for linear geometry.
 */
export function subdivideGeographicCutRing(
  inputs: readonly GeographicPolygonRing[],
  ring: GeographicCutRing,
  options: SubdivideGeographicCutRingOptions
): SubdividedGeographicCutRing {
  const settings = {...options};
  const turns = inputs.map(r => (r.longitudeTurns ? Array.from(r.longitudeTurns) : undefined));
  const config = cutOptions(settings),
    context = new Context(config.options),
    size = settings.size ?? 2;
  if (size !== 2 && size !== 3)
    throw new GeographicSeamError('input', 'Cut subdivision supports coordinate sizes 2 or 3');
  const points = inputs.map(r => {
    const p = context.read(r.positions);
    if (p.length > 1 && same(p[0], p[p.length - 1])) p.pop();
    return p;
  });
  const positions = context.read(ring.positions);
  if (
    !positions.length ||
    ring.edges.length !== positions.length - 1 ||
    !same(positions[0], positions[positions.length - 1])
  )
    throw new GeographicSeamError(
      'input',
      'Expected a closed cut ring with one descriptor per edge'
    );
  const descriptors = ring.edges.map(e =>
    e.kind === 'source' ? {kind: 'source' as const, source: {...e.source}} : {...e}
  );
  const sources = new Map<string, GeodesicPath | RhumbPath | PolylineEdgeSampler>();
  let geodesic = config.options.geodesic;
  const getGeodesic = () => (geodesic ??= new EllipsoidGeodesic(config.axes));
  let rhumb = config.options.rhumb;
  const getRhumb = () => (rhumb ??= new EllipsoidRhumb(config.axes));
  const result = subdividePolyline(new Float64Array(positions.flat()), {
    ...settings,
    transform: p => {
      context.tick();
      return settings.transform(p);
    },
    size,
    createEdgeSampler: (a, b, index) => {
      const descriptor = descriptors[index];
      const endpoint = (sample: (t: number) => ArrayLike<number>, t: number) =>
        t === 0 ? a.slice() : t === 1 ? b.slice() : sample(t);
      if (descriptor.kind === 'source') {
        const s = descriptor.source,
          p = points[s.ringIndex];
        if (
          !Number.isInteger(s.ringIndex) ||
          !p ||
          !Number.isInteger(s.edgeIndex) ||
          s.edgeIndex < 0 ||
          s.edgeIndex >= p.length ||
          ![s.startFraction, s.endFraction, s.longitudeShift].every(Number.isFinite) ||
          Math.min(s.startFraction, s.endFraction) < 0 ||
          Math.max(s.startFraction, s.endFraction) > 1 ||
          !Number.isSafeInteger(s.longitudeShift / 360)
        )
          throw new GeographicSeamError('input', 'Invalid cut source interval');
        const key = s.ringIndex + ':' + s.edgeIndex;
        let path = sources.get(key);
        if (!path) {
          const first = p[s.edgeIndex],
            last = p[(s.edgeIndex + 1) % p.length],
            edgeTurns = turns[s.ringIndex]?.[s.edgeIndex] ?? 0;
          if (settings.edgeModel === 'geodesic')
            path = new GeodesicPath(first, last, {geodesic: getGeodesic()});
          else if (settings.edgeModel === 'rhumb')
            path = new RhumbPath(first, last, {rhumb: getRhumb(), longitudeTurns: edgeTurns});
          else {
            const edge = createEdges(
              first,
              last,
              first,
              s.edgeIndex,
              s.ringIndex,
              edgeTurns,
              context
            )[0];
            path = {
              length: Math.hypot(...edge.b.map((v, i) => v - edge.a[i])),
              sample: edge.sample
            };
          }
          sources.set(key, path);
        }
        const curve = path;
        return {
          length: curve.length * Math.abs(s.endFraction - s.startFraction),
          sample: t =>
            endpoint(u => {
              const f = s.startFraction + (s.endFraction - s.startFraction) * u,
                p = Array.from(curve.sample(f));
              p[0] += s.longitudeShift;
              return p;
            }, t)
        };
      }
      if (descriptor.kind === 'pole') {
        if (
          Math.abs(descriptor.latitude) !== 90 ||
          a[1] !== descriptor.latitude ||
          b[1] !== descriptor.latitude
        )
          throw new GeographicSeamError('input', 'Invalid pole connector');
        return {length: 0, sample: t => a.map((v, i) => v * (1 - t) + b[i] * t)};
      }
      if (
        descriptor.kind === 'parallel'
          ? a[1] !== descriptor.latitude || b[1] !== descriptor.latitude
          : descriptor.kind !== 'meridian' ||
            a[0] !== descriptor.longitude ||
            b[0] !== descriptor.longitude
      )
        throw new GeographicSeamError('input', 'Boundary descriptor does not match its endpoints');
      if (settings.edgeModel === 'linear')
        return {
          length: Math.hypot(...a.map((v, i) => v - b[i])),
          sample: t => a.map((v, i) => v * (1 - t) + b[i] * t)
        };
      if (descriptor.kind === 'parallel') {
        const path = new RhumbPath(a, b, {rhumb: getRhumb(), longitudeMode: 'unrolled'});
        return {
          length: path.length,
          sample: t =>
            endpoint(u => {
              const p = path.sample(u);
              p[1] = descriptor.latitude;
              return p;
            }, t)
        };
      }
      const metrics = new EllipsoidMetrics(config.axes),
        m0 = metrics.meridianDistance(a[1]),
        m1 = metrics.meridianDistance(b[1]);
      return {
        length: Math.abs(m1 - m0),
        sample: t =>
          endpoint(u => {
            const p = a.map((v, i) => v * (1 - u) + b[i] * u);
            p[0] = descriptor.longitude;
            p[1] = metrics.latitudeFromAuxiliary(
              ((m0 * (1 - u) + m1 * u) / metrics.quarterMeridian) * 90,
              'rectifying'
            );
            return p;
          }, t)
      };
    }
  });
  const edges: GeographicCutEdge[] = [];
  for (let i = 1; i < result.segmentIndices.length; i++) {
    const index = result.segmentIndices[i],
      edge = descriptors[index],
      lo = result.segmentIndices[i - 1] === index ? result.segmentFractions[i - 1] : 0,
      hi = result.segmentFractions[i];
    edges.push(
      edge.kind === 'source'
        ? {
            kind: 'source',
            source: {
              ...edge.source,
              startFraction:
                edge.source.startFraction +
                (edge.source.endFraction - edge.source.startFraction) * lo,
              endFraction:
                edge.source.startFraction +
                (edge.source.endFraction - edge.source.startFraction) * hi
            }
          }
        : {...edge}
    );
  }
  return {...result, edges};
}
