// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Original adapter for PROJ's GTG conventions; no upstream decoder code is copied.
import {prepareScalarGeoTIFFGrids} from './scalar-geotiff';
import type {VerticalGrid} from './types';
import type {VerticalGridGeoTIFF, VerticalGridGeoTIFFData} from './scalar-geotiff';
export type {
  VerticalGridGeoTIFF,
  VerticalGridGeoTIFFImage,
  VerticalGridGeoTIFFData
} from './scalar-geotiff';

/** Prepare owned geoid grids; later nested images take precedence with nodata fallback. */
export async function loadVerticalGeoTIFFGrid(
  tiff: VerticalGridGeoTIFF | VerticalGridGeoTIFFData
): Promise<VerticalGrid> {
  const grids = await prepareScalarGeoTIFFGrids(tiff);
  return Object.freeze({
    getOffset(longitude: number, latitude: number): number | undefined {
      for (let i = grids.length - 1; i >= 0; i--) {
        const value = grids[i].getOffset(longitude, latitude);
        if (value !== undefined) return value;
      }
      return undefined;
    }
  });
}
