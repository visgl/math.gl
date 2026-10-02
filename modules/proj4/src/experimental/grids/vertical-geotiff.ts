// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Original adapter for PROJ's Geodetic TIFF Grid specification, not a proj4js/PROJ fork.
// Decoding is caller-owned; no TIFF library is imported at runtime.
import {createVerticalGrid} from './vertical';
import type {VerticalGrid} from './types';

type Metadata = Record<string, unknown> | null;
type DirectoryTag = 'ModelPixelScale' | 'ModelTiepoint' | 'ModelTransformation' | 'NewSubfileType';
/** Structural subset of geotiff.js v2/v3. Metadata may be synchronous or asynchronous. */
export type VerticalGridGeoTIFFImage = {
  getWidth(): number;
  getHeight(): number;
  getGeoKeys(): Record<string, unknown> | null;
  getGDALMetadata(sample?: number | null): Metadata | Promise<Metadata>;
  getGDALNoData?(): number | null;
  fileDirectory: Partial<Record<DirectoryTag, unknown>> | {getValue(name: DirectoryTag): unknown};
  readRasters(options: {
    samples: number[];
    interleave: false;
  }): Promise<ArrayLike<number | ArrayLike<number>>>;
};
export type VerticalGridGeoTIFF = {
  getImageCount(): Promise<number>;
  getImage(index: number): Promise<VerticalGridGeoTIFFImage>;
};

/** Plain decoded raster input, structurally compatible with loaders.gl GeoTIFFRasterData. */
export type VerticalGridGeoTIFFData = {
  /** Images in original file order, with parents before nested children. */
  images: readonly {
    /** Original dimensions in pixels. */
    width: number;
    /** Original dimensions in pixels. */
    height: number;
    /** Raw bands; original band zero must be present. */
    bands: readonly {
      /** Original zero-based sample index, retained when selecting bands. */
      index: number;
      /** Native, unscaled samples in TIFF row order. */
      data: ArrayLike<number>;
      /** Per-band GDAL metadata. */
      metadata: Metadata;
    }[];
    /** Decoded CRS and pixel-registration GeoKeys. */
    geoKeys: Metadata;
    /** Image-level GDAL metadata. */
    metadata: Metadata;
    /** Declared nodata value, before scale/offset. */
    noData: number | null;
    /** Original geometry and image-kind tags. */
    fileDirectory: Partial<Record<DirectoryTag, unknown>>;
  }[];
};

/** Adapts plain numeric rasters without importing or retaining a TIFF decoder. */
function getRasterImage(data: VerticalGridGeoTIFFData, index: number): VerticalGridGeoTIFFImage {
  const image = data.images[index];
  const band = image.bands.find(candidate => candidate.index === 0);
  if (!band) throw new Error('Vertical GeoTIFF requires original band zero');
  return {
    getWidth: () => image.width,
    getHeight: () => image.height,
    getGeoKeys: () => image.geoKeys,
    getGDALMetadata: sample => (sample === 0 ? band.metadata : image.metadata),
    getGDALNoData: () => image.noData,
    fileDirectory: image.fileDirectory,
    readRasters: async () => [band.data]
  };
}

function number(value: unknown, fallback: number): number {
  if (value === undefined) return fallback;
  if (
    (typeof value !== 'number' && typeof value !== 'string') ||
    (typeof value === 'string' && !value.trim()) ||
    !Number.isFinite(Number(value))
  )
    throw new Error('Invalid vertical GeoTIFF scale or offset');
  return Number(value);
}
function vector(value: unknown, length: number): number[] {
  if (!value || typeof value !== 'object' || !('length' in value) || value.length !== length)
    throw new Error('Vertical GeoTIFF requires one tiepoint and pixel scale');
  const result = Array.from(value as ArrayLike<number>);
  if (!result.every(Number.isFinite)) throw new Error('Invalid vertical GeoTIFF geometry');
  return result;
}

/** Prepare metre geoid undulations from geographic, north-up PROJ Geodetic TIFF grids.
 * The first band must declare geoid_undulation; dataset TYPE must be
 * VERTICAL_OFFSET_GEOGRAPHIC_TO_VERTICAL. PixelIsPoint and PixelIsArea are supported.
 * Later nested images take precedence. Overviews, ambiguous overlaps, rotations,
 * non-metre bands and other operation types are rejected rather than inferred.
 */
export async function loadVerticalGeoTIFFGrid(
  tiff: VerticalGridGeoTIFF | VerticalGridGeoTIFFData
): Promise<VerticalGrid> {
  const count = 'images' in tiff ? tiff.images.length : await tiff.getImageCount();
  if (!Number.isSafeInteger(count) || count < 1)
    throw new Error('Vertical GeoTIFF requires at least one image');
  const prepared: {
    grid: VerticalGrid;
    west: number;
    south: number;
    east: number;
    north: number;
    dx: number;
    dy: number;
  }[] = [];
  for (let n = 0; n < count; n++) {
    const image = 'images' in tiff ? getRasterImage(tiff, n) : await tiff.getImage(n);
    const directory = image.fileDirectory;
    const tag = (name: DirectoryTag) =>
      'getValue' in directory ? directory.getValue(name) : directory[name];
    if (tag('NewSubfileType') !== undefined && tag('NewSubfileType') !== 0)
      throw new Error('Vertical GeoTIFF overviews and masks are unsupported');
    if (tag('ModelTransformation') !== undefined)
      throw new Error('Vertical GeoTIFF requires axis-aligned tiepoint/scale geometry');
    const keys = image.getGeoKeys();
    if (
      keys?.['GTModelTypeGeoKey'] !== 2 ||
      (keys['GeogAngularUnitsGeoKey'] !== undefined && keys['GeogAngularUnitsGeoKey'] !== 9102)
    )
      throw new Error('Vertical GeoTIFF requires a geographic degree grid');
    if (
      (keys['GeogPrimeMeridianGeoKey'] !== undefined && keys['GeogPrimeMeridianGeoKey'] !== 8901) ||
      (keys['GeogPrimeMeridianLongGeoKey'] !== undefined &&
        keys['GeogPrimeMeridianLongGeoKey'] !== 0)
    )
      throw new Error('Vertical GeoTIFF requires Greenwich longitudes');
    const rasterType = keys['GTRasterTypeGeoKey'];
    if (rasterType !== 1 && rasterType !== 2)
      throw new Error('Vertical GeoTIFF requires explicit PixelIsPoint or PixelIsArea');
    const metadata = await image.getGDALMetadata();
    const band = await image.getGDALMetadata(0);
    if (
      metadata?.['TYPE'] !== 'VERTICAL_OFFSET_GEOGRAPHIC_TO_VERTICAL' ||
      band?.['DESCRIPTION'] !== 'geoid_undulation'
    )
      throw new Error('Vertical GeoTIFF requires a geographic-to-vertical geoid_undulation band');
    if (band['UNITTYPE'] !== undefined && band['UNITTYPE'] !== 'metre')
      throw new Error('Vertical GeoTIFF geoid undulations must be in metres');
    if (
      metadata['interpolation_method'] !== undefined &&
      metadata['interpolation_method'] !== 'bilinear'
    )
      throw new Error('Vertical GeoTIFF supports only bilinear interpolation');
    const scale = number(band['SCALE'], 1),
      offset = number(band['OFFSET'], 0);
    const [dx, dy] = vector(tag('ModelPixelScale'), 3);
    const [i, j, k, x, y, z] = vector(tag('ModelTiepoint'), 6);
    const width = image.getWidth(),
      height = image.getHeight();
    if (
      !(dx > 0 && dy > 0) ||
      k !== 0 ||
      z !== 0 ||
      ![width, height].every(v => Number.isSafeInteger(v) && v >= 2)
    )
      throw new Error('Invalid vertical GeoTIFF geometry or dimensions');
    const half = rasterType === 1 ? 0.5 : 0;
    const west = x + (half - i) * dx;
    const north = y - (half - j) * dy;
    const south = north - (height - 1) * dy,
      east = west + (width - 1) * dx;
    if (
      ![west, south, east, north].every(Number.isFinite) ||
      !(east > west && north > south) ||
      east - west > 360 ||
      south < -90 ||
      north > 90 ||
      !Number.isSafeInteger(width * height)
    )
      throw new Error('Invalid vertical GeoTIFF geographic extent');
    // Require ordered nested or disjoint images, so TIFF ordering cannot silently
    // replace a fine child with a coarse parent or an ambiguous overlapping grid.
    for (const other of prepared) {
      const overlaps =
        west < other.east && east > other.west && south < other.north && north > other.south;
      if (
        overlaps &&
        !(
          west >= other.west &&
          east <= other.east &&
          south >= other.south &&
          north <= other.north &&
          dx <= other.dx &&
          dy <= other.dy
        )
      )
        throw new Error(
          'Vertical GeoTIFF images must be ordered parent before nested child or disjoint'
        );
    }
    const rasters = await image.readRasters({samples: [0], interleave: false});
    const values = rasters[0];
    if (!values || typeof values === 'number' || values.length !== width * height)
      throw new Error('Vertical GeoTIFF requires a complete non-interleaved height band');
    const declaredNoData = image.getGDALNoData?.();
    // GDAL_NODATA is text; compare it in the decoded band's numeric precision.
    const nodata =
      values instanceof Float32Array && typeof declaredNoData === 'number'
        ? Math.fround(declaredNoData)
        : declaredNoData;
    const offsets = new Float64Array(width * height);
    for (let row = 0; row < height; row++)
      for (let col = 0; col < width; col++) {
        const raw = values[row * width + col];
        const value = raw === nodata || !Number.isFinite(raw) ? NaN : raw * scale + offset;
        if (Number.isFinite(raw) && raw !== nodata && !Number.isFinite(value))
          throw new Error('Vertical GeoTIFF scale/offset produced a non-finite height');
        offsets[(height - 1 - row) * width + col] = value;
      }
    prepared.push({
      grid: createVerticalGrid({
        origin: [west, south],
        step: [dx, dy],
        size: [width, height],
        offsets
      }),
      west,
      south,
      east,
      north,
      dx,
      dy
    });
  }
  return Object.freeze({
    getOffset(longitude: number, latitude: number): number | undefined {
      for (let i = prepared.length - 1; i >= 0; i--) {
        const value = prepared[i].grid.getOffset(longitude, latitude);
        if (value !== undefined) return value;
      }
      return undefined;
    }
  });
}
