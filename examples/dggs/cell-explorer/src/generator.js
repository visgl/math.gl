// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {S2Decoder, getS2ChildIndex, getS2IndexFromCell, getS2TokenFromIndex} from '@math.gl/dggs';
import {lonLatToCell, polygonToCells as a5PolygonToCells, uncompact, u64ToHex} from 'a5-js';
import {latLngToCell, polygonToCellsExperimental, POLYGON_TO_CELLS_FLAGS} from 'h3-js';
import OpenLocationCodePackage from 'open-location-code';
import S2Package from 's2-geometry';

const {S2} = S2Package;
const plusCode = new OpenLocationCodePackage.OpenLocationCode();
const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
const range = (min, max) => Array.from({length: max - min + 1}, (_, index) => min + index);

/** Native grid levels; GeoHash and Plus Code levels count significant characters. */
export const GRID_LEVELS = {
  // A5 level 30 falls back to level 29 in some regions of its 64-bit encoding.
  a5: {levels: range(0, 29)},
  geohash: {levels: range(1, 12)},
  h3: {levels: range(0, 15)},
  'plus-code': {levels: [2, 4, 6, 8, 10, 11, 12, 13, 14, 15]},
  quadkey: {levels: range(1, 30)},
  s2: {levels: range(0, 30)}
};

/** Find the containing cell ID for a coordinate in [longitude, latitude] degrees. */
export function getCellId(grid, coordinate, level) {
  if (!GRID_LEVELS[grid]?.levels.includes(level)) throw new Error('Select a valid grid level.');
  const [longitude, latitude] = coordinate;
  switch (grid) {
    case 'a5':
      return u64ToHex(lonLatToCell([longitude, latitude], level));
    case 'h3':
      return latLngToCell(latitude, longitude, level);
    case 'plus-code':
      return plusCode.encode(latitude, longitude, level);
    case 'geohash':
      return encodeGeohash(longitude, latitude, level);
    case 'quadkey': {
      const {x, y} = getTileCoordinates(longitude, latitude, level);
      return encodeQuadkey(x, y, level);
    }
    case 's2':
      return s2Token(S2.S2Cell.FromLatLng({lat: latitude, lng: longitude}, level));
    default:
      throw new Error('Unknown grid.');
  }
}

/** Choose the starting detail and refinement rate for each grid with tile zoom. */
export function getGridLevel(grid, zoom) {
  if (!Number.isFinite(zoom) || !GRID_LEVELS[grid])
    throw new Error('Select a valid grid and zoom.');
  const tileZoom = Math.max(0, Math.floor(zoom));
  let level;
  switch (grid) {
    case 'h3':
      level = Math.floor(((tileZoom + 1) * Math.log(2)) / Math.log(Math.sqrt(7))) - 1;
      break;
    case 'a5':
    case 's2':
      level = tileZoom;
      break;
    case 'quadkey':
      // Smaller base cells render more clearly on the globe than level-1 hemispheres.
      level = tileZoom + 2;
      break;
    case 'geohash':
      level = Math.floor(((tileZoom + 4) * 2) / 5);
      break;
    case 'plus-code': {
      // Plus Code pair levels shrink cells twentyfold. Advance only when the
      // finer level still fits at most 32 columns in one Web Mercator tile.
      const minimumWidth = 360 / 2 ** tileZoom / 32;
      level = 2;
      for (const candidate of GRID_LEVELS[grid].levels) {
        const area = plusCode.decode(plusCode.encode(0, 0, candidate));
        if (area.longitudeHi - area.longitudeLo >= minimumWidth) level = candidate;
      }
      break;
    }
    default:
      throw new Error('Unknown grid.');
  }
  const levels = GRID_LEVELS[grid].levels;
  return Math.max(levels[0], Math.min(levels.at(-1), level));
}

/** Return unique cell IDs covering trusted TileLayer bounds [[west, south], [east, north]]. */
export function generateCells(grid, bounds, level) {
  if (!GRID_LEVELS[grid]?.levels.includes(level)) throw new Error('Select a valid grid level.');
  const [[west, south], [east, north]] = bounds;
  const cells = new Set();
  // Spherical polygon queries need small patches even for TileLayer's world tile.
  for (let left = west; left < east; left += 90) {
    addBoundsCells(
      grid,
      [
        [left, south],
        [Math.min(left + 90, east), north]
      ],
      level,
      cells
    );
  }
  return [...cells];
}

function addBoundsCells(grid, bounds, level, cells) {
  const [[west, south], [east, north]] = bounds;
  if (grid === 'a5' && north - south > 45) {
    // Keep spherical query patches within one hemisphere, even for the world tile.
    for (let latitude = south; latitude < north; latitude += 45) {
      addBoundsCells(
        grid,
        [
          [west, latitude],
          [east, Math.min(north, latitude + 45)]
        ],
        level,
        cells
      );
    }
    return;
  }
  if (grid === 'h3' || grid === 'a5') {
    // Densify latitude parallels because A5 polygon edges follow great circles.
    const segments = Math.max(1, Math.ceil((east - west) / 2));
    const ring = [];
    for (let i = 0; i <= segments; i++) ring.push([west + ((east - west) * i) / segments, south]);
    for (let i = segments; i >= 0; i--) ring.push([west + ((east - west) * i) / segments, north]);
    const ids =
      grid === 'h3'
        ? polygonToCellsExperimental(
            ring,
            level,
            POLYGON_TO_CELLS_FLAGS.containmentOverlapping,
            true
          )
        : Array.from(
            uncompact(a5PolygonToCells(ring, level, {containment: 'overlapping'}), level),
            u64ToHex
          );
    for (const id of ids) cells.add(id);
    return;
  }
  if (grid === 's2') {
    const visit = (index, depth) => {
      const token = getS2TokenFromIndex(index);
      const [[cellWest, cellSouth], [cellEast, cellNorth]] = S2Decoder.cellToBounds(token);
      const longitudeOverlap = [-360, 0, 360].some(
        shift => cellWest + shift <= east && cellEast + shift >= west
      );
      // At a pole every longitude identifies the same point. Include each cell
      // touching it rather than pruning by that cell's longitude quadrant.
      const poleOverlap =
        (north === 90 && cellNorth === 90) || (south === -90 && cellSouth === -90);
      if ((!longitudeOverlap && !poleOverlap) || cellSouth > north || cellNorth < south) return;
      if (depth === level) {
        cells.add(token);
      } else {
        for (let child = 0; child < 4; child++) visit(getS2ChildIndex(index, child), depth + 1);
      }
    };
    // Conservative spherical bounds prune entire subtrees, including polar faces.
    for (let face = 0; face < 6; face++) visit((BigInt(face) << 61n) | (1n << 60n), 0);
    return;
  }
  if (grid === 'quadkey') {
    const first = getTileCoordinates(west, north, level);
    const last = getTileCoordinates(east, south, level);
    for (let y = first.y; y <= last.y; y++) {
      for (let x = first.x; x <= Math.min(first.size - 1, last.x); x++)
        cells.add(encodeQuadkey(x, y, level));
    }
    return;
  }
  let width;
  let height;
  if (grid === 'geohash') {
    width = 360 / 2 ** Math.ceil((level * 5) / 2);
    height = 180 / 2 ** Math.floor((level * 5) / 2);
  } else {
    const area = plusCode.decode(plusCode.encode(0, 0, level));
    width = area.longitudeHi - area.longitudeLo;
    height = area.latitudeHi - area.latitudeLo;
  }
  const minX = Math.floor((west + 180) / width);
  const maxX = Math.min(Math.ceil(360 / width) - 1, Math.floor((east + 180) / width));
  const minY = Math.floor((south + 90) / height);
  const maxY = Math.min(Math.ceil(180 / height) - 1, Math.floor((north + 90) / height));
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      cells.add(getCellId(grid, [-180 + (x + 0.5) * width, -90 + (y + 0.5) * height], level));
    }
  }
}

function s2Token(cell) {
  return getS2TokenFromIndex(getS2IndexFromCell(cell));
}

function encodeGeohash(longitude, latitude, level) {
  const bounds = [
    [-180, 180],
    [-90, 90]
  ];
  const coordinate = [longitude, latitude];
  let token = '';
  let value = 0;
  for (let bit = 0; bit < level * 5; bit++) {
    const axis = bit % 2;
    const midpoint = (bounds[axis][0] + bounds[axis][1]) / 2;
    const upper = coordinate[axis] >= midpoint;
    value = value * 2 + Number(upper);
    bounds[axis][upper ? 0 : 1] = midpoint;
    if (bit % 5 === 4) {
      token += BASE32[value];
      value = 0;
    }
  }
  return token;
}

function getTileCoordinates(longitude, latitude, level) {
  const size = 2 ** level;
  const radians = (latitude * Math.PI) / 180;
  const x = Math.floor(((longitude + 180) / 360) * size);
  // Roundoff at Mercator's end rows can project valid tile edges just outside the grid.
  const y = Math.max(
    0,
    Math.min(size - 1, Math.floor(((1 - Math.asinh(Math.tan(radians)) / Math.PI) / 2) * size))
  );
  return {x, y, size};
}

function encodeQuadkey(x, y, level) {
  let token = '';
  for (let bit = level - 1; bit >= 0; bit--) {
    token += String((Math.floor(x / 2 ** bit) % 2) + 2 * (Math.floor(y / 2 ** bit) % 2));
  }
  return token;
}
