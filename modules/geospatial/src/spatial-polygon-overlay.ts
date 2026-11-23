// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {WellKnownGeometry} from '@math.gl/core/arrow';
import type {MultiPolygon} from 'polygon-clipping';

/** Converts native polygon rings to the existing polygon overlay kernel's input. */
export function polygonSet(geometry: WellKnownGeometry): MultiPolygon {
  const polygons =
    geometry.type === 'Polygon'
      ? [geometry.coordinates]
      : geometry.type === 'MultiPolygon'
        ? geometry.coordinates
        : undefined;
  if (!polygons) throw new Error('Polygon overlay requires Polygon or MultiPolygon input');
  return polygons
    .filter(polygon => polygon[0]?.length)
    .map(polygon =>
      polygon
        .filter(ring => ring.length)
        .map(ring =>
          ring.map(([x, y]) => {
            if (!Number.isFinite(x) || !Number.isFinite(y))
              throw new Error('Polygon overlay requires finite coordinates');
            return [x!, y!];
          })
        )
    );
}
