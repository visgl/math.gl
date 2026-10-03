// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Original adapter inspired by PROJ's Geodetic TIFF Grid specification, not a fork.
// Caller-owned TIFF decoding; no proj4js, PROJ or TIFF decoder code is copied here.
import {prepareScalarGeoTIFFGrids} from './scalar-geotiff';
import {velocityGridFromComponents} from './velocity';
import type {VelocityGrid} from './velocity';
import type {
  VerticalGridGeoTIFF,
  VerticalGridGeoTIFFData,
  VerticalGridGeoTIFFImage
} from './vertical-geotiff';
export type VelocityGridGeoTIFF = VerticalGridGeoTIFF;
export type VelocityGridGeoTIFFImage = VerticalGridGeoTIFFImage;
export type VelocityGridGeoTIFFData = VerticalGridGeoTIFFData;

/** Prepare geographic, north-up GTG VELOCITY images with explicit first-three ENU
 * bands in millimetres per year. Accuracy bands are ignored. No model/frame/epoch
 * inference. Decoded loaders.gl rasters and structural geotiff.js objects are accepted.
 */
export async function loadVelocityGeoTIFFGrid(
  tiff: VelocityGridGeoTIFF | VelocityGridGeoTIFFData
): Promise<VelocityGrid> {
  const count = 'images' in tiff ? tiff.images.length : await tiff.getImageCount();
  if (!Number.isSafeInteger(count) || count < 1)
    throw new Error('Velocity GeoTIFF requires images');
  const images: VerticalGridGeoTIFFImage[][] = [[], [], []];
  const names = ['east_velocity', 'north_velocity', 'up_velocity'];
  for (let index = 0; index < count; index++) {
    const raster = 'images' in tiff ? tiff.images[index] : undefined;
    const image = raster ? undefined : await (tiff as VelocityGridGeoTIFF).getImage(index);
    const metadata = raster ? raster.metadata : await image.getGDALMetadata();
    if (metadata?.['TYPE'] !== 'VELOCITY')
      throw new Error('Velocity GeoTIFF requires TYPE=VELOCITY');
    for (let component = 0; component < 3; component++) {
      const band = raster?.bands.find(b => b.index === component);
      if (raster && !band) throw new Error('Velocity GeoTIFF requires original ENU bands 0, 1, 2');
      const bandMetadata = raster ? band.metadata : await image.getGDALMetadata(component);
      if (
        bandMetadata?.['DESCRIPTION'] !== names[component] ||
        !['millimetres per year', 'mm/year'].includes(bandMetadata?.['UNITTYPE'] as string)
      )
        throw new Error(
          'Velocity GeoTIFF requires explicit ENU descriptions and millimetres per year'
        );
      // Reuse scalar geometry, scale/offset, nodata, ownership and hierarchy checks.
      // This internal view presents native millimetres as generic scalar values;
      // conversion to metres/year occurs only after all three components are sampled.
      images[component].push({
        getWidth: () => (raster ? raster.width : image.getWidth()),
        getHeight: () => (raster ? raster.height : image.getHeight()),
        getGeoKeys: () => (raster ? raster.geoKeys : image.getGeoKeys()),
        getGDALMetadata: sample =>
          sample === 0
            ? {...bandMetadata, DESCRIPTION: 'geoid_undulation', UNITTYPE: 'metre'}
            : {...metadata, TYPE: 'VERTICAL_OFFSET_GEOGRAPHIC_TO_VERTICAL'},
        getGDALNoData: () => (raster ? raster.noData : (image.getGDALNoData?.() ?? null)),
        fileDirectory: raster ? raster.fileDirectory : image.fileDirectory,
        readRasters: async () =>
          raster ? [band.data] : image.readRasters({samples: [component], interleave: false})
      });
    }
  }
  const bands = await Promise.all(
    images.map(list =>
      prepareScalarGeoTIFFGrids({
        getImageCount: async () => list.length,
        getImage: async index => list[index]
      })
    )
  );
  const grids = bands[0].map((east, index) =>
    velocityGridFromComponents(east, bands[1][index], bands[2][index], 0.001)
  );
  return Object.freeze({
    sample(longitude, latitude, output): boolean {
      for (let i = grids.length - 1; i >= 0; i--)
        if (grids[i].sample(longitude, latitude, output)) return true;
      return false;
    }
  });
}
