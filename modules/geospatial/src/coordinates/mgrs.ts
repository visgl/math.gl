// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) Charles Karney (2008-2022)
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: MGRS alphabets and UTM row/band compatibility adapted from GeographicLib 2.7 MGRS.cpp (MIT). Original bounded-precision codec; see ../../GEOGRAPHICLIB-LICENSE.txt.
import {projectGrid, unprojectGrid, type GridCoordinate} from './grid';
const COLUMNS = ['ABCDEFGH', 'JKLMNPQR', 'STUVWXYZ'],
  ROWS = 'ABCDEFGHJKLMNPQRSTUV',
  BANDS = 'CDEFGHJKLMNPQRSTUVWX';
const UPS_COLUMNS = ['JKLPQRSTUXYZ', 'ABCFGHJKLPQR', 'RSTUXYZ', 'ABCFGHJ'],
  UPS_ROWS = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'ABCDEFGHJKLMNP'],
  UPS_BANDS = 'ABYZ',
  TILE = 100000;
function utmRow(band: number, column: number, row: number): number {
  const c = (100 * (8 * band + 4)) / 90,
    north = band >= 0;
  const min = band > -10 ? Math.floor(c - 4.3 - (north ? 0.1 : 0)) : -90,
    max = band < 9 ? Math.floor(c + 4.4 - (north ? 0.1 : 0)) : 94;
  const base = Math.trunc((min + max) / 2) - 10;
  row = ((((row - base + 100) % 20) + 20) % 20) + base;
  if (row < min || row > max) {
    const b = band >= 0 ? band : -band - 1,
      r = row >= 0 ? row : -row - 1,
      col = column < 4 ? column : 7 - column;
    if (
      !(
        (r === 70 && b === 8 && col >= 2) ||
        (r === 71 && b === 7 && col <= 2) ||
        (r === 79 && b === 9 && col >= 1) ||
        (r === 80 && b === 8 && col <= 1)
      )
    )
      throw new RangeError('MGRS square does not intersect its latitude band');
  }
  return row;
}
/** WGS84 MGRS through one-metre precision; truncates, rather than rounds, cells. */
export function formatMGRS(latitude: number, longitude: number, precision = 5): string {
  if (!Number.isInteger(precision) || precision < 0 || precision > 5)
    throw new RangeError('MGRS precision must be in [0,5]');
  const grid = projectGrid(latitude, longitude),
    {zone, north, easting: x} = grid;
  let y = grid.northing;
  if (zone && !north && y === 1e7) y -= 2 ** -28;
  const column = Math.floor(x / TILE),
    row = Math.floor(y / TILE);
  let prefix: string;
  if (zone) {
    const band =
      Math.abs(latitude) < 2 ** -46
        ? north
          ? 0
          : -1
        : Math.max(-10, Math.min(9, Math.floor((Math.floor(latitude) + 80) / 8) - 10));
    if (column < 1 || column > 8 || utmRow(band, column - 1, row % 20) !== row - (north ? 0 : 100))
      throw new RangeError('Grid outside MGRS domain');
    prefix =
      String(zone).padStart(2, '0') +
      BANDS[band + 10] +
      COLUMNS[(zone - 1) % 3][column - 1] +
      ROWS[(row + ((zone - 1) % 2 ? 5 : 0)) % 20];
  } else {
    const band = (north ? 2 : 0) + (column >= 20 ? 1 : 0),
      origin = north ? 13 : 8;
    const col = column - (column >= 20 ? 20 : origin),
      r = row - origin;
    if (col < 0 || col >= UPS_COLUMNS[band].length || r < 0 || r >= UPS_ROWS[Number(north)].length)
      throw new RangeError('Grid outside MGRS domain');
    prefix = UPS_BANDS[band] + UPS_COLUMNS[band][col] + UPS_ROWS[Number(north)][r];
  }
  const unit = 10 ** (5 - precision);
  return (
    prefix +
    (precision
      ? String(Math.floor((x - column * TILE) / unit)).padStart(precision, '0') +
        String(Math.floor((y - row * TILE) / unit)).padStart(precision, '0')
      : '')
  );
}
export type MGRSCoordinate = GridCoordinate & {
  latitude: number;
  longitude: number;
  precision: number;
  resolution: number;
};
export function parseMGRS(text: string, options: {center?: boolean} = {}): MGRSCoordinate {
  if (typeof text !== 'string' || text.length > 128) throw new RangeError('Invalid MGRS text');
  const match = /^(\d{1,2})?([C-HJ-NP-XABYZ])([A-HJ-NP-Z])([A-HJ-NP-Z])(\d*)$/.exec(
    text.replace(/\s/g, '').toUpperCase()
  );
  if (!match || match[5].length % 2 || match[5].length > 10)
    throw new RangeError('Expected a complete MGRS cell with 0–5 digit pairs');
  const zone = match[1] ? Number(match[1]) : 0,
    bandText = match[2],
    precision = match[5].length / 2;
  let north: boolean, column: number, row: number;
  if (match[1]) {
    if (zone < 1 || zone > 60) throw new RangeError('Invalid MGRS zone');
    const band = BANDS.indexOf(bandText) - 10;
    if (band < -10) throw new RangeError('Invalid UTM band');
    north = band >= 0;
    column = COLUMNS[(zone - 1) % 3].indexOf(match[3]);
    row = ROWS.indexOf(match[4]);
    if (column < 0 || row < 0) throw new RangeError('Invalid MGRS square');
    row = utmRow(band, column, (row + ((zone - 1) % 2 ? 15 : 0)) % 20) + (north ? 0 : 100);
    column++;
  } else {
    const band = UPS_BANDS.indexOf(bandText);
    if (band < 0) throw new RangeError('Invalid UPS band');
    north = band >= 2;
    column = UPS_COLUMNS[band].indexOf(match[3]);
    row = UPS_ROWS[Number(north)].indexOf(match[4]);
    if (column < 0 || row < 0) throw new RangeError('Invalid UPS square');
    column += band % 2 ? 20 : north ? 13 : 8;
    row += north ? 13 : 8;
  }
  const resolution = 10 ** (5 - precision),
    center = options.center === false ? 0 : 0.5;
  const grid = {
    zone,
    north,
    easting: column * TILE + (Number(match[5].slice(0, precision) || 0) + center) * resolution,
    northing: row * TILE + (Number(match[5].slice(precision) || 0) + center) * resolution
  };
  return {...grid, ...unprojectGrid(grid), precision, resolution};
}
