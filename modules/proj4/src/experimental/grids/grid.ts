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
function interpolate(
  grid: Subgrid,
  x: number,
  y: number,
  clamp = false
): [number, number] | undefined {
  let col = (x - grid.origin[0]) / grid.step[0],
    row = (y - grid.origin[1]) / grid.step[1];
  const [width, height] = grid.size;
  if (
    !clamp &&
    (col < -1e-10 || row < -1e-10 || col > width - 1 + 1e-10 || row > height - 1 + 1e-10)
  )
    return undefined;
  col = Math.max(0, Math.min(width - 1, col));
  row = Math.max(0, Math.min(height - 1, row));
  const i = Math.min(width - 2, Math.floor(col)),
    j = Math.min(height - 2, Math.floor(row));
  const u = col - i,
    v = row - j;
  const indexes = [j * width + i, j * width + i + 1, (j + 1) * width + i, (j + 1) * width + i + 1];
  const weights = [(1 - u) * (1 - v), u * (1 - v), (1 - u) * v, u * v];
  const result: [number, number] = [0, 0];
  for (let n = 0; n < 4; n++) {
    if (weights[n] === 0) continue;
    const node = grid.shifts[indexes[n]];
    if (!node.every(Number.isFinite)) return undefined;
    result[0] += weights[n] * node[0];
    result[1] += weights[n] * node[1];
  }
  return result;
}
function shiftSubgrid(
  grid: PreparedSubgrid,
  x: number,
  y: number,
  inverse: boolean
): [number, number] | undefined {
  if (!inverse) {
    const delta = interpolate(grid, x, y);
    return delta && [x + delta[0], y + delta[1]];
  }
  // Shifted edge nodes can lie just outside the source extent. Seed from the nearest
  // edge only within the grid's actual displacement envelope, then solve exactly.
  if (
    [x, y].some(
      (value, i) =>
        value < grid.origin[i] - grid.maxShift[i] - TOLERANCE ||
        value > grid.origin[i] + (grid.size[i] - 1) * grid.step[i] + grid.maxShift[i] + TOLERANCE
    )
  )
    return undefined;
  const initial = interpolate(grid, x, y, true);
  if (!initial) return undefined;
  let guessX = x - initial[0],
    guessY = y - initial[1];
  for (let iteration = 0; iteration < 20; iteration++) {
    const delta = interpolate(grid, guessX, guessY, true);
    if (!delta) return undefined;
    const dx = x - guessX - delta[0],
      dy = y - guessY - delta[1];
    guessX += dx;
    guessY += dy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) <= TOLERANCE) {
      // Clamped iterations help solve shifted boundary nodes, but the solution
      // must lie in the actual source extent and have usable interpolation nodes.
      return interpolate(grid, guessX, guessY) ? [wrapLongitude(guessX), guessY] : undefined;
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
  return Object.freeze({
    subgridCount: prepared.length,
    shift(longitude: number, latitude: number, inverse: boolean): [number, number] | undefined {
      if (!Number.isFinite(longitude) || !Number.isFinite(latitude))
        throw new Error('Grid coordinates must be finite');
      for (const grid of prepared) {
        const point = shiftSubgrid(grid, -longitude, latitude, inverse);
        if (point) return [-point[0], point[1]];
      }
      return undefined;
    }
  });
}
