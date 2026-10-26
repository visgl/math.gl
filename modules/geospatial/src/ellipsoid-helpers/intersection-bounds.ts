// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) Charles Karney (2023)
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Capture-distance and conjugate calculations adapted from GeographicLib 2.7 Intersect.cpp (MIT). See ../../GEOGRAPHICLIB-LICENSE.txt.
import type {EllipsoidGeodesic, GeodesicLine} from '../ellipsoid-geodesic';

/** @internal Native characteristic distances, in normalized axis units. */
export class IntersectionBounds {
  readonly margin: number;
  readonly capture: number;
  readonly spacing: number;
  readonly halfCircumference: number;
  constructor(
    private readonly solver: EllipsoidGeodesic,
    ratio: number,
    radius: number
  ) {
    this.halfCircumference = Math.PI * radius;
    this.margin = this.halfCircumference * Number.EPSILON ** (1 / 5);
    this.capture = ratio <= 1 ? Math.PI * ratio : this.polarMinimum(ratio);
    this.spacing = this.capture - this.margin;
    if (!(Number.isFinite(this.spacing) && this.spacing > 0))
      throw new Error('Unresolved geodesic capture bound');
  }

  conjugate(
    line: GeodesicLine,
    guess: number,
    semi = false,
    reference = {m12: 0, M12: 1, M21: 1}
  ): number {
    const {m12, M12, M21} = reference;
    let s = guess;
    for (let i = 0; i < 100; i++) {
      const p = line.position(s);
      const m = p.m12 * M12 - m12 * p.M12;
      const forward = p.M12 * M21 + (m12 === 0 ? 0 : ((1 - M12 * M21) * p.m12) / m12);
      const reverse = p.M21 * M12 + (p.m12 === 0 ? 0 : ((1 - p.M12 * p.M21) * m12) / p.m12);
      const step = semi ? (m * forward) / (1 - forward * reverse) : -m / reverse;
      if (!Number.isFinite(step)) throw new Error('Unresolved conjugate distance');
      const next = s + step;
      if (next === s || Math.abs(step) <= 5e-14) return next;
      s = next;
    }
    throw new Error('Conjugate distance did not converge');
  }

  private polarDistance(latitude: number, ratio: number): number {
    return this.conjugate(
      this.solver.line(latitude, 0, 0),
      ((1 + (1 - ratio) / 2) * Math.PI) / 2,
      true
    );
  }
  private polarMinimum(ratio: number): number {
    let lat0 = 63,
      lat1 = 65,
      lat2 = 64;
    let s0 = this.polarDistance(lat0, ratio),
      s1 = this.polarDistance(lat1, ratio),
      s2 = this.polarDistance(lat2, ratio);
    let best = s2;
    for (let i = 0; i < 10; i++) {
      const denominator = (lat1 - lat0) * s2 + (lat0 - lat2) * s1 + (lat2 - lat1) * s0;
      if (denominator === 0) break;
      const next =
        ((lat1 - lat0) * (lat1 + lat0) * s2 +
          (lat0 - lat2) * (lat0 + lat2) * s1 +
          (lat2 - lat1) * (lat2 + lat1) * s0) /
        (2 * denominator);
      // Near a sphere the quadratic becomes numerically flat. The capture
      // safety margin is much larger than the roundoff in these distances.
      if (!(Number.isFinite(next) && next >= 0 && next <= 90)) break;
      lat0 = lat1;
      s0 = s1;
      lat1 = lat2;
      s1 = s2;
      lat2 = next;
      s2 = this.polarDistance(lat2, ratio);
      best = Math.min(best, s2);
    }
    return 2 * best;
  }
}
