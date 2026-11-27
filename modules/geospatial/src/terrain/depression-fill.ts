// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {HeightField} from './height-field';

/** Outlet and allocation policy for four-neighbor terrain conditioning. */
export type TerrainDepressionFillOptions = {
  /** Valid row-major cell indices that can drain. Exterior and nodata are closed. */
  outlets: readonly number[];
  /** Maximum grid cells before allocating buffers. Defaults to 4,194,304. */
  maxCells?: number;
};

/** Conditioned terrain and its outlet-connected drainage forest. */
export type TerrainDepressionFill = {
  /** Derived field, including the original heights of outlet-disconnected cells. */
  field: HeightField;
  /** Next face neighbor toward an outlet, -1 at outlets, -2 for nodata or disconnected cells. */
  receiver: Int32Array;
  /** Number of valid cells with no face-connected path to an outlet. */
  disconnectedCells: number;
};

/**
 * Raise each outlet-connected cell to the lowest spill elevation needed to reach
 * a declared outlet by face neighbors. The returned forest routes across flats.
 * Nodata blocks flow and disconnected components retain their source heights.
 * The source is immutable. Time is O(cells log cells) and storage is O(cells).
 */
export function fillTerrainDepressions(
  field: HeightField,
  {outlets, maxCells = 4_194_304}: TerrainDepressionFillOptions
): TerrainDepressionFill {
  if (field.registration !== 'cell')
    throw new Error('Terrain depression fill requires cell registration');
  const {width, height} = field;
  const count = width * height;
  if (!Number.isSafeInteger(maxCells) || maxCells < 0 || count > maxCells || count > 0x7fffffff)
    throw new RangeError('Terrain depression fill exceeds its cell budget');
  if (!outlets.length) throw new RangeError('Terrain depression fill requires an outlet');
  for (const i of outlets) {
    if (
      !Number.isInteger(i) ||
      i < 0 ||
      i >= count ||
      field.getHeight(i % width, Math.floor(i / width)) === undefined
    )
      throw new RangeError('Terrain outlet must identify a valid cell');
  }

  const {heights, validity} = field.copyData();
  const receiver = new Int32Array(count).fill(-2);
  const heap = new Int32Array(count);
  let size = 0;
  let disconnectedCells = field.validCount;

  /** Sort by spill elevation, then by cell index for reproducible flat routing. */
  const before = (a: number, b: number) =>
    heights[a] < heights[b] || (heights[a] === heights[b] && a < b);

  /** Insert a newly reached cell. Its finalized spill height never changes. */
  function push(cell: number): void {
    let slot = size++;
    while (slot > 0) {
      const parent = Math.floor((slot - 1) / 2);
      if (!before(cell, heap[parent])) break;
      heap[slot] = heap[parent];
      slot = parent;
    }
    heap[slot] = cell;
  }

  /** Remove the cell with the lowest known spill elevation. */
  function pop(): number {
    const first = heap[0];
    const tail = heap[--size];
    let slot = 0;
    let child = 1;
    while (child < size) {
      if (child + 1 < size && before(heap[child + 1], heap[child])) child++;
      if (!before(heap[child], tail)) break;
      heap[slot] = heap[child];
      slot = child;
      child = slot * 2 + 1;
    }
    if (size) heap[slot] = tail;
    return first;
  }

  /** First discovery from the minimum frontier finalizes the minimax path cost. */
  function visit(cell: number, parent: number): void {
    if (!validity[cell] || receiver[cell] !== -2) return;
    receiver[cell] = parent;
    disconnectedCells--;
    if (parent >= 0) heights[cell] = Math.max(heights[cell], heights[parent]);
    push(cell);
  }

  for (const outlet of outlets) visit(outlet, -1);
  while (size) {
    const cell = pop();
    const column = cell % width;
    if (column > 0) visit(cell - 1, cell);
    if (column + 1 < width) visit(cell + 1, cell);
    if (cell >= width) visit(cell - width, cell);
    if (cell < count - width) visit(cell + width, cell);
  }
  return {
    field: new HeightField({
      width,
      height,
      heights,
      validity,
      origin: field.origin,
      columnStep: field.columnStep,
      rowStep: field.rowStep,
      registration: field.registration,
      diagonal: field.diagonal,
      heightReference: field.heightReference
    }),
    receiver,
    disconnectedCells
  };
}
