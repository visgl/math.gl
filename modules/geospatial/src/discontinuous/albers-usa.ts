// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {DiscontinuousMap, type MapRegion} from './map-layout';
import {RAD, type Position} from './math';

/** Independent spherical Albers USA composite with Alaska and Hawaii insets.
 * Geographic masks have great-circle edges, not political or D3 clip boundaries.
 */
export function createAlbersUsaMap(options: {radius?: number} = {}): DiscontinuousMap {
  const radius = options.radius ?? 1;
  if (!Number.isFinite(radius) || radius <= 0)
    throw new Error('Radius must be finite and positive');
  const region = (
    id: string,
    bounds: [number, number, number, number],
    center: Position,
    parallels: Position,
    size: number,
    offset: Position,
    insetBounds?: [number, number, number, number]
  ): MapRegion => {
    const [west, south, east, north] = bounds;
    const n = (Math.sin(parallels[0] * RAD) + Math.sin(parallels[1] * RAD)) / 2;
    const c = Math.cos(parallels[0] * RAD) ** 2 + 2 * n * Math.sin(parallels[0] * RAD);
    const rho = (latitude: number) => Math.sqrt(c - 2 * n * Math.sin(latitude)) / n;
    const origin = rho(center[1] * RAD);
    const definition: MapRegion = {
      id,
      layout: {
        label: id === 'lower48' ? 'Contiguous U.S.' : id === 'alaska' ? 'Alaska' : 'Hawaii',
        kind: insetBounds ? 'inset' : 'main',
        ...(insetBounds
          ? {
              parentId: 'lower48',
              frame: insetBounds.map(v => v * radius) as [number, number, number, number]
            }
          : {}),
        relativeScale: size,
        drawOrder: insetBounds ? 1 : 0
      },
      boundary: [
        [west, south],
        [east, south],
        [east, north],
        [west, north]
      ],
      interior: center,
      placement: [radius * size, 0, 0, radius * size, radius * offset[0], radius * offset[1]],
      project: ([longitude, latitude]) => {
        const delta = ((((longitude - center[0] + 180) % 360) + 360) % 360) - 180;
        const angle = n * delta * RAD,
          r = rho(latitude * RAD);
        return [r * Math.sin(angle), origin - r * Math.cos(angle)];
      },
      unproject: ([x, y]) => {
        const dy = origin - y;
        const sine = (c - n * n * (x * x + dy * dy)) / (2 * n);
        if (Math.abs(sine) > 1 + 1e-12) return null;
        return [
          center[0] + Math.atan2(x, dy) / n / RAD,
          Math.asin(Math.max(-1, Math.min(1, sine))) / RAD
        ];
      }
    };
    if (insetBounds) {
      const [left, bottom, right, top] = insetBounds;
      definition.boundary = [
        [left, bottom],
        [right, bottom],
        [right, top],
        [left, top]
      ].map(([x, y]) => definition.unproject([(x - offset[0]) / size, (y - offset[1]) / size])!);
      definition.interior = definition.unproject([
        ((left + right) / 2 - offset[0]) / size,
        ((bottom + top) / 2 - offset[1]) / size
      ])!;
    }
    return definition;
  };
  return new DiscontinuousMap([
    region('lower48', [-127, 20, -65, 51], [-96, 38], [29.5, 45.5], 1, [0, 0]),
    region(
      'alaska',
      [-190, 40, -130, 78],
      [-154, 60],
      [55, 65],
      0.35,
      [-0.307, -0.201],
      [-0.425, -0.234, -0.22, -0.12]
    ),
    region(
      'hawaii',
      [-179, 17, -153, 30],
      [-157, 21],
      [8, 18],
      1,
      [-0.15, -0.2],
      [-0.215, -0.245, -0.1, -0.155]
    )
  ]);
}
