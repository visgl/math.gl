// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
const ROOT = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best';
export const DAY_TILES = `${ROOT}/BlueMarble_ShadedRelief_Bathymetry/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg`;
export const NIGHT_TILES = `${ROOT}/VIIRS_Black_Marble/default/2016-01-01/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png`;

/** A tile is ready only when both textures are available. TileLayer caches the pair. */
export async function loadImageryTile({index: {x, y, z}, signal}) {
  const results = await Promise.allSettled(
    [DAY_TILES, NIGHT_TILES].map(async template => {
      const url = template.replace('{z}', z).replace('{y}', y).replace('{x}', x);
      const response = await fetch(url, {signal});
      if (!response.ok) throw new Error(`Imagery HTTP ${response.status}`);
      return createImageBitmap(await response.blob());
    })
  );
  const failure = results.find(result => result.status === 'rejected');
  if (failure || signal?.aborted) {
    for (const result of results) {
      if (result.status === 'fulfilled') result.value.close();
    }
    throw failure?.reason || new DOMException('Tile request aborted', 'AbortError');
  }
  return {day: results[0].value, night: results[1].value};
}

export function releaseImageryTile(tile) {
  tile.content?.day.close();
  tile.content?.night.close();
}
