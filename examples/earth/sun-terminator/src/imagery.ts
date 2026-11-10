// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
import {DAY_TILES, NIGHT_TILES} from './constants.ts';

/** A tile is ready only when both textures are available. TileLayer caches the pair. */
export async function loadImageryTile({
  index: {x, y, z},
  signal
}: {
  index: {x: number; y: number; z: number};
  signal?: AbortSignal;
}): Promise<ImageryTile> {
  const results = await Promise.allSettled(
    [DAY_TILES, NIGHT_TILES].map(async template => {
      const url = template
        .replace('{z}', String(z))
        .replace('{y}', String(y))
        .replace('{x}', String(x));
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
  const [day, night] = results;
  if (day.status !== 'fulfilled' || night.status !== 'fulfilled')
    throw new Error('Incomplete imagery pair');
  return {day: day.value, night: night.value};
}

export function releaseImageryTile(tile) {
  tile.content?.day.close();
  tile.content?.night.close();
}

export type ImageryTile = {day: ImageBitmap; night: ImageBitmap};
