// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {RasterMetadata, RasterPolygon, RasterSummary, SyncRasterSource} from './types';
import {
  getRasterSRID,
  immutableMetadata,
  rasterSample,
  rasterToWorld,
  requireTransform,
  validateWindow,
  windowMetadata,
  worldToRaster
} from './source';

/** Canonical structural CRS comparison; does not resolve aliases or reproject. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return JSON.stringify(value.map(canonical));
  if (value && typeof value === 'object' && !Array.isArray(value))
    return JSON.stringify(
      Object.keys(value)
        .sort()
        .map(key => [key, canonical((value as Record<string, unknown>)[key])])
    );
  return JSON.stringify(value);
}
/** Requires known, equal CRS definitions. */
export function requireSameCRS(a: Readonly<RasterMetadata>, b: Readonly<RasterMetadata>): void {
  const aSRID = getRasterSRID(a.crs),
    bSRID = getRasterSRID(b.crs);
  if (
    !a.crs ||
    !b.crs ||
    (canonical(a.crs) !== canonical(b.crs) && !(aSRID !== null && aSRID === bSRID))
  )
    throw new Error('Raster operations require matching known CRSs');
}
/** Zero-based sample-center offset in native grid coordinates. */
function center(metadata: Readonly<RasterMetadata>): number {
  return metadata.pixelRegistration === 'point' ? 0 : 0.5;
}
/** Lazy single-band view; the source retains ownership. */
export function rasterBand(source: SyncRasterSource, band: number): SyncRasterSource {
  validateWindow(source.metadata, {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    bands: [band]
  });
  const metadata = immutableMetadata(
    windowMetadata(
      source.metadata,
      {
        x: 0,
        y: 0,
        width: source.metadata.width,
        height: source.metadata.height
      },
      [band]
    )
  );
  return {
    metadata,
    readWindow(window) {
      validateWindow(metadata, window);
      return source.readWindow({...window, bands: [band]});
    }
  };
}
/** Reads one raw value with zero-based indices. Out-of-grid coordinates miss. */
export function rasterValue(
  source: SyncRasterSource,
  band: number,
  column: number,
  row: number,
  signal?: AbortSignal
): number | null {
  validateWindow(source.metadata, {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    bands: [band],
    signal
  });
  if (!Number.isInteger(column) || !Number.isInteger(row))
    throw new Error('Raster pixel indices must be integers');
  if (column < 0 || row < 0 || column >= source.metadata.width || row >= source.metadata.height)
    return null;
  return rasterSample(
    source.readWindow({
      x: column,
      y: row,
      width: 1,
      height: 1,
      bands: [band],
      signal
    }),
    0,
    0,
    0
  );
}
/** Raster footprint in world coordinates; point grids extend half a sample beyond their centers. */
export function rasterFootprint(source: SyncRasterSource): number[][][] {
  const m = source.metadata,
    offset = m.pixelRegistration === 'point' ? -0.5 : 0;
  if (!m.width || !m.height) return [];
  return [
    [
      [offset, offset],
      [m.width + offset, offset],
      [m.width + offset, m.height + offset],
      [offset, m.height + offset],
      [offset, offset]
    ].map(([x, y]) => rasterToWorld(m, x!, y!))
  ];
}
/** Exact Welford population statistics using bounded source windows. */
export function rasterSummary(
  source: SyncRasterSource,
  band: number,
  signal?: AbortSignal
): RasterSummary {
  validateWindow(source.metadata, {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    bands: [band],
    signal
  });
  let count = 0,
    sum = 0,
    mean = 0,
    m2 = 0,
    min = Infinity,
    max = -Infinity;
  for (let y = 0; y < source.metadata.height; y += 128)
    for (let x = 0; x < source.metadata.width; x += 128) {
      signal?.throwIfAborted();
      const data = source.readWindow({
        x,
        y,
        width: Math.min(128, source.metadata.width - x),
        height: Math.min(128, source.metadata.height - y),
        bands: [band],
        signal
      });
      for (let row = 0; row < data.height; row++)
        for (let column = 0; column < data.width; column++) {
          const value = rasterSample(data, column, row, 0);
          if (value === null) continue;
          count++;
          sum += value;
          const delta = value - mean;
          mean += delta / count;
          m2 += delta * (value - mean);
          min = Math.min(min, value);
          max = Math.max(max, value);
        }
    }
  return {
    count,
    sum,
    mean: count ? mean : null,
    stddev: count ? Math.sqrt(Math.max(0, m2 / count)) : null,
    min: count ? min : null,
    max: count ? max : null
  };
}
/** Builds Float64 lazy output using a per-window sampling closure. */
function derived(
  metadataInput: Readonly<RasterMetadata>,
  prepare: (
    window: import('./types').RasterWindow,
    bands: number[]
  ) => (column: number, row: number, band: number) => number | null
): SyncRasterSource {
  const metadata = immutableMetadata({
    ...metadataInput,
    dtype: 'float64',
    noData: null,
    bands: Array.from({length: metadataInput.bandCount}, (_, b) => ({
      ...metadataInput.bands?.[b],
      index: metadataInput.bands?.[b]?.index ?? b,
      dtype: 'float64',
      noData: null
    }))
  });
  return {
    metadata,
    readWindow(window) {
      const bands = validateWindow(metadata, window);
      if (window.width * window.height * bands.length * 9 > 256 * 1024 * 1024)
        throw new Error('Raster window exceeds decoded-byte budget');
      const sample = prepare(window, bands);
      const data = bands.map(() => new Float64Array(window.width * window.height));
      const validityMasks = bands.map((_, band) => ({
        band,
        width: window.width,
        height: window.height,
        data: new Uint8Array(window.width * window.height)
      }));
      for (let row = 0; row < window.height; row++) {
        window.signal?.throwIfAborted();
        for (let column = 0; column < window.width; column++)
          for (let b = 0; b < bands.length; b++) {
            const value = sample(column, row, b);
            if (value !== null && Number.isFinite(value)) {
              const i = row * window.width + column;
              data[b]![i] = value;
              validityMasks[b]!.data[i] = 1;
            }
          }
      }
      return {
        ...windowMetadata(metadata, window, bands),
        data,
        interleaved: false,
        validityMasks,
        ownership: 'owned'
      };
    }
  };
}
/** Aligned raw-domain arithmetic; outputs clear calibration and declared statistics. */
export function rasterArithmetic(
  left: SyncRasterSource,
  right: SyncRasterSource | number,
  operation: 'add' | 'subtract' | 'multiply' | 'divide'
): SyncRasterSource {
  if (typeof right !== 'number') {
    requireSameCRS(left.metadata, right.metadata);
    requireTransform(left.metadata);
    requireTransform(right.metadata);
    if (
      left.metadata.width !== right.metadata.width ||
      left.metadata.height !== right.metadata.height ||
      left.metadata.bandCount !== right.metadata.bandCount ||
      canonical(left.metadata.transform) !== canonical(right.metadata.transform) ||
      center(left.metadata) !== center(right.metadata)
    )
      throw new Error('Raster arithmetic requires identical grids and band counts');
  } else if (!Number.isFinite(right)) throw new Error('Raster arithmetic requires a finite scalar');
  const metadata = {
    ...left.metadata,
    bands: Array.from({length: left.metadata.bandCount}, (_, b) => ({
      index: left.metadata.bands?.[b]?.index ?? b,
      dtype: 'float64' as const
    }))
  };
  return derived(metadata, (window, bands) => {
    const a = left.readWindow({...window, bands});
    const b = typeof right === 'number' ? right : right.readWindow({...window, bands});
    return (x, y, band) => {
      const av = rasterSample(a, x, y, band),
        bv = typeof b === 'number' ? b : rasterSample(b, x, y, band);
      if (av === null || bv === null || (operation === 'divide' && bv === 0)) return null;
      return operation === 'add'
        ? av + bv
        : operation === 'subtract'
          ? av - bv
          : operation === 'multiply'
            ? av * bv
            : av / bv;
    };
  });
}
/** Same-CRS resampling onto a reference grid, reading bounded source tiles on demand. */
export function rasterResample(
  source: SyncRasterSource,
  reference: SyncRasterSource,
  method: 'nearest' | 'bilinear' = 'nearest'
): SyncRasterSource {
  if (method !== 'nearest' && method !== 'bilinear')
    throw new Error('Unsupported raster resampling method');
  requireSameCRS(source.metadata, reference.metadata);
  requireTransform(source.metadata);
  requireTransform(reference.metadata);
  const metadata = {
    ...source.metadata,
    width: reference.metadata.width,
    height: reference.metadata.height,
    transform: reference.metadata.transform,
    pixelRegistration: reference.metadata.pixelRegistration
  };
  return derived(metadata, (window, bands) => {
    // A small per-window LRU bounds decoded memory even for widely separated source samples.
    const cache = new Map<string, import('./types').NumericRasterData>();
    const read = (x: number, y: number, band: number): number | null => {
      if (x < 0 || y < 0 || x >= source.metadata.width || y >= source.metadata.height) return null;
      const tx = Math.floor(x / 64) * 64,
        ty = Math.floor(y / 64) * 64,
        key = `${tx}:${ty}:${band}`;
      let tile = cache.get(key);
      if (!tile) {
        tile = source.readWindow({
          x: tx,
          y: ty,
          width: Math.min(64, source.metadata.width - tx),
          height: Math.min(64, source.metadata.height - ty),
          bands: [bands[band]!],
          signal: window.signal
        });
        if (cache.size >= 16) cache.delete(cache.keys().next().value!);
        cache.set(key, tile);
      }
      return rasterSample(tile, x - tx, y - ty, 0);
    };
    return (x, y, band) => {
      const world = rasterToWorld(
        metadata,
        window.x + x + center(metadata),
        window.y + y + center(metadata)
      );
      const pixel = worldToRaster(source.metadata, ...world);
      const px = pixel[0] - center(source.metadata),
        py = pixel[1] - center(source.metadata);
      if (method === 'nearest' || source.metadata.bands?.[bands[band]!]?.categorical)
        return read(Math.floor(px + 0.5), Math.floor(py + 0.5), band);
      const left = Math.floor(px),
        top = Math.floor(py);
      let value = 0;
      for (let j = 0; j < 2; j++)
        for (let i = 0; i < 2; i++) {
          const weight = (i ? px - left : 1 - px + left) * (j ? py - top : 1 - py + top);
          if (weight === 0) continue;
          const v = read(left + i, top + j, band);
          if (v === null) return null;
          value += weight * v;
        }
      return value;
    };
  });
}
/** Boundary-inclusive point-in-ring predicate. */
function inRing(x: number, y: number, ring: readonly (readonly number[])[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [ax, ay] = ring[j]!,
      [bx, by] = ring[i]!;
    const cross = (x - ax!) * (by! - ay!) - (y - ay!) * (bx! - ax!);
    if (
      cross === 0 &&
      x >= Math.min(ax!, bx!) &&
      x <= Math.max(ax!, bx!) &&
      y >= Math.min(ay!, by!) &&
      y <= Math.max(ay!, by!)
    )
      return true;
    if (ay! > y !== by! > y && x < ((bx! - ax!) * (y - ay!)) / (by! - ay!) + ax!) inside = !inside;
  }
  return inside;
}
/** Crops to polygon grid bounds and masks sample centers outside the polygon or inside holes. */
export function rasterClip(source: SyncRasterSource, polygon: RasterPolygon): SyncRasterSource {
  requireSameCRS(source.metadata, {...source.metadata, crs: polygon.crs});
  requireTransform(source.metadata);
  if (
    polygon.coordinates.some(
      r =>
        r.length < 4 ||
        r.some(p => p.length < 2 || !Number.isFinite(p[0]) || !Number.isFinite(p[1])) ||
        r[0]![0] !== r[r.length - 1]![0] ||
        r[0]![1] !== r[r.length - 1]![1]
    )
  )
    throw new Error('Raster clip requires closed polygon rings');
  const rings = polygon.coordinates.map(ring => ring.map(point => [point[0]!, point[1]!]));
  const holes = rings.slice(1);
  const pixels = (rings[0] ?? []).map(p => worldToRaster(source.metadata, p[0]!, p[1]!));
  const offset = center(source.metadata);
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const [px, py] of pixels) {
    minX = Math.min(minX, px - offset);
    minY = Math.min(minY, py - offset);
    maxX = Math.max(maxX, px - offset);
    maxY = Math.max(maxY, py - offset);
  }
  // Include exactly the integer sample centers inside the polygon's bounding box.
  const x = Math.max(0, Math.min(source.metadata.width, Math.ceil(minX)));
  const y = Math.max(0, Math.min(source.metadata.height, Math.ceil(minY)));
  const width = Math.max(0, Math.min(source.metadata.width, Math.floor(maxX) + 1) - x);
  const height = Math.max(0, Math.min(source.metadata.height, Math.floor(maxY) + 1) - y);
  const bands = Array.from({length: source.metadata.bandCount}, (_, b) => b);
  const metadata = immutableMetadata(windowMetadata(source.metadata, {x, y, width, height}, bands));
  return {
    metadata,
    readWindow(window) {
      const selected = validateWindow(metadata, window);
      const data = source.readWindow({
        ...window,
        x: x + window.x,
        y: y + window.y,
        bands: selected
      });
      const mask = new Uint8Array(window.width * window.height);
      for (let row = 0; row < window.height; row++) {
        window.signal?.throwIfAborted();
        for (let column = 0; column < window.width; column++) {
          const [wx, wy] = rasterToWorld(
            metadata,
            window.x + column + offset,
            window.y + row + offset
          );
          if (inRing(wx, wy, rings[0]!) && !holes.some(r => inRing(wx, wy, r)))
            mask[row * window.width + column] = 1;
        }
      }
      return {
        ...data,
        validityMasks: [
          ...(data.validityMasks ?? []),
          {data: mask, width: window.width, height: window.height}
        ]
      };
    }
  };
}
