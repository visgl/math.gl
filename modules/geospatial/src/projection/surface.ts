// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {
  prepareMapSurfaceMesh,
  type MapSurfaceMesh,
  type MapSurfaceMeshOptions
} from '../discontinuous/map-surface-mesh';
import type {GeographicPosition, MapBounds} from '../discontinuous/map-layout';

export type ProjectionSurfaceOptions = MapSurfaceMeshOptions & {
  /** Rectangular geographic validity extent, in degrees. */
  extent: MapBounds;
  /** Multiply projected coordinates by this positive factor; default 1. */
  scale?: number;
};
/** Prepare a raster surface for an ordinary CRS projection over an explicit
 * geographic extent. Use MapEngine.prepareSurface for chart cuts and insets. */
export function prepareProjectionSurface(
  projection: {project(position: readonly number[]): readonly number[]},
  options: ProjectionSurfaceOptions
): MapSurfaceMesh {
  const [west, south, east, north] = options.extent;
  const scale = options.scale ?? 1;
  if (
    !options.extent.every(Number.isFinite) ||
    !(west < east && south < north) ||
    east - west > 360 ||
    south < -90 ||
    north > 90 ||
    !Number.isFinite(scale) ||
    scale <= 0
  )
    throw new RangeError('Invalid projection surface extent or scale');
  return prepareMapSurfaceMesh(
    {
      regions: [
        {
          id: 'projection',
          interior: [(west + east) / 2, (south + north) / 2],
          boundary: [
            [west, south],
            [east, south],
            [east, north],
            [west, north]
          ]
        }
      ],
      projectPoint: (geographic: GeographicPosition) => {
        if (
          geographic[0] < west ||
          geographic[0] > east ||
          geographic[1] < south ||
          geographic[1] > north
        )
          return null;
        try {
          const p = projection.project(geographic);
          return p.length >= 2 && p.slice(0, 2).every(Number.isFinite)
            ? {position: [p[0] * scale, p[1] * scale]}
            : null;
        } catch {
          return null;
        }
      }
    },
    options
  );
}
