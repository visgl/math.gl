// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

export const BLUE_MARBLE_CREDIT_URL =
  'https://science.nasa.gov/earth/earth-observatory/blue-marble/';

/** Geographic images preserve latitude spacing, including the poles. */
export function blueMarbleUrl(bounds, width = 512, height = 512) {
  const parameters = new URLSearchParams({
    SERVICE: 'WMS',
    REQUEST: 'GetMap',
    VERSION: '1.1.1',
    LAYERS: 'BlueMarble_ShadedRelief_Bathymetry',
    STYLES: '',
    FORMAT: 'image/jpeg',
    SRS: 'EPSG:4326',
    BBOX: bounds.join(','),
    WIDTH: String(width),
    HEIGHT: String(height)
  });
  return `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?${parameters}`;
}

export const BLUE_MARBLE_WORLD_URL = blueMarbleUrl([-180, -90, 180, 90], 1024, 512);
// Small geographic tiles keep GlobeView tessellation well behaved at the seams.
export const BLUE_MARBLE_TILES = [];
for (let south = -90; south < 90; south += 90) {
  for (let west = -180; west < 180; west += 90) {
    const bounds = [west, south, west + 90, south + 90];
    BLUE_MARBLE_TILES.push({bounds, image: blueMarbleUrl(bounds)});
  }
}
