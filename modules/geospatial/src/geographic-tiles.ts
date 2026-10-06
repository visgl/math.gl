// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {splitGlobeBounds, type GlobeBounds} from './globe-horizon-bounds';

/** Equal-angle longitude/latitude grid: one world tile at level zero, north-origin Y. */
export type GeographicTile = {x: number; y: number; level: number};
/** Inclusive integer tile ranges. Ranges are disjoint and ordered by minX. */
export type GeographicTileRange = {minX: number; maxX: number; minY: number; maxY: number};

/** Geographic degree bounds of an equal-angle tile, not Web Mercator XYZ. */
export function getGeographicTileBounds(tile: GeographicTile): GlobeBounds {
  const size = gridSize(tile.level);
  if (![tile.x, tile.y].every(v => Number.isInteger(v) && v >= 0 && v < size))
    throw new RangeError('Tile coordinates must be integers inside the level grid');
  return [
    -180 + (360 * tile.x) / size,
    90 - (180 * (tile.y + 1)) / size,
    -180 + (360 * (tile.x + 1)) / size,
    90 - (180 * tile.y) / size
  ];
}

/** Address a point in degrees. Interior edges belong to the east/south tile. */
export function getGeographicTile(
  longitude: number,
  latitude: number,
  level: number
): GeographicTile {
  const size = gridSize(level);
  if (
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180 ||
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90
  )
    throw new RangeError('Expected longitude in [-180, 180] and latitude in [-90, 90]');
  return {
    x: Math.min(size - 1, Math.floor(((longitude + 180) / 360) * size)),
    y: Math.min(size - 1, Math.floor(((90 - latitude) / 180) * size)),
    level
  };
}

/** Cover a degree rectangle without enumerating tiles, including wrapped longitude.
 * Positive-area queries exclude edge-only neighbors; zero-width/height queries use
 * point-address edge ownership. Both +/-180 spellings of the seam stay explicit.
 */
export function getGeographicTileRanges(bounds: GlobeBounds, level: number): GeographicTileRange[] {
  const size = gridSize(level);
  const split = splitGlobeBounds(bounds);
  const positiveWidth = split.filter(([west, , east]) => east > west);
  const rectangles = positiveWidth.length ? positiveWidth : split;
  const intervals = rectangles
    .map(([west, south, east, north]) => {
      const start = getGeographicTile(west, north, level);
      return {
        minX: start.x,
        maxX:
          west === east
            ? start.x
            : Math.max(start.x, Math.min(size - 1, Math.ceil(((east + 180) / 360) * size) - 1)),
        minY: start.y,
        maxY:
          south === north
            ? start.y
            : Math.max(start.y, Math.min(size - 1, Math.ceil(((90 - south) / 180) * size) - 1))
      };
    })
    .sort((a, b) => a.minX - b.minX);
  const result: GeographicTileRange[] = [];
  for (const range of intervals) {
    const previous = result[result.length - 1];
    if (previous && range.minX <= previous.maxX + 1)
      previous.maxX = Math.max(previous.maxX, range.maxX);
    else result.push(range);
  }
  return result;
}

function gridSize(level: number): number {
  if (!Number.isInteger(level) || level < 0 || level > 30)
    throw new RangeError('Level must be an integer from 0 through 30');
  return 2 ** level;
}
