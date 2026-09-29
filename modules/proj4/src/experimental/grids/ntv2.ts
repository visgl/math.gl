// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// NTv2 decoding directly adapted from proj4js 2.22.0 lib/nadgrid.js.
// Copyright (c) 2014, proj4js authors. See ../../../PROJ4-LICENSE.md.
// Modified for explicit ownership, bounds/geometry validation and no global registration.
import {createDatumGrid} from './grid';
import type {DatumGrid, Subgrid} from './types';

export type NTv2GridOptions = {
  /** False selects compact 8-byte nodes; true (default) selects 16-byte nodes with accuracy fields. */
  includeErrorFields?: boolean;
};
const ARC_SECOND = Math.PI / 648000;
/** Decode an owned grid snapshot. The input buffer may be changed or released after this returns. */
export function parseNTv2Grid(data: ArrayBuffer, options: NTv2GridOptions = {}): DatumGrid {
  const view = new DataView(data);
  if (view.byteLength < 176) throw new Error('Truncated NTv2 overview header');
  const little = view.getInt32(8, true) === 11;
  if (!little && view.getInt32(8, false) !== 11)
    throw new Error('Invalid NTv2 header or byte order');
  const integer = (offset: number) => view.getInt32(offset, little);
  const real = (offset: number) => view.getFloat64(offset, little);
  const label = (offset: number) =>
    String.fromCharCode(...new Uint8Array(data, offset, 8))
      .replace(/\0/g, '')
      .trim();
  if (label(0) !== 'NUM_OREC' || integer(24) !== 11 || label(56) !== 'SECONDS')
    throw new Error('Unsupported NTv2 header or shift units');
  const count = integer(40),
    stride = options.includeErrorFields === false ? 8 : 16;
  if (count < 1 || count > Math.floor((view.byteLength - 176) / (176 + 4 * stride)))
    throw new Error('Invalid NTv2 subgrid count');
  let offset = 176;
  const subgrids: Subgrid[] = [];
  for (let n = 0; n < count; n++) {
    if (offset + 176 > view.byteLength) throw new Error('Truncated NTv2 subgrid header');
    const lowerLat = real(offset + 72),
      upperLat = real(offset + 88),
      lowerLon = real(offset + 104),
      upperLon = real(offset + 120);
    const latStep = real(offset + 136),
      lonStep = real(offset + 152),
      nodes = integer(offset + 168);
    const width = 1 + (upperLon - lowerLon) / lonStep,
      height = 1 + (upperLat - lowerLat) / latStep;
    if (
      ![width, height].every(
        v => Number.isFinite(v) && v >= 2 && Math.abs(v - Math.round(v)) < 1e-7
      ) ||
      !(lonStep > 0 && latStep > 0) ||
      nodes !== Math.round(width) * Math.round(height)
    )
      throw new Error('Invalid NTv2 subgrid dimensions');
    const start = offset + 176,
      end = start + nodes * stride;
    if (end > view.byteLength) throw new Error('Truncated NTv2 node records');
    const shifts: [number, number][] = [];
    for (let i = 0; i < nodes; i++)
      shifts.push([
        view.getFloat32(start + i * stride + 4, little) * ARC_SECOND,
        view.getFloat32(start + i * stride, little) * ARC_SECOND
      ]);
    subgrids.push({
      origin: [lowerLon * ARC_SECOND, lowerLat * ARC_SECOND],
      step: [lonStep * ARC_SECOND, latStep * ARC_SECOND],
      size: [Math.round(width), Math.round(height)],
      shifts
    });
    offset = end;
  }
  return createDatumGrid(subgrids);
}
