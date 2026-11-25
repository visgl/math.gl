// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import operation from './vendor/polygon-clipping/operation';

/** Planar XY coordinate. */
export type OverlayPosition = [number, number];
/** Boundary of a shell or hole. */
export type OverlayRing = OverlayPosition[];
/** Exterior ring followed by any holes. */
export type OverlayPolygon = OverlayRing[];
/** Disjoint polygon components. */
export type OverlayMultiPolygon = OverlayPolygon[];
/** A polygon or a collection of polygons. */
type Operand = OverlayPolygon | OverlayMultiPolygon;

/** Returns the area shared by all operands. */
export function intersectPolygons(subject: Operand, ...others: Operand[]): OverlayMultiPolygon {
  return operation.run('intersection', subject, others);
}

/** Returns the area covered by any operand. */
export function unionPolygons(subject: Operand, ...others: Operand[]): OverlayMultiPolygon {
  return operation.run('union', subject, others);
}

/** Subtracts all other operands from the subject. */
export function subtractPolygons(subject: Operand, ...others: Operand[]): OverlayMultiPolygon {
  return operation.run('difference', subject, others);
}

/** Returns the area covered by an odd number of operands. */
export function xorPolygons(subject: Operand, ...others: Operand[]): OverlayMultiPolygon {
  return operation.run('xor', subject, others);
}
