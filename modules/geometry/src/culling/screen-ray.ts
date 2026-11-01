// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Matrix4} from '@math.gl/core';

/** Top-origin viewport rectangle in the same units as the supplied screen position. */
export type ScreenRayViewport = {
  x?: number;
  y?: number;
  width: number;
  height: number;
};

/** A finite near-to-far segment: origin + direction reaches the far endpoint. */
export type ScreenRay = {
  origin: [number, number, number];
  direction: [number, number, number];
};

/**
 * Unproject a top-origin screen position through an inverse clip matrix.
 * The column-major matrix maps clip coordinates to the caller's output space;
 * include any desired placement or coordinate conversion in it beforehand.
 * The depth range defaults to WebGL/deck.gl clip coordinates [-1, 1]; use [0, 1]
 * for a zero-to-one clip convention. Positions outside the viewport are allowed.
 * Returns null for invalid or degenerate input or an unbounded segment.
 */
export function unprojectScreenRay(
  inverseClipMatrix: Readonly<ArrayLike<number>>,
  viewport: ScreenRayViewport,
  pixel: readonly [number, number],
  depthRange: readonly [number, number] = [-1, 1]
): ScreenRay | null {
  const x = viewport.x ?? 0;
  const y = viewport.y ?? 0;
  if (
    inverseClipMatrix.length !== 16 ||
    !Array.from(inverseClipMatrix).every(Number.isFinite) ||
    ![x, y, viewport.width, viewport.height, ...pixel, ...depthRange].every(Number.isFinite) ||
    viewport.width <= 0 ||
    viewport.height <= 0 ||
    pixel.length !== 2 ||
    depthRange.length !== 2 ||
    depthRange[0] === depthRange[1]
  )
    return null;

  const matrix = new Matrix4(Array.from(inverseClipMatrix));
  const determinant = matrix.determinant();
  if (!Number.isFinite(determinant) || determinant === 0) return null;
  const horizontal = (2 * (pixel[0] - x)) / viewport.width - 1;
  const vertical = 1 - (2 * (pixel[1] - y)) / viewport.height;
  const points = depthRange.map(depth => matrix.transform([horizontal, vertical, depth, 1]));
  if (points.some(point => point[3] === 0 || !point.every(Number.isFinite))) return null;
  // A sign change crosses w=0 between endpoints, so the projected segment is unbounded.
  if (points[0][3] < 0 !== points[1][3] < 0) return null;
  const origin: [number, number, number] = [
    points[0][0] / points[0][3],
    points[0][1] / points[0][3],
    points[0][2] / points[0][3]
  ];
  const direction: [number, number, number] = [
    points[1][0] / points[1][3] - origin[0],
    points[1][1] / points[1][3] - origin[1],
    points[1][2] / points[1][3] - origin[2]
  ];
  const distance = Math.hypot(...direction);
  return origin.every(Number.isFinite) &&
    direction.every(Number.isFinite) &&
    Number.isFinite(distance) &&
    distance > 0
    ? {origin, direction}
    : null;
}
