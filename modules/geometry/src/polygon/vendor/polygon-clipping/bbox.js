// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) 2018 Mike Fogel
// SPDX-FileCopyrightText: Copyright (c) 2016 Alexander Milevski

/**
 * A bounding box has the format:
 *
 *  { ll: { x: xmin, y: ymin }, ur: { x: xmax, y: ymax } }
 *
 */

/** Tests whether a point lies inside or on the boundary of a bounding box. */
export const isInBbox = (bbox, point) => {
  return (
    bbox.ll.x <= point.x &&
    point.x <= bbox.ur.x &&
    bbox.ll.y <= point.y &&
    point.y <= bbox.ur.y
  )
}

/* Returns either null, or a bbox (aka an ordered pair of points)
 * If there is only one point of overlap, a bbox with identical points
 * will be returned */
/** Returns the shared bounds of two intersecting boxes. */
export const getBboxOverlap = (b1, b2) => {
  // check if the bboxes overlap at all
  if (
    b2.ur.x < b1.ll.x ||
    b1.ur.x < b2.ll.x ||
    b2.ur.y < b1.ll.y ||
    b1.ur.y < b2.ll.y
  )
    return null

  // find the middle two X values
  const lowerX = b1.ll.x < b2.ll.x ? b2.ll.x : b1.ll.x
  const upperX = b1.ur.x < b2.ur.x ? b1.ur.x : b2.ur.x

  // find the middle two Y values
  const lowerY = b1.ll.y < b2.ll.y ? b2.ll.y : b1.ll.y
  const upperY = b1.ur.y < b2.ur.y ? b1.ur.y : b2.ur.y

  // put those middle values together to get the overlap
  return { ll: { x: lowerX, y: lowerY }, ur: { x: upperX, y: upperY } }
}
