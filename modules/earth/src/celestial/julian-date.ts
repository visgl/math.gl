// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original split Julian coordinate and integer Unix tick conversions. No Cesium or SOFA implementation copied.

export type CelestialTimeScale = 'TAI' | 'TT' | 'UT1';
export type UnixTimeUnit = 's' | 'ms' | 'us' | 'ns';
const SECONDS_PER_DAY = 86400;
const NS_PER_DAY = 86400000000000n;
const EPOCH_DAY = 2440587;
const EPOCH_SECONDS = 43200;
const NS_PER_TICK: Record<UnixTimeUnit, bigint> = {s: 1000000000n, ms: 1000000n, us: 1000n, ns: 1n};

/** Immutable normalized Julian coordinate in an explicit scale. Days start at noon.
 * TAI/TT differences are continuous SI seconds. UT1 differences are coordinate
 * seconds, not a guarantee of physical elapsed time. UTC labels and leap tables
 * are deliberately outside this first foundation.
 */
export class JulianDate {
  readonly dayNumber: number;
  readonly secondsOfDay: number;
  readonly timeScale: CelestialTimeScale;

  constructor(dayNumber: number, secondsOfDay = 0, timeScale: CelestialTimeScale = 'TAI') {
    if (
      !Number.isSafeInteger(dayNumber) ||
      !Number.isFinite(secondsOfDay) ||
      !['TAI', 'TT', 'UT1'].includes(timeScale)
    ) {
      throw new RangeError(
        'Expected an integral Julian day, finite seconds and explicit supported scale'
      );
    }
    const carry = Math.floor(secondsOfDay / SECONDS_PER_DAY);
    let day = dayNumber + carry;
    let seconds = secondsOfDay - carry * SECONDS_PER_DAY;
    // Tiny negative values can round to the following day boundary in binary64.
    if (seconds >= SECONDS_PER_DAY) {
      day++;
      seconds = 0;
    }
    if (seconds < 0) {
      day--;
      seconds += SECONDS_PER_DAY;
    }
    if (
      !Number.isSafeInteger(day) ||
      !Number.isFinite(seconds) ||
      seconds < 0 ||
      seconds >= SECONDS_PER_DAY
    ) {
      throw new RangeError('Julian coordinate is outside the supported numeric domain');
    }
    this.dayNumber = day;
    this.secondsOfDay = seconds === 0 ? 0 : seconds;
    this.timeScale = timeScale;
    Object.freeze(this);
  }

  /** Unix timestamps omit leap seconds. The caller supplies the selected scale minus UTC at the
   * represented instant. Input tick arithmetic remains bigint until the day split.
   */
  static fromUnixTicks(
    ticks: bigint,
    unit: UnixTimeUnit,
    scaleMinusUtc: number,
    timeScale: CelestialTimeScale = 'TAI'
  ): JulianDate {
    if (typeof ticks !== 'bigint') throw new RangeError('Unix ticks must be bigint');
    const nanoseconds = ticks * tickSize(unit);
    let days = nanoseconds / NS_PER_DAY;
    let remainder = nanoseconds % NS_PER_DAY;
    if (remainder < 0) {
      days--;
      remainder += NS_PER_DAY;
    }
    const dayNumber = BigInt(EPOCH_DAY) + days;
    if (
      dayNumber < BigInt(Number.MIN_SAFE_INTEGER) ||
      dayNumber > BigInt(Number.MAX_SAFE_INTEGER)
    ) {
      throw new RangeError('Unix timestamp is outside the supported Julian day range');
    }
    finiteOffset(scaleMinusUtc);
    return new JulianDate(
      Number(dayNumber),
      EPOCH_SECONDS + Number(remainder) / 1e9,
      timeScale
    ).addSeconds(scaleMinusUtc);
  }

  /** Existing floating-point millisecond timestamps cannot recover lost input precision. */
  static fromUnixMilliseconds(
    milliseconds: number | Date,
    scaleMinusUtc: number,
    timeScale: CelestialTimeScale = 'TAI'
  ): JulianDate {
    const value = typeof milliseconds === 'number' ? milliseconds : milliseconds.getTime();
    if (!Number.isFinite(value)) throw new RangeError('Unix milliseconds must be finite');
    const days = Math.floor(value / 86400000);
    finiteOffset(scaleMinusUtc);
    return new JulianDate(
      EPOCH_DAY + days,
      EPOCH_SECONDS + (value - days * 86400000) / 1000,
      timeScale
    ).addSeconds(scaleMinusUtc);
  }

  addSeconds(seconds: number): JulianDate {
    finiteOffset(seconds);
    // Split large additions before combining them with the fractional component.
    const days = Math.trunc(seconds / SECONDS_PER_DAY);
    return new JulianDate(
      this.dayNumber + days,
      this.secondsOfDay + (seconds - days * SECONDS_PER_DAY),
      this.timeScale
    );
  }

  secondsDifference(other: JulianDate): number {
    if (this.timeScale !== other.timeScale)
      throw new RangeError('Convert time scales explicitly before comparing');
    return (
      (this.dayNumber - other.dayNumber) * SECONDS_PER_DAY +
      (this.secondsOfDay - other.secondsOfDay)
    );
  }

  /** Caller-supplied target-minus-source offset at this instant. No model is inferred. */
  toTimeScale(target: CelestialTimeScale, offsetSeconds: number): JulianDate {
    finiteOffset(offsetSeconds);
    if (target === this.timeScale && offsetSeconds !== 0)
      throw new RangeError('Same-scale conversion requires zero offset');
    const shifted = this.addSeconds(offsetSeconds);
    return new JulianDate(shifted.dayNumber, shifted.secondsOfDay, target);
  }

  /** Export an ordinary Unix-representable instant. Rejects fractional output ticks
   * unless explicit rounding is selected. The caller owns leap-second ambiguity.
   */
  toUnixTicks(
    unit: UnixTimeUnit,
    scaleMinusUtc: number,
    rounding: 'reject' | 'nearest' = 'reject'
  ): bigint {
    finiteOffset(scaleMinusUtc);
    if (rounding !== 'reject' && rounding !== 'nearest')
      throw new RangeError('Unknown rounding policy');
    const utc = this.addSeconds(-scaleMinusUtc);
    const scale = tickSize(unit);
    const seconds = utc.secondsOfDay - EPOCH_SECONDS;
    const ticksPerSecond = 1000000000 / Number(scale);
    const scaled = seconds * ticksPerSecond;
    const rounded = Math.round(scaled);
    // Reject conservatively: even representation roundoff requires the caller
    // to select nearest explicitly when integer tick identity is desired.
    if (rounding === 'reject' && !Number.isInteger(scaled)) {
      throw new RangeError('Timestamp is not representable in the requested tick unit');
    }
    return (BigInt(utc.dayNumber) - BigInt(EPOCH_DAY)) * (NS_PER_DAY / scale) + BigInt(rounded);
  }
}

function tickSize(unit: UnixTimeUnit): bigint {
  if (!Object.prototype.hasOwnProperty.call(NS_PER_TICK, unit))
    throw new RangeError('Unknown Unix timestamp unit');
  return NS_PER_TICK[unit];
}
function finiteOffset(value: number): void {
  if (!Number.isFinite(value)) throw new RangeError('Time offset must be finite seconds');
}
