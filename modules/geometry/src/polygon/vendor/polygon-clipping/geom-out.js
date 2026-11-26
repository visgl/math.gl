// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) 2018 Mike Fogel
// SPDX-FileCopyrightText: Copyright (c) 2016 Alexander Milevski

import { compareVectorAngles } from "./vector.js"
import SweepEvent from "./sweep-event.js"

/** A closed ring assembled from segments selected for the result. */
export class RingOut {
  /* Given the segments from the sweep line pass, compute & return a series
   * of closed rings from all the segments marked to be part of the result */
  /** Follows linked result segments to build the output rings. */
  static factory(allSegments) {
    const ringsOut = []

    for (let i = 0, iMax = allSegments.length; i < iMax; i++) {
      const segment = allSegments[i]
      if (!segment.isInResult() || segment.ringOut) continue

      let prevEvent = null
      let event = segment.leftSE
      let nextEvent = segment.rightSE
      const events = [event]

      const startingPoint = event.point
      const intersectionLEs = []

      /* Walk the chain of linked events to form a closed ring */
      while (true) {
        prevEvent = event
        event = nextEvent
        events.push(event)

        /* Is the ring complete? */
        if (event.point === startingPoint) break

        while (true) {
          const availableLEs = event.getAvailableLinkedEvents()

          /* Did we hit a dead end? This shouldn't happen.
           * Indicates some earlier part of the algorithm malfunctioned. */
          if (availableLEs.length === 0) {
            const firstPt = events[0].point
            const lastPt = events[events.length - 1].point
            throw new Error(
              `Unable to complete output ring starting at [${firstPt.x},` +
                ` ${firstPt.y}]. Last matching segment found ends at` +
                ` [${lastPt.x}, ${lastPt.y}].`,
            )
          }

          /* Only one way to go, so cotinue on the path */
          if (availableLEs.length === 1) {
            nextEvent = availableLEs[0].otherSE
            break
          }

          /* We must have an intersection. Check for a completed loop */
          let indexLE = null
          for (let j = 0, jMax = intersectionLEs.length; j < jMax; j++) {
            if (intersectionLEs[j].point === event.point) {
              indexLE = j
              break
            }
          }
          /* Found a completed loop. Cut that off and make a ring */
          if (indexLE !== null) {
            const intersectionLE = intersectionLEs.splice(indexLE)[0]
            const ringEvents = events.splice(intersectionLE.index)
            ringEvents.unshift(ringEvents[0].otherSE)
            ringsOut.push(new RingOut(ringEvents.reverse()))
            continue
          }
          /* register the intersection */
          intersectionLEs.push({
            index: events.length,
            point: event.point,
          })
          /* Choose the left-most option to continue the walk */
          const comparator = event.getLeftmostComparator(prevEvent)
          nextEvent = availableLEs.sort(comparator)[0].otherSE
          break
        }
      }

      ringsOut.push(new RingOut(events))
    }
    return ringsOut
  }

  /** Records the ordered sweep events and links their segments to the ring. */
  constructor(events) {
    this.events = events
    for (let i = 0, iMax = events.length; i < iMax; i++) {
      events[i].segment.ringOut = this
    }
    this.poly = null
  }

  /** Returns a closed coordinate ring with redundant collinear points removed. */
  getGeom() {
    // Remove superfluous points (ie extra points along a straight line),
    let prevPt = this.events[0].point
    const points = [prevPt]
    for (let i = 1, iMax = this.events.length - 1; i < iMax; i++) {
      const pt = this.events[i].point
      const nextPt = this.events[i + 1].point
      if (compareVectorAngles(pt, prevPt, nextPt) === 0) continue
      points.push(pt)
      prevPt = pt
    }

    // ring was all (within rounding error of angle calc) colinear points
    if (points.length === 1) return null

    // check if the starting point is necessary
    const pt = points[0]
    const nextPt = points[1]
    if (compareVectorAngles(pt, prevPt, nextPt) === 0) points.shift()

    points.push(points[0])
    const step = this.isExteriorRing() ? 1 : -1
    const iStart = this.isExteriorRing() ? 0 : points.length - 1
    const iEnd = this.isExteriorRing() ? points.length : -1
    const orderedPoints = []
    for (let i = iStart; i != iEnd; i += step)
      orderedPoints.push([points[i].x, points[i].y])
    return orderedPoints
  }

  /** Determines exterior status from the enclosing ring hierarchy. */
  isExteriorRing() {
    if (this._isExteriorRing === undefined) {
      const enclosing = this.enclosingRing()
      this._isExteriorRing = enclosing ? !enclosing.isExteriorRing() : true
    }
    return this._isExteriorRing
  }

  /** Returns the cached ring enclosing this ring, when present. */
  enclosingRing() {
    if (this._enclosingRing === undefined) {
      this._enclosingRing = this._calcEnclosingRing()
    }
    return this._enclosingRing
  }

  /* Returns the ring that encloses this one, if any */
  /** Finds the enclosing ring using preceding sweep segments. */
  _calcEnclosingRing() {
    // start with the ealier sweep line event so that the prevSeg
    // chain doesn't lead us inside of a loop of ours
    let leftMostEvt = this.events[0]
    for (let i = 1, iMax = this.events.length; i < iMax; i++) {
      const evt = this.events[i]
      if (SweepEvent.compare(leftMostEvt, evt) > 0) leftMostEvt = evt
    }

    let prevSeg = leftMostEvt.segment.prevInResult()
    let prevPrevSeg = prevSeg ? prevSeg.prevInResult() : null

    while (true) {
      // no segment found, thus no ring can enclose us
      if (!prevSeg) return null

      // no segments below prev segment found, thus the ring of the prev
      // segment must loop back around and enclose us
      if (!prevPrevSeg) return prevSeg.ringOut

      // if the two segments are of different rings, the ring of the prev
      // segment must either loop around us or the ring of the prev prev
      // seg, which would make us and the ring of the prev peers
      if (prevPrevSeg.ringOut !== prevSeg.ringOut) {
        if (prevPrevSeg.ringOut.enclosingRing() !== prevSeg.ringOut) {
          return prevSeg.ringOut
        } else return prevSeg.ringOut.enclosingRing()
      }

      // two segments are from the same ring, so this was a penisula
      // of that ring. iterate downward, keep searching
      prevSeg = prevPrevSeg.prevInResult()
      prevPrevSeg = prevSeg ? prevSeg.prevInResult() : null
    }
  }
}

/** An output polygon with one exterior ring and any interior rings. */
export class PolyOut {
  /** Associates an exterior ring with the output polygon. */
  constructor(exteriorRing) {
    this.exteriorRing = exteriorRing
    exteriorRing.poly = this
    this.interiorRings = []
  }

  /** Attaches a hole to this polygon. */
  addInterior(ring) {
    this.interiorRings.push(ring)
    ring.poly = this
  }

  /** Serializes the exterior and surviving interior rings. */
  getGeom() {
    const geom = [this.exteriorRing.getGeom()]
    // exterior ring was all (within rounding error of angle calc) colinear points
    if (geom[0] === null) return null
    for (let i = 0, iMax = this.interiorRings.length; i < iMax; i++) {
      const ringGeom = this.interiorRings[i].getGeom()
      // interior ring was all (within rounding error of angle calc) colinear points
      if (ringGeom === null) continue
      geom.push(ringGeom)
    }
    return geom
  }
}

/** The polygons assembled from all output rings. */
export class MultiPolyOut {
  /** Groups the output rings into polygons. */
  constructor(rings) {
    this.rings = rings
    this.polys = this._composePolys(rings)
  }

  /** Returns the serialized polygons that have valid exterior rings. */
  getGeom() {
    const geom = []
    for (let i = 0, iMax = this.polys.length; i < iMax; i++) {
      const polyGeom = this.polys[i].getGeom()
      // exterior ring was all (within rounding error of angle calc) colinear points
      if (polyGeom === null) continue
      geom.push(polyGeom)
    }
    return geom
  }

  /** Groups each hole under its enclosing exterior ring. */
  _composePolys(rings) {
    const polys = []
    for (let i = 0, iMax = rings.length; i < iMax; i++) {
      const ring = rings[i]
      if (ring.poly) continue
      if (ring.isExteriorRing()) polys.push(new PolyOut(ring))
      else {
        const enclosingRing = ring.enclosingRing()
        if (!enclosingRing.poly) polys.push(new PolyOut(enclosingRing))
        enclosingRing.poly.addInterior(ring)
      }
    }
    return polys
  }
}
