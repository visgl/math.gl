// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {locatePointInPolygon} from './spatial-planar-intersects';

/** A finite planar position. */
type Position = readonly number[];

/** Scratch storage for unpacking finite binary64 coordinates. */
const floatBits = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(8));

/** Converts a double to its exact signed integer in units of 2^-1074. */
function integerUnits(value: number): bigint {
  floatBits.setFloat64(0, value);
  const high = floatBits.getUint32(0);
  const exponent = (high >>> 20) & 0x7ff;
  let significand = (BigInt(high & 0xfffff) << 32n) | BigInt(floatBits.getUint32(4));
  if (exponent) significand |= 1n << 52n;
  const magnitude = significand << BigInt(Math.max(0, exponent - 1));
  return high >>> 31 ? -magnitude : magnitude;
}

/** Returns the exactly representable half sum when error-free addition certifies it. */
function exactHalfSum(a: number, b: number): number | undefined {
  const first = a / 2;
  const second = b / 2;
  if (first * 2 !== a || second * 2 !== b) return undefined;
  const sum = first + second;
  const roundedSecond = sum - first;
  const residual = first - (sum - roundedSecond) + (second - roundedSecond);
  return residual === 0 ? sum : undefined;
}

/**
 * Classifies the mathematical midpoint of an edge interval against closed rings. When it falls between
 * doubles, cast the ray with exact dyadic coordinates instead of rounding the point.
 */
export function locateMidpointInPolygon(
  from: Position,
  to: Position,
  rings: readonly (readonly Position[])[]
): -1 | 0 | 1 {
  const x = exactHalfSum(from[0]!, to[0]!);
  const y = exactHalfSum(from[1]!, to[1]!);
  if (x !== undefined && y !== undefined) return locatePointInPolygon([x, y], rings);

  // Use doubled coordinates so the rational midpoint is an integer too.
  const mx = integerUnits(from[0]!) + integerUnits(to[0]!);
  const my = integerUnits(from[1]!) + integerUnits(to[1]!);
  let inside = false;
  for (const ring of rings) {
    if (ring.length < 2) continue;
    let ax = 2n * integerUnits(ring[0]![0]!) - mx;
    let ay = 2n * integerUnits(ring[0]![1]!) - my;
    for (let i = 1; i < ring.length; i++) {
      const vertex = ring[i]!;
      const bx = 2n * integerUnits(vertex[0]!) - mx;
      const by = 2n * integerUnits(vertex[1]!) - my;
      const cross = ax * by - ay * bx;
      if (cross === 0n && ax * bx <= 0n && ay * by <= 0n) return 0;
      if (ay > 0n !== by > 0n && cross > 0n === by > ay) inside = !inside;
      ax = bx;
      ay = by;
    }
  }
  return inside ? 1 : -1;
}
