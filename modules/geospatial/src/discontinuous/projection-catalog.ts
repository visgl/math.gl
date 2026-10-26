// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {createWorldMap, type WorldProjection} from './world-map';
import {WORLD_PROJECTIONS} from './world-kernels';
import {createRegionalMap, REGIONAL_PROJECTIONS} from './regional-map';
import {CapMap} from './cap-map';
import {RotatedMap} from './rotated-map';
import {
  createInterruptedMap,
  createGoodeMap,
  createInterruptedBoggsMap,
  createInterruptedQuarticAuthalicMap,
  createInterruptedMollweideHemispheresMap,
  type InterruptedLobe
} from './presets';
import {
  createGuyouMap,
  createPeirceQuincuncialMap,
  createGringortenQuincuncialMap,
  createBerghausMap,
  createGingeryMap
} from './quincuncial-star';
import {createHealpixMap} from './healpix';
import {createButterflyMap, createCollignonButterflyMap, createWatermanMap} from './polyhedral';
import type {DiscontinuousMap} from './map-layout';
import {RAD, type Position} from './math';
const land = {
  north: [
    [-180, -100, -40],
    [-40, 30, 180]
  ] as InterruptedLobe[],
  south: [
    [-180, -160, -100],
    [-100, -60, -20],
    [-20, 20, 80],
    [80, 140, 180]
  ] as InterruptedLobe[]
};
const cap = (map: DiscontinuousMap, radius: number) =>
  new CapMap(
    [...map.regions],
    p => [...p] as Position,
    p => p,
    179.999 * RAD,
    radius
  );
const specialized = {
  'interrupted-sinusoidal': (radius: number) =>
    createInterruptedMap({
      projection: 'sinusoidal',
      radius,
      centralMeridian: 20,
      lobes: {
        north: [
          [-180, -110, -40],
          [-40, 0, 40],
          [40, 110, 180]
        ],
        south: [
          [-180, -110, -40],
          [-40, 0, 40],
          [40, 110, 180]
        ]
      }
    }),
  'interrupted-mollweide': (radius: number) =>
    createInterruptedMap({projection: 'mollweide', radius, lobes: land}),
  'interrupted-homolosine': (radius: number) => createGoodeMap({radius}),
  'interrupted-boggs': (radius: number) => createInterruptedBoggsMap({radius}),
  'interrupted-sinu-mollweide': (radius: number) =>
    new RotatedMap(
      createInterruptedMap({
        projection: 'sinu-mollweide',
        radius,
        latitudes: {north: 35, south: -10},
        lobes: {
          north: [
            [-180, -30, 0],
            [0, 30, 180]
          ],
          south: [
            [-180, -102, -65],
            [-65, 5, 77],
            [77, 103, 180]
          ]
        }
      }),
      [-20, -55]
    ),
  'interrupted-quartic-authalic': (radius: number) => createInterruptedQuarticAuthalicMap({radius}),
  'interrupted-mollweide-hemispheres': (radius: number) =>
    createInterruptedMollweideHemispheresMap({radius}),
  guyou: (radius: number) => createGuyouMap({radius}),
  'peirce-quincuncial': (radius: number) =>
    new RotatedMap(cap(createPeirceQuincuncialMap({radius}), radius), [-90, -90, 45]),
  'gringorten-quincuncial': (radius: number) =>
    new RotatedMap(cap(createGringortenQuincuncialMap({radius}), radius), [-90, -90, 45]),
  berghaus: (radius: number) => cap(createBerghausMap({radius}), radius),
  gingery: (radius: number) => new RotatedMap(cap(createGingeryMap({radius}), radius), [90, -40]),
  healpix: (radius: number) => createHealpixMap({radius}),
  butterfly: (radius: number) => createButterflyMap({radius}),
  'collignon-butterfly': (radius: number) => createCollignonButterflyMap({radius}),
  waterman: (radius: number) => createWatermanMap({radius})
};
export type MapProjection =
  | WorldProjection
  | (typeof REGIONAL_PROJECTIONS)[number]
  | keyof typeof specialized;
export const MAP_PROJECTIONS: readonly MapProjection[] = Object.freeze([
  ...WORLD_PROJECTIONS,
  ...REGIONAL_PROJECTIONS,
  ...(Object.keys(specialized) as (keyof typeof specialized)[])
]);
export type ProjectionMapOptions = {projection: MapProjection; radius?: number};
/** Named spherical projection catalog, with D3's default formulas and geographic aspects. */
export function createProjectionMap({
  projection,
  radius = 1
}: ProjectionMapOptions): DiscontinuousMap {
  if (!Number.isFinite(radius) || radius <= 0) throw new Error('Expected positive finite radius');
  if ((WORLD_PROJECTIONS as readonly string[]).includes(projection))
    return createWorldMap({projection: projection as WorldProjection, radius});
  if ((REGIONAL_PROJECTIONS as readonly string[]).includes(projection))
    return createRegionalMap({
      projection: projection as (typeof REGIONAL_PROJECTIONS)[number],
      radius
    });
  if (Object.prototype.hasOwnProperty.call(specialized, projection))
    return specialized[projection as keyof typeof specialized](radius);
  throw new Error('Unknown map projection');
}
