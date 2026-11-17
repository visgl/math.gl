// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import type {MapEngine, MapLine} from '@math.gl/geospatial/maps';
import {REGIONAL_VIEWS} from './regional-views.ts';

export const canCenterMap = (view: unknown) =>
  typeof view === 'string' &&
  !REGIONAL_VIEWS[view] &&
  view !== 'albersUsa' &&
  !view.startsWith('myriahedral:');
export const wrapLongitude = (value: number) => ((((value + 180) % 360) + 360) % 360) - 180;
export const mapLongitudeOffset = (view: unknown, longitude: number) =>
  canCenterMap(view) ? longitude : 0;
export const geographicSource = (
  source: readonly [number, number],
  offset: number
): [number, number] => [source[0] + offset, source[1]];

/** Rotate the periodic source field, keeping triangles on their original side of each cut. */
export function sampleLongitudeRow(field: ArrayLike<number>, x: number, y: number, offset: number) {
  const column = (((x + offset) % 360) + 360) % 360;
  const west = Math.floor(column),
    fraction = column - west;
  return field[y * 360 + west] * (1 - fraction) + field[y * 360 + ((west + 1) % 360)] * fraction;
}

type Graticule = MapLine & {meridian?: number};
const graticules = new WeakMap<MapEngine, {offset: number; lines: Graticule[]}>();
/** Reproject true 30-degree meridians into each chart when its central meridian moves. */
export function centeredGraticules(map: MapEngine, lines: Graticule[], offset: number) {
  if (offset === 0) return lines;
  const previous = graticules.get(map);
  if (previous?.offset === offset) return previous.lines;
  const shifted = lines.filter(line => line.meridian === undefined);
  for (let lon = -180; lon <= 180; lon += 30) {
    const relative = wrapLongitude(lon - offset);
    shifted.push(
      ...map.projectLine(
        Array.from({length: 181}, (_, i) => [relative, i - 90] as [number, number])
      )
    );
  }
  graticules.set(map, {offset, lines: shifted});
  return shifted;
}
