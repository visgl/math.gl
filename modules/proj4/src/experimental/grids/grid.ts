// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Bilinear interpolation and inverse grid equations directly adapted from proj4js 2.22.0
// lib/datum_transform.js. Copyright (c) 2014, proj4js authors. See ../../../PROJ4-LICENSE.md.
// Modified for immutable explicit state, inclusive edges, nodata and bounded two-axis convergence.
import type {DatumGrid, Subgrid} from './types';
import {wrapLongitude} from '../parameters';

const TOLERANCE = 1e-12;
type PreparedSubgrid = Subgrid & {maxShift: readonly [number, number]};

type Point = {x: number; y: number};
function interpolate(grid: Subgrid, x: number, y: number, output: Point, clamp = false): boolean {
  let col = (x - grid.origin[0]) / grid.step[0],
    row = (y - grid.origin[1]) / grid.step[1];
  const width = grid.size[0],
    height = grid.size[1];
  if (
    !clamp &&
    (col < -1e-10 || row < -1e-10 || col > width - 1 + 1e-10 || row > height - 1 + 1e-10)
  )
    return false;
  col = Math.max(0, Math.min(width - 1, col));
  row = Math.max(0, Math.min(height - 1, row));
  const i = Math.min(width - 2, Math.floor(col)),
    j = Math.min(height - 2, Math.floor(row));
  const u = col - i,
    v = row - j;
  let dx = 0,
    dy = 0;
  for (let n = 0; n < 4; n++) {
    const right = n % 2,
      upper = n > 1;
    const weight = (right ? u : 1 - u) * (upper ? v : 1 - v);
    if (weight === 0) continue;
    const node = grid.shifts[(j + (upper ? 1 : 0)) * width + i + right];
    if (!Number.isFinite(node[0]) || !Number.isFinite(node[1])) return false;
    dx += weight * node[0];
    dy += weight * node[1];
  }
  output.x = dx;
  output.y = dy;
  return true;
}
function shiftSubgrid(
  grid: PreparedSubgrid,
  x: number,
  y: number,
  inverse: boolean,
  output: Point
): boolean {
  if (!inverse) {
    if (!interpolate(grid, x, y, output)) return false;
    output.x += x;
    output.y += y;
    return true;
  }
  // Seed shifted boundary nodes within the measured displacement envelope.
  for (let i = 0; i < 2; i++) {
    const value = i === 0 ? x : y;
    if (
      value < grid.origin[i] - grid.maxShift[i] - TOLERANCE ||
      value > grid.origin[i] + (grid.size[i] - 1) * grid.step[i] + grid.maxShift[i] + TOLERANCE
    )
      return false;
  }
  if (!interpolate(grid, x, y, output, true)) return false;
  let guessX = x - output.x,
    guessY = y - output.y;
  for (let iteration = 0; iteration < 20; iteration++) {
    if (!interpolate(grid, guessX, guessY, output, true)) return false;
    const dx = x - guessX - output.x,
      dy = y - guessY - output.y;
    guessX += dx;
    guessY += dy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) <= TOLERANCE) {
      // Never accept the clamped extrapolation outside actual source coverage.
      if (!interpolate(grid, guessX, guessY, output)) return false;
      output.x = wrapLongitude(guessX);
      output.y = guessY;
      return true;
    }
  }
  throw new Error('Inverse datum grid shift did not converge');
}
/** Readers own their decoded arrays; keep the snapshot private behind a frozen executable grid. */
export function createDatumGrid(subgrids: Subgrid[]): DatumGrid {
  if (!subgrids.length) throw new Error('Datum grid requires at least one subgrid');
  const prepared: PreparedSubgrid[] = subgrids.map(grid => {
    const [width, height] = grid.size;
    if (
      ![width, height].every(n => Number.isSafeInteger(n) && n >= 2) ||
      width * height !== grid.shifts.length ||
      !grid.origin.every(Number.isFinite) ||
      !grid.step.every(n => Number.isFinite(n) && n > 0)
    )
      throw new Error('Invalid datum subgrid geometry or node count');
    const maxShift: [number, number] = [0, 0];
    for (const node of grid.shifts)
      for (let i = 0; i < 2; i++)
        if (Number.isFinite(node[i])) maxShift[i] = Math.max(maxShift[i], Math.abs(node[i]));
    return {...grid, maxShift};
  });
  const shiftInPlace = (point: Point, inverse: boolean): boolean => {
    const longitude = point.x,
      latitude = point.y;
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude))
      throw new Error('Grid coordinates must be finite');
    for (const grid of prepared) {
      if (shiftSubgrid(grid, -longitude, latitude, inverse, point)) {
        point.x = -point.x;
        return true;
      }
    }
    point.x = longitude;
    point.y = latitude;
    return false;
  };
  return Object.freeze({
    subgridCount: prepared.length,
    shiftInPlace,
    shift(longitude: number, latitude: number, inverse: boolean): [number, number] | undefined {
      const point = {x: longitude, y: latitude};
      return shiftInPlace(point, inverse) ? [point.x, point.y] : undefined;
    }
  });
}
