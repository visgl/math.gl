// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// GeoTIFF node orientation directly adapted from proj4js 2.22.0 lib/nadgrid.js.
// Copyright (c) 2014, proj4js authors. See ../../../PROJ4-LICENSE.md.
// Modified for explicit async loading, validation and nodata handling; no geotiff runtime import.
import {createDatumGrid} from './grid';
import type {DatumGrid, Subgrid} from './types';

/** Structural subset supported by geotiff.js v2/v3; callers own file/network decoding. */
export type DatumGridGeoTIFFImage = {
  getWidth(): number;
  getHeight(): number;
  getBoundingBox(): number[];
  fileDirectory:
    | {ModelPixelScale?: ArrayLike<number>}
    | {getValue(name: 'ModelPixelScale'): unknown};
  readRasters(): Promise<ArrayLike<number | ArrayLike<number>>>;
  getGDALNoData?(): number | null;
};
export type DatumGridGeoTIFF = {
  getImageCount(): Promise<number>;
  getImage(index: number): Promise<DatumGridGeoTIFFImage>;
};
/** Load horizontal latitude/longitude offset bands in arcseconds on a geographic degree grid.
 * Images are tried last-to-first, matching proj4js's child-before-parent GeoTIFF ordering.
 */
export async function loadGeoTIFFGrid(tiff: DatumGridGeoTIFF): Promise<DatumGrid> {
  const count = await tiff.getImageCount();
  if (!Number.isSafeInteger(count) || count < 1)
    throw new Error('GeoTIFF requires at least one image');
  const subgrids: Subgrid[] = [];
  for (let n = count - 1; n >= 0; n--) {
    const image = await tiff.getImage(n),
      width = image.getWidth(),
      height = image.getHeight();
    if (![width, height].every(v => Number.isSafeInteger(v) && v >= 2))
      throw new Error('Invalid GeoTIFF grid dimensions');
    const bbox = image.getBoundingBox();
    const directory = image.fileDirectory;
    const scale =
      'getValue' in directory ? directory.getValue('ModelPixelScale') : directory.ModelPixelScale;
    if (!scale || typeof scale !== 'object' || !('0' in scale) || !('1' in scale))
      throw new Error('GeoTIFF requires ModelPixelScale');
    const sx = Number(scale[0]),
      sy = Number(scale[1]);
    if (
      bbox.length !== 4 ||
      !bbox.every(Number.isFinite) ||
      !(sx > 0 && sy > 0 && Number.isFinite(sx) && Number.isFinite(sy))
    )
      throw new Error('Invalid GeoTIFF geographic grid geometry');
    const rasters = await image.readRasters(),
      latitude = rasters[0],
      longitude = rasters[1];
    if (
      !latitude ||
      !longitude ||
      typeof latitude === 'number' ||
      typeof longitude === 'number' ||
      latitude.length !== width * height ||
      longitude.length !== width * height
    )
      throw new Error('GeoTIFF requires latitude and longitude offset bands');
    const nodata = image.getGDALNoData?.();
    const shifts: [number, number][] = [];
    for (let row = height - 1; row >= 0; row--)
      for (let col = width - 1; col >= 0; col--) {
        const index = row * width + col,
          lat = latitude[index],
          lon = longitude[index];
        shifts.push(
          lat === nodata || lon === nodata || !Number.isFinite(lat) || !Number.isFinite(lon)
            ? [NaN, NaN]
            : [(-lon * Math.PI) / 648000, (lat * Math.PI) / 648000]
        );
      }
    subgrids.push({
      origin: [
        (-(bbox[0] + (width - 1) * sx) * Math.PI) / 180,
        ((bbox[3] - (height - 1) * sy) * Math.PI) / 180
      ],
      step: [(sx * Math.PI) / 180, (sy * Math.PI) / 180],
      size: [width, height],
      shifts
    });
  }
  return createDatumGrid(subgrids);
}
