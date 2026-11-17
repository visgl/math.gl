// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {
  NumericRasterData,
  RasterMetadata,
  RasterWindow,
  SyncRasterSource,
  RasterAffineTransform,
  RasterCRS
} from './types';

/** Normalizes declared EPSG identities without a registry lookup or reprojection. */
export function getRasterSRID(crs: RasterCRS | undefined): number | null {
  let code: number | undefined;
  if (typeof crs === 'string') {
    const match = /^EPSG:(\d+)$/i.exec(crs);
    if (match) code = Number(match[1]);
  } else {
    const id = (crs as {id?: {authority?: string; code?: number | string}} | undefined)?.id;
    if (id?.authority?.toUpperCase() === 'EPSG') code = Number(id.code);
  }
  return Number.isSafeInteger(code) && code! > 0 && code! <= 0x7fffffff ? code! : null;
}

/** Finite invertible affine, required by spatial operations. */
export function requireTransform(metadata: Readonly<RasterMetadata>): RasterAffineTransform {
  const t = metadata.transform;
  if (
    !t ||
    t.length !== 6 ||
    !t.every(Number.isFinite) ||
    !Number.isFinite(t[0] * t[4] - t[1] * t[3]) ||
    t[0] * t[4] === t[1] * t[3]
  )
    throw new Error('Raster requires a finite invertible affine transform');
  return t;
}
/** Maps native grid coordinates (not sample-center indices) to world coordinates. */
export function rasterToWorld(
  metadata: Readonly<RasterMetadata>,
  column: number,
  row: number
): [number, number] {
  const [a, b, c, d, e, f] = requireTransform(metadata);
  return [a * column + b * row + c, d * column + e * row + f];
}
/** Maps world coordinates to fractional native grid coordinates. */
export function worldToRaster(
  metadata: Readonly<RasterMetadata>,
  x: number,
  y: number
): [number, number] {
  const [a, b, c, d, e, f] = requireTransform(metadata);
  const determinant = a * e - b * d;
  return [(e * (x - c) - b * (y - f)) / determinant, (a * (y - f) - d * (x - c)) / determinant];
}
/** Validates a bounded native-grid request before allocation. */
export function validateWindow(metadata: Readonly<RasterMetadata>, window: RasterWindow): number[] {
  window.signal?.throwIfAborted();
  const {x, y, width, height} = window;
  if (
    ![x, y, width, height].every(v => Number.isSafeInteger(v) && v >= 0) ||
    x + width > metadata.width ||
    y + height > metadata.height ||
    width * height > 16_000_000
  )
    throw new Error('Invalid or oversized raster window');
  const bands = window.bands ?? Array.from({length: metadata.bandCount}, (_, i) => i);
  if (
    !bands.length ||
    new Set(bands).size !== bands.length ||
    bands.some(b => !Number.isInteger(b) || b < 0 || b >= metadata.bandCount)
  )
    throw new Error('Invalid raster band');
  return bands;
}
/** Reads raw samples across loaders.gl layouts and validity conventions. */
export function rasterSample(
  data: NumericRasterData,
  x: number,
  y: number,
  band: number
): number | null {
  if (x < 0 || y < 0 || x >= data.width || y >= data.height) return null;
  const index = y * data.width + x;
  const value = Array.isArray(data.data)
    ? data.data[band]?.[index]
    : data.data[
        data.interleaved ? index * data.bandCount + band : band * data.width * data.height + index
      ];
  if (!Number.isFinite(value)) return null;
  const info = data.bands?.[band];
  const noData = info?.noData === undefined ? data.noData : info.noData;
  if (
    noData != null &&
    value === ((info?.dtype ?? data.dtype) === 'float32' ? Math.fround(noData) : noData)
  )
    return null;
  for (const mask of data.validityMasks ?? []) {
    if (mask.band !== undefined && mask.band !== band) continue;
    const offset =
      (mask.offset ?? 0) + y * (mask.rowStride ?? mask.width) + x * (mask.pixelStride ?? 1);
    if (x >= mask.width || y >= mask.height || !mask.data[offset]) return null;
  }
  return value!;
}
/** Produces local-grid metadata while preserving original band interpretation. */
export function windowMetadata(
  metadata: Readonly<RasterMetadata>,
  window: RasterWindow,
  bands: number[]
): RasterMetadata {
  const transform = metadata.transform && ([...metadata.transform] as RasterMetadata['transform']);
  if (transform) {
    transform[2] += transform[0] * window.x + transform[1] * window.y;
    transform[5] += transform[3] * window.x + transform[4] * window.y;
  }
  return {
    ...metadata,
    width: window.width,
    height: window.height,
    bandCount: bands.length,
    bands: bands.map(b => ({
      ...metadata.bands?.[b],
      index: metadata.bands?.[b]?.index ?? b,
      dtype:
        metadata.bands?.[b]?.dtype ?? (metadata.dtype as Exclude<RasterMetadata['dtype'], 'mixed'>)
    })),
    transform
  };
}
/** Freezes metadata separately from borrowed sample buffers. */
export function immutableMetadata(metadata: Readonly<RasterMetadata>): Readonly<RasterMetadata> {
  const copy = structuredClone(metadata);
  if (copy.transform) Object.freeze(copy.transform);
  if (copy.bands) {
    copy.bands.forEach(Object.freeze);
    Object.freeze(copy.bands);
  }
  const freeze = (value: object): void => {
    for (const child of Object.values(value)) if (child && typeof child === 'object') freeze(child);
    Object.freeze(value);
  };
  freeze(copy);
  return copy;
}
/** Exact output sample-and-mask allocation, including mixed band representations. */
export function rasterWindowByteLength(
  payload: NumericRasterData,
  pixels: number,
  bands: readonly number[]
): number {
  return (
    pixels *
    bands.reduce(
      (bytes, band) =>
        bytes +
        (Array.isArray(payload.data)
          ? payload.data[band]!.BYTES_PER_ELEMENT
          : payload.data.BYTES_PER_ELEMENT) +
        1,
      0
    )
  );
}

/** Wraps a resident loaders.gl-compatible payload; input buffers must remain stable. */
export function createRasterSourceFromData(payload: NumericRasterData): SyncRasterSource {
  if (
    ![payload.width, payload.height, payload.bandCount].every(Number.isSafeInteger) ||
    payload.width < 0 ||
    payload.height < 0 ||
    payload.bandCount < 1
  )
    throw new Error('Invalid raster dimensions');
  if (
    payload.dtype === 'mixed' &&
    (!Array.isArray(payload.data) || !payload.bands || payload.interleaved)
  )
    throw new Error('Mixed raster requires planar band arrays and metadata');
  if (payload.bands && payload.bands.length !== payload.bandCount)
    throw new Error('Raster band metadata count mismatch');
  const size = payload.width * payload.height;
  if (
    Array.isArray(payload.data)
      ? payload.data.length !== payload.bandCount || payload.data.some(a => a.length !== size)
      : payload.data.length !== size * payload.bandCount
  )
    throw new Error('Raster buffer size mismatch');
  const metadata = immutableMetadata({
    width: payload.width,
    height: payload.height,
    bandCount: payload.bandCount,
    dtype: payload.dtype,
    bands: payload.bands?.map(
      ({index, dtype, name, units, scale, offset, noData, categorical}) => ({
        index,
        dtype,
        name,
        units,
        scale,
        offset,
        noData,
        categorical
      })
    ),
    noData: payload.noData,
    transform: payload.transform,
    pixelRegistration: payload.pixelRegistration,
    crs: payload.crs
  });
  const masks = payload.validityMasks;
  const input = {
    ...payload,
    ...metadata,
    data: Array.isArray(payload.data) ? [...payload.data] : payload.data,
    validityMasks: masks?.map(mask => ({...mask}))
  };
  return {
    metadata,
    readWindow(window) {
      const bands = validateWindow(metadata, window);
      if (rasterWindowByteLength(input, window.width * window.height, bands) > 256 * 1024 * 1024)
        throw new Error('Raster window exceeds decoded-byte budget');
      const result = windowMetadata(metadata, window, bands);
      const validityMasks = bands.map((_, band) => ({
        band,
        width: window.width,
        height: window.height,
        data: new Uint8Array(window.width * window.height)
      }));
      const data = bands.map((band, outputBand) => {
        const original = Array.isArray(input.data) ? input.data[band]! : input.data;
        const values = new (original.constructor as {new (length: number): typeof original})(
          window.width * window.height
        );
        for (let row = 0; row < window.height; row++) {
          window.signal?.throwIfAborted();
          for (let column = 0; column < window.width; column++) {
            const value = rasterSample(input, window.x + column, window.y + row, band);
            const index = row * window.width + column;
            const inputIndex = (window.y + row) * input.width + window.x + column;
            values[index] = Array.isArray(input.data)
              ? original[inputIndex]!
              : original[
                  input.interleaved
                    ? inputIndex * input.bandCount + band
                    : band * input.width * input.height + inputIndex
                ]!;
            if (value !== null) {
              validityMasks[outputBand]!.data[index] = 1;
            }
          }
        }
        return values;
      });
      return {
        ...result,
        data,
        interleaved: false,
        validityMasks,
        ownership: 'owned'
      };
    }
  };
}
/** Caller-owned registry. Clearing invalidates handles without destroying caller sources. */
export class RasterContext {
  /** Unique namespace prevents cross-context handle collisions. */
  private readonly prefix = `raster:${globalThis.crypto.randomUUID()}:`;
  /** Retained input and derived sources. */
  private readonly sources = new Map<string, SyncRasterSource>();
  /** Monotonic sequence; never reuse cleared handles. */
  private sequence = 0;
  /** Registers a source and returns its opaque identity. */
  register(source: SyncRasterSource): string {
    const handle = this.prefix + this.sequence++;
    this.sources.set(handle, source);
    return handle;
  }
  /** Resolves an input or lazy result in its originating context. */
  resolve(handle: string): SyncRasterSource {
    const source = this.sources.get(handle);
    if (!source) throw new Error('Unknown raster handle or cleared raster context');
    return source;
  }
  /** Releases all retained sources; the context remains reusable. */
  clear(): void {
    this.sources.clear();
  }
}
