// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {DiscontinuousMap, type MapRegion} from './map-layout';
import {RAD, type Position} from './math';

/** Independent spherical Albers USA composite with Alaska and Hawaii insets.
 * Geographic masks have great-circle edges, not political or D3 clip boundaries.
 */
export function createAlbersUsaMap(
  options: {radius?: number; includeTerritories?: boolean} = {}
): DiscontinuousMap {
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
        label:
          {
            lower48: 'Contiguous U.S.',
            alaska: 'Alaska',
            hawaii: 'Hawaii',
            puertoRico: 'Puerto Rico',
            virginIslands: 'U.S. Virgin Islands',
            guam: 'Guam',
            northernMariana: 'Northern Mariana Islands',
            americanSamoa: 'American Samoa'
          }[id] ?? id,
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
          center[0] + Math.atan2(x * Math.sign(n), dy * Math.sign(n)) / n / RAD,
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
  const regions = [
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
  ];
  if (options.includeTerritories) {
    const territory = (
      id: string,
      bounds: [number, number, number, number],
      center: Position,
      parallels: Position,
      scale: number,
      frame: [number, number, number, number]
    ) => {
      const result = region(id, bounds, center, parallels, scale, [
        (frame[0] + frame[2]) / 2,
        (frame[1] + frame[3]) / 2
      ]);
      result.layout = {
        ...result.layout,
        kind: 'inset',
        parentId: 'lower48',
        frame: frame.map(value => value * radius) as [number, number, number, number],
        drawOrder: 1
      };
      return result;
    };
    regions.push(
      territory(
        'puertoRico',
        [-68.4, 17.4, -64.2, 19.2],
        [-66.4, 18.2],
        [15, 21],
        1,
        [-0.205, -0.34, -0.125, -0.26]
      ),
      territory(
        'virginIslands',
        [-65.2, 17.6, -64.3, 18.8],
        [-64.8, 18.3],
        [15, 21],
        2.7,
        [-0.12, -0.34, -0.04, -0.26]
      ),
      territory(
        'guam',
        [144.4, 13.1, 145.1, 13.9],
        [144.8, 13.5],
        [10, 17],
        2.8,
        [-0.035, -0.34, 0.045, -0.26]
      ),
      territory(
        'northernMariana',
        [144.7, 13.8, 146.4, 20.6],
        [145.6, 17],
        [12, 20],
        0.6,
        [0.05, -0.34, 0.13, -0.26]
      ),
      territory(
        'americanSamoa',
        [-171.5, -14.5, -168, -10.8],
        [-170.6, -12.8],
        [-17, -11],
        1.2,
        [0.135, -0.34, 0.215, -0.26]
      )
    );
  }
  return new DiscontinuousMap(regions);
}
