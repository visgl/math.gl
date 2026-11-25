// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import overlay from './vendor/polygon-clipping/index';

/** Planar XY coordinate. */
export type OverlayPosition = [number, number];
/** Boundary of a shell or hole. */
export type OverlayRing = OverlayPosition[];
/** Exterior ring followed by any holes. */
export type OverlayPolygon = OverlayRing[];
/** Disjoint polygon components. */
export type OverlayMultiPolygon = OverlayPolygon[];
/** Computes the polygonal area of a Boolean operation on planar inputs. */
type OverlayOperation = (
  subject: OverlayPolygon | OverlayMultiPolygon,
  ...others: (OverlayPolygon | OverlayMultiPolygon)[]
) => OverlayMultiPolygon;

/** Boolean operations returning multipolygons, including the empty result. */
export const polygonOverlay: {
  /** Area covered by at least one operand. */
  union: OverlayOperation;
  /** Area covered by every operand. */
  intersection: OverlayOperation;
  /** Subject area outside all other operands. */
  difference: OverlayOperation;
  /** Area covered by an odd number of operands. */
  xor: OverlayOperation;
} = overlay;
