// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) 2018 Mike Fogel
// SPDX-FileCopyrightText: Copyright (c) 2016 Alexander Milevski

import { cmp } from "./flp.js"
import SplayTree from "splaytree"

/**
 * This class rounds incoming values sufficiently so that
 * floating points problems are, for the most part, avoided.
 *
 * Incoming points are have their x & y values tested against
 * all previously seen x & y values. If either is 'too close'
 * to a previously seen value, it's value is 'snapped' to the
 * previously seen value.
 *
 * All points should be rounded by this class before being
 * stored in any data structures in the rest of this algorithm.
 */

/** Rounds point ordinates using independent coordinate histories. */
class PtRounder {
  /** Starts with empty rounding histories. */
  constructor() {
    this.reset()
  }

  /** Clears ordinates recorded during the previous overlay. */
  reset() {
    this.xRounder = new CoordRounder()
    this.yRounder = new CoordRounder()
  }

  /** Returns a point snapped to nearby recorded ordinates. */
  round(x, y) {
    return {
      x: this.xRounder.round(x),
      y: this.yRounder.round(y),
    }
  }
}

/** Tracks ordinates in sorted order to reuse nearly equal values. */
class CoordRounder {
  /** Initializes the coordinate tree with zero. */
  constructor() {
    this.tree = new SplayTree()
    // preseed with 0 so we don't end up with values < Number.EPSILON
    this.round(0)
  }

  // Note: this can rounds input values backwards or forwards.
  //       You might ask, why not restrict this to just rounding
  //       forwards? Wouldn't that allow left endpoints to always
  //       remain left endpoints during splitting (never change to
  //       right). No - it wouldn't, because we snap intersections
  //       to endpoints (to establish independence from the segment
  //       angle for t-intersections).
  /** Reuses an equivalent neighboring ordinate or records the supplied one. */
  round(coord) {
    const node = this.tree.add(coord)

    const prevNode = this.tree.prev(node)
    if (prevNode !== null && cmp(node.key, prevNode.key) === 0) {
      this.tree.remove(coord)
      return prevNode.key
    }

    const nextNode = this.tree.next(node)
    if (nextNode !== null && cmp(node.key, nextNode.key) === 0) {
      this.tree.remove(coord)
      return nextNode.key
    }

    return coord
  }
}

// singleton available by import
/** Point rounder shared by the input and sweep stages. */
const rounder = new PtRounder()

export default rounder
