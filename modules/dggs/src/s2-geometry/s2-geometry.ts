// math.gl
// SPDX-License-Identifier: MIT and ISC
// Copyright (c) vis.gl contributors

// math.gl, MIT license
/*
Adapted from s2-geometry under ISC License (ISC)
Copyright (c) 2012-2016, Jon Atkins <github@jonatkins.com>
Copyright (c) 2016, AJ ONeal <aj@daplie.com>
Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.
THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
*/

import {isS2IndexValid} from './s2-token';

export type S2Cell = {
  face: number;
  ij: [number, number];
  level: number;
};

export function getS2Cell(s2Index: bigint): S2Cell {
  if (!isS2IndexValid(s2Index)) {
    throw new Error(`Invalid S2 index: ${s2Index}`);
  }
  const key = toHilbertQuadkey(s2Index);
  const s2cell = fromHilbertQuadKey(key);
  return s2cell;
}

//
// Functional Style
//
const FACE_BITS = 3;
const MAX_LEVEL = 30;
const POS_BITS = 2 * MAX_LEVEL + 1; // 61 (60 bits of data, 1 bit lsb marker)
const RADIAN_TO_DEGREE = 180 / Math.PI;

type HilbertOrientation = 'a' | 'b' | 'c' | 'd';

const HILBERT_MAP: Record<
  HilbertOrientation,
  readonly (readonly [position: number, orientation: HilbertOrientation])[]
> = {
  a: [
    [0, 'd'],
    [1, 'a'],
    [3, 'b'],
    [2, 'a']
  ],
  b: [
    [2, 'b'],
    [1, 'b'],
    [3, 'a'],
    [0, 'c']
  ],
  c: [
    [2, 'c'],
    [3, 'd'],
    [1, 'c'],
    [0, 'b']
  ],
  d: [
    [0, 'a'],
    [3, 'c'],
    [1, 'd'],
    [2, 'd']
  ]
};

/*
  Original function taken from deck.gl doesn't support the case of (face <= 5)
  It's fixed here.
*/
export function fromHilbertQuadKey(hilbertQuadkey: string): S2Cell {
  if (!/^[0-5]\/[0-3]{0,30}$/.test(hilbertQuadkey)) {
    throw new Error(`Invalid S2 Hilbert quadkey: ${hilbertQuadkey}`);
  }
  const parts = hilbertQuadkey.split('/');
  const face = parseInt(parts[0], 10);
  const position = parts[1] || '';
  const maxLevel = position.length;
  let level = 0;

  const point = [0, 0] as [number, number];

  for (let i = maxLevel - 1; i >= 0; i--) {
    level = maxLevel - i;
    const bit = position[i];
    let rx = 0;
    let ry = 0;
    if (bit === '1') {
      ry = 1;
    } else if (bit === '2') {
      rx = 1;
      ry = 1;
    } else if (bit === '3') {
      rx = 1;
    }

    const val = Math.pow(2, level - 1);
    rotateAndFlipQuadrant(val, point, rx, ry);

    point[0] += val * rx;
    point[1] += val * ry;
  }

  if (face % 2 === 1) {
    const t = point[0];
    point[0] = point[1];
    point[1] = t;
  }

  return {face, ij: point, level};
}

export function toHilbertQuadkey(id: bigint): string {
  if (!isS2IndexValid(id)) {
    throw new Error(`Invalid S2 index: ${id}`);
  }
  let bin = id.toString(2);

  while (bin.length < FACE_BITS + POS_BITS) {
    // eslint-disable-next-line prefer-template
    bin = '0' + bin;
  }

  // MUST come AFTER binstr has been left-padded with '0's
  const lsbIndex = bin.lastIndexOf('1');
  // substr(start, len)
  // substring(start, end) // includes start, does not include end
  const faceB = bin.substring(0, 3);
  // posB will always be a multiple of 2 (or it's invalid)
  const posB = bin.substring(3, lsbIndex);
  const levelN = posB.length / 2;

  const faceS = BigInt(`0b${faceB}`).toString(10);

  let posS = '';
  if (levelN !== 0) {
    posS = BigInt(`0b${posB}`).toString(4);

    while (posS.length < levelN) {
      // eslint-disable-next-line prefer-template
      posS = '0' + posS;
    }
  }
  return `${faceS}/${posS}`;
}

/**
 * Converts face-local integer coordinates into an S2 cell index.
 *
 * @param s2Cell - Face, `(i, j)` coordinates, and level of an S2 cell.
 * @returns The corresponding 64-bit S2 cell index.
 */
export function getS2IndexFromCell(s2Cell: S2Cell): bigint {
  const {face, ij, level} = s2Cell;
  if (!Number.isInteger(face) || face < 0 || face > 5) {
    throw new Error(`Invalid S2 face: ${face}`);
  }
  if (!Number.isInteger(level) || level < 0 || level > MAX_LEVEL) {
    throw new Error(`Invalid S2 level: ${level}`);
  }
  const maximumCoordinate = 2 ** level;
  if (
    !Number.isInteger(ij[0]) ||
    !Number.isInteger(ij[1]) ||
    ij[0] < 0 ||
    ij[1] < 0 ||
    ij[0] >= maximumCoordinate ||
    ij[1] >= maximumCoordinate
  ) {
    throw new Error(`Invalid S2 IJ coordinates: ${ij[0]}, ${ij[1]}`);
  }

  const positions = getHilbertQuadList(ij[0], ij[1], level, face);
  let s2Index = BigInt(face) << 61n;
  for (let positionIndex = 0; positionIndex < positions.length; positionIndex++) {
    const bitOffset = 59 - positionIndex * 2;
    s2Index |= BigInt(positions[positionIndex]) << BigInt(bitOffset);
  }
  s2Index |= 1n << BigInt(60 - level * 2);
  return s2Index;
}

/**
 * Returns a spatially addressed descendant of an S2 cell.
 *
 * Unlike {@link getS2ChildIndex}, `x` and `y` address the descendant along increasing face-local
 * `i` and `j` axes. This accounts for Hilbert orientation changes across faces and levels.
 *
 * @param rootIndex - Valid S2 cell index at the root of the relative grid.
 * @param relativeLevel - Number of subdivision levels below the root.
 * @param x - Descendant coordinate along the root cell's increasing `i` axis.
 * @param y - Descendant coordinate along the root cell's increasing `j` axis.
 * @returns The descendant S2 cell index.
 */
export function getS2DescendantIndex(
  rootIndex: bigint,
  relativeLevel: number,
  x: number,
  y: number
): bigint {
  const rootCell = getS2Cell(rootIndex);
  if (
    !Number.isInteger(relativeLevel) ||
    relativeLevel < 0 ||
    rootCell.level + relativeLevel > MAX_LEVEL
  ) {
    throw new Error(`Invalid S2 relative level: ${relativeLevel}`);
  }
  const divisionCount = 2 ** relativeLevel;
  if (
    !Number.isInteger(x) ||
    !Number.isInteger(y) ||
    x < 0 ||
    y < 0 ||
    x >= divisionCount ||
    y >= divisionCount
  ) {
    throw new Error(`Invalid S2 descendant coordinates: ${x}, ${y}`);
  }
  return getS2IndexFromCell({
    face: rootCell.face,
    ij: [rootCell.ij[0] * divisionCount + x, rootCell.ij[1] * divisionCount + y],
    level: rootCell.level + relativeLevel
  });
}

export function IJToST(
  ij: [number, number],
  order: number,
  offsets: [number, number]
): [number, number] {
  const maxSize = 1 << order;

  return [(ij[0] + offsets[0]) / maxSize, (ij[1] + offsets[1]) / maxSize];
}

function singleSTtoUV(st: number): number {
  if (st >= 0.5) {
    return (1 / 3.0) * (4 * st * st - 1);
  }
  return (1 / 3.0) * (1 - 4 * (1 - st) * (1 - st));
}

export function STToUV(st: [number, number]): [number, number] {
  return [singleSTtoUV(st[0]), singleSTtoUV(st[1])];
}

export function FaceUVToXYZ(face: number, [u, v]: [number, number]): [number, number, number] {
  switch (face) {
    case 0:
      return [1, u, v];
    case 1:
      return [-u, 1, v];
    case 2:
      return [-u, -v, 1];
    case 3:
      return [-1, -v, -u];
    case 4:
      return [v, -1, -u];
    case 5:
      return [v, u, -1];
    default:
      throw new Error('Invalid face');
  }
}

export function XYZToLngLat([x, y, z]: [number, number, number]): [number, number] {
  const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
  const lng = Math.atan2(y, x);

  return [lng * RADIAN_TO_DEGREE, lat * RADIAN_TO_DEGREE];
}

function rotateAndFlipQuadrant(n: number, point: [number, number], rx: number, ry: number): void {
  if (ry === 0) {
    if (rx === 1) {
      point[0] = n - 1 - point[0];
      point[1] = n - 1 - point[1];
    }

    const x = point[0];
    point[0] = point[1];
    point[1] = x;
  }
}

function getHilbertQuadList(x: number, y: number, level: number, face: number): number[] {
  let orientation: HilbertOrientation = face % 2 === 1 ? 'd' : 'a';
  const positions: number[] = [];
  for (let bit = level - 1; bit >= 0; bit--) {
    const mask = 1 << bit;
    const quadrantX = (x & mask) !== 0 ? 1 : 0;
    const quadrantY = (y & mask) !== 0 ? 1 : 0;
    const [position, nextOrientation] = HILBERT_MAP[orientation][quadrantX * 2 + quadrantY];
    positions.push(position);
    orientation = nextOrientation;
  }
  return positions;
}
