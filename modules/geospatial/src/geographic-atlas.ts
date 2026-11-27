// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original optional normal-space cut atlas and ellipsoidal orthographic consumer. GeographicLib/PROJ solver credits remain in their owning sources.
export {GeographicCutAtlas} from './geographic-atlas/atlas';
export type * from './geographic-atlas/types';
export type {
  AtlasSubdivisionOptions,
  SubdividedAtlasRing,
  SubdividedAtlasPolyline
} from './geographic-atlas/sampling';
export {GeographicSeamError} from './geographic-seams/types';
export type {GeographicPolygonRing} from './geographic-seams/types';
import {GeographicSeamError} from './geographic-seams/types';
import {GeographicCutAtlas} from './geographic-atlas/atlas';
import {unit, basis, dot, normal, scale, ROUND, type V} from './geographic-atlas/math';
import {cutOptions} from './geographic-seams/cut-options';
import type {GeographicAtlasOptions} from './geographic-atlas/types';
/** Orthographic surface visibility, looking toward the viewer along an ECEF direction.
 * Elevation/terrain occlusion and perspective cameras are separate operations.
 */
export function createOrthographicCutAtlas(
  options: GeographicAtlasOptions & {viewDirection: readonly [number, number, number]}
) {
  const direction = unit(options.viewDirection),
    [u, v] = basis(direction),
    config = cutOptions({...options, latitudeRange: [-90, 90]}),
    a = config.axes.semiMajorAxis,
    r = config.axes.semiMinorAxis / a;
  const atlas = new GeographicCutAtlas(
    {
      boundaries: [{id: 'horizon', normal: direction}],
      charts: [{id: 'visible', center: direction, cuts: [{boundary: 'horizon', side: 1}]}]
    },
    options
  );
  const project = (p: readonly number[]): number[] => {
    if (p.length < 2 || ![p[0], p[1]].every(Number.isFinite) || Math.abs(p[1]) > 90)
      throw new GeographicSeamError('input', 'Invalid orthographic position');
    const n = normal(p),
      w = Math.hypot(n[0], n[1], r * n[2]),
      x: V = [(a * n[0]) / w, (a * n[1]) / w, (a * r * r * n[2]) / w];
    return [dot(u, x), dot(v, x)];
  };
  return {atlas, project, viewDirection: scale(direction, 1), right: scale(u, 1), up: scale(v, 1)};
}

import type {GeographicCutGraph} from './geographic-atlas/types';
/** Eight finite normal-space cells covering the ellipsoid, with shared axis cuts. */
export function createOctahedralCutGraph(): GeographicCutGraph {
  const boundaries = [
      {id: 'x', normal: [1, 0, 0] as const},
      {id: 'y', normal: [0, 1, 0] as const},
      {id: 'z', normal: [0, 0, 1] as const}
    ],
    charts = [];
  for (const x of [-1, 1] as const)
    for (const y of [-1, 1] as const)
      for (const z of [-1, 1] as const)
        charts.push({
          id: `${x}/${y}/${z}`,
          center: [x, y, z] as const,
          cuts: [
            {boundary: 'x', side: x},
            {boundary: 'y', side: y},
            {boundary: 'z', side: z}
          ]
        });
  return {boundaries, charts};
}
/** A concrete faceted-map consumer: normal-sphere gnomonic coordinates per octant.
 * Output units are dimensionless; layout and scaling belong to the caller.
 */
export function createOctahedralCutAtlas(options: GeographicAtlasOptions) {
  const graph = createOctahedralCutGraph(),
    atlas = new GeographicCutAtlas(graph, options),
    frames = new Map(
      graph.charts.map(c => {
        const center = unit(c.center),
          [right, up] = basis(center);
        return [c.id, {center, right, up}];
      })
    );
  const project = (chart: string, p: readonly number[]) => {
    const frame = frames.get(chart);
    if (!frame || p.length < 2 || ![p[0], p[1]].every(Number.isFinite) || Math.abs(p[1]) > 90)
      throw new GeographicSeamError('input', 'Invalid octahedral projection input');
    const n = normal(p),
      d = dot(frame.center, n);
    if (d < 0.5 || frame.center.some((x, i) => x * n[i] < -ROUND))
      throw new GeographicSeamError('input', 'Point outside the selected face projection domain');
    return [dot(frame.right, n) / d, dot(frame.up, n) / d];
  };
  return {
    atlas,
    project,
    frames: Array.from(frames, ([id, f]) => ({
      id,
      center: scale(f.center, 1),
      right: scale(f.right, 1),
      up: scale(f.up, 1)
    }))
  };
}
