// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {
  Binary,
  Field,
  Float64,
  Null,
  Struct,
  Utf8,
  vectorFromArray,
  type Vector
} from 'apache-arrow';
import {parseWKB, writeWKB} from '@math.gl/arrow/wkb';
import type {ArrowTableFunction} from '../arrow/types';
import {
  RasterContext,
  rasterToWorld,
  worldToRaster,
  requireTransform,
  getRasterSRID as srid
} from './source';
import {
  rasterBand,
  rasterValue,
  rasterFootprint,
  rasterSummary,
  rasterArithmetic,
  rasterResample,
  rasterClip,
  requireSameCRS
} from './operations';
import type {RasterCRS, SyncRasterSource} from './types';

/** Arrow logical extension name; physical strings are not raster values. */
export const RASTER_EXTENSION_NAME = 'math.gl.raster';
/** Builds an opaque raster field. The context is supplied to the function library. */
export function createRasterField(name: string, nullable = true): Field {
  return new Field(
    name,
    new Utf8(),
    nullable,
    new Map([['ARROW:extension:name', RASTER_EXTENSION_NAME]])
  );
}
/** Registers row-aligned sources and creates a vector for use with createRasterField. */
export function createRasterVector(
  context: RasterContext,
  sources: readonly (SyncRasterSource | null)[]
): Vector<Utf8> {
  return vectorFromArray(
    sources.map(source => (source === null ? null : context.register(source))),
    new Utf8()
  );
}
/** Adds EWKB SRID metadata where the source has an EPSG identity. */
function footprintWKB(source: SyncRasterSource): Uint8Array {
  const bytes = writeWKB({
    type: 'Polygon',
    coordinates: rasterFootprint(source)
  });
  const code = srid(source.metadata.crs);
  if (code === null) return bytes;
  const result = new Uint8Array(bytes.length + 4),
    view = new DataView(result.buffer);
  result.set(bytes.subarray(0, 5));
  view.setUint32(1, 0x20000003, true);
  view.setUint32(5, code, true);
  result.set(bytes.subarray(5), 9);
  return result;
}
/** Options for a schema-bound geometry input, including its GeoArrow CRS metadata. */
export type RasterFunctionOptions = {
  /** Polygon WKB field; default accepts geoarrow.wkb and requires EWKB SRID or explicit clip CRS. */
  geometryField?: Field;
};
/** Creates synchronous typed RT_* declarations bound to a caller-owned raster context. */
export function createRasterFunctions(
  context: RasterContext,
  options: RasterFunctionOptions = {}
): ArrowTableFunction[] {
  const raster = createRasterField('raster'),
    number = new Field('number', new Float64(), true),
    text = new Field('text', new Utf8(), true);
  const geometry =
    options.geometryField ??
    new Field('geometry', new Binary(), true, new Map([['ARROW:extension:name', 'geoarrow.wkb']]));
  const outputGeometry = new Field(
    'geometry',
    new Binary(),
    true,
    new Map([['ARROW:extension:name', 'geoarrow.wkb']])
  );
  const functions: ArrowTableFunction[] = [];
  const add = (
    name: string,
    arguments_: Field[],
    result: Field,
    fn: (...args: any[]) => unknown
  ) => {
    const declaration: ArrowTableFunction = {
      name,
      prototypes: [
        {
          arguments: arguments_,
          result,
          evaluate(vectors, {length, activeRows, reportError, signal}) {
            const values: unknown[] = Array(length).fill(null);
            for (let row = 0; row < length; row++)
              if (activeRows[row]) {
                const args = vectors.map(vector => vector.get(row));
                if (args.some(arg => arg === null)) continue;
                try {
                  signal?.throwIfAborted();
                  values[row] = fn(...args, signal);
                } catch (error) {
                  if (reportError) reportError(row, error);
                  else throw error;
                }
              }
            return vectorFromArray(values, result.type);
          }
        }
      ]
    };
    functions.push(declaration);
  };
  const source = (handle: string) => context.resolve(handle);
  const metadata: Record<string, (s: SyncRasterSource) => unknown> = {
    RT_Width: s => s.metadata.width,
    RT_Height: s => s.metadata.height,
    RT_NumBands: s => s.metadata.bandCount,
    RT_SRID: s => srid(s.metadata.crs),
    RT_ScaleX: s => requireTransform(s.metadata)[0],
    RT_ScaleY: s => requireTransform(s.metadata)[4],
    RT_SkewX: s => requireTransform(s.metadata)[1],
    RT_SkewY: s => requireTransform(s.metadata)[3],
    RT_UpperLeftX: s => requireTransform(s.metadata)[2],
    RT_UpperLeftY: s => requireTransform(s.metadata)[5]
  };
  for (const [name, fn] of Object.entries(metadata))
    add(name, [raster], number, h => fn(source(h)));
  for (const name of ['RT_BandPixelType', 'RT_BandNoDataValue'])
    add(name, [raster, number], name === 'RT_BandPixelType' ? text : number, (h, b) => {
      const m = rasterBand(source(h), b - 1).metadata,
        info = m.bands?.[0];
      return name === 'RT_BandPixelType'
        ? (info?.dtype ?? m.dtype)
        : info?.noData === undefined
          ? (m.noData ?? null)
          : info.noData;
    });
  add('RT_Value', [raster, number, number, number], number, (h, b, x, y, signal) =>
    rasterValue(source(h), b - 1, x - 1, y - 1, signal)
  );
  for (const axis of ['X', 'Y']) {
    const i = axis === 'X' ? 0 : 1;
    add(
      `RT_RasterToWorldCoord${axis}`,
      [raster, number, number],
      number,
      (h, x, y) => rasterToWorld(source(h).metadata, x - 1, y - 1)[i]
    );
    add(
      `RT_WorldToRasterCoord${axis}`,
      [raster, number, number],
      number,
      (h, x, y) => Math.floor(worldToRaster(source(h).metadata, x, y)[i]!) + 1
    );
  }
  add('RT_ConvexHull', [raster], outputGeometry, h => footprintWKB(source(h)));
  const statistics = new Field(
    'statistics',
    new Struct(
      ['count', 'sum', 'mean', 'stddev', 'min', 'max'].map(
        name => new Field(name, new Float64(), true)
      )
    ),
    true
  );
  add('RT_SummaryStats', [raster, number], statistics, (h, b, signal) =>
    rasterSummary(source(h), b - 1, signal)
  );
  add('RT_Band', [raster, number], raster, (h, b) =>
    context.register(rasterBand(source(h), b - 1))
  );
  add('RT_Resample', [raster, raster], raster, (h, r) =>
    context.register(rasterResample(source(h), source(r)))
  );
  add('RT_Resample', [raster, raster, text], raster, (h, r, method) =>
    context.register(rasterResample(source(h), source(r), method))
  );
  for (const operation of ['add', 'subtract', 'multiply', 'divide'] as const) {
    const name = `RT_${operation[0]!.toUpperCase()}${operation.slice(1)}`;
    add(name, [raster, new Field('null', new Null(), true)], raster, () => null);
    add(name, [raster, raster], raster, (a, b) =>
      context.register(rasterArithmetic(source(a), source(b), operation))
    );
    add(name, [raster, number], raster, (a, b) =>
      context.register(rasterArithmetic(source(a), b, operation))
    );
  }
  const clip = (h: string, bytes: Uint8Array, crs?: RasterCRS) => {
    const parsed = parseWKB(bytes);
    if (parsed.geometry.type !== 'Polygon') throw new Error('RT_Clip requires a Polygon');
    const encoded = geometry.metadata.get('ARROW:extension:metadata');
    const fieldCRS = encoded ? JSON.parse(encoded).crs : undefined;
    const polygonCRS =
      crs ?? fieldCRS ?? (parsed.srid === undefined ? undefined : `EPSG:${parsed.srid}`);
    for (const declared of [
      crs,
      fieldCRS,
      parsed.srid === undefined ? undefined : `EPSG:${parsed.srid}`
    ]) {
      if (declared)
        requireSameCRS(
          {...source(h).metadata, crs: polygonCRS},
          {...source(h).metadata, crs: declared}
        );
    }
    if (!polygonCRS)
      throw new Error('RT_Clip requires geometry CRS metadata, EWKB SRID or explicit CRS');
    return context.register(
      rasterClip(source(h), {
        coordinates: parsed.geometry.coordinates,
        crs: polygonCRS
      })
    );
  };
  add('RT_Clip', [raster, geometry], raster, (h, bytes) => clip(h, bytes));
  add('RT_Clip', [raster, geometry, text], raster, (h, bytes, crs) => clip(h, bytes, crs));
  return functions;
}
