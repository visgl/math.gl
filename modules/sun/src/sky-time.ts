// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original adapter to Astronomy Engine's UT1/TT AstroTime fields (MIT).
// https://github.com/cosinekitty/astronomy/tree/v2.1.19/source/js
import {AstroTime, SiderealTime} from 'astronomy-engine';
import {validateRange} from './celestial';
export type SkyTimeScales = {
  /** UT1 minus UTC, seconds. Default 0. */
  ut1MinusUtc?: number;
  /** TT minus UTC, seconds. Omit to use Astronomy Engine's delta-T model. */
  ttMinusUtc?: number;
};
class SkyTime extends AstroTime {
  /** Preserve explicit TT/UT1 offsets during light-travel iteration. */
  override AddDays(days: number): AstroTime {
    const shifted = new SkyTime(new Date(this.date.getTime() + days * 86400000));
    shifted.ut = this.ut + days;
    shifted.tt = this.tt + days;
    return shifted;
  }
}
export function createSkyTime(timestamp: number | Date, scales: SkyTimeScales = {}): AstroTime {
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) throw new RangeError('Timestamp must be valid');
  const time = new SkyTime(date);
  const utc = time.ut;
  validateRange('UT1 minus UTC', scales.ut1MinusUtc ?? 0, -10, 10);
  time.ut = utc + (scales.ut1MinusUtc ?? 0) / 86400;
  if (scales.ttMinusUtc !== undefined) {
    validateRange('TT minus UTC', scales.ttMinusUtc, -1000, 1000);
    time.tt = utc + scales.ttMinusUtc / 86400;
  }
  // Astronomy Engine 2.1.19 caches sidereal time by TT alone. Different UT1
  // values at the same TT must invalidate that cache before horizontal work.
  // Use public API calls; no private state or global delta-T model is modified.
  const sentinel = new AstroTime(date);
  sentinel.tt = time.tt + 1;
  SiderealTime(sentinel);
  SiderealTime(time);
  return time;
}
