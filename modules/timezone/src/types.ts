// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Gregorian local calendar and clock fields; this is not an instant. */
export type LocalDateTime = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
};

/** Local date with optional clock fields, which default to zero. */
export type LocalDateTimeInput = Pick<LocalDateTime, 'year' | 'month' | 'day'> &
  Partial<Pick<LocalDateTime, 'hour' | 'minute' | 'second' | 'millisecond'>>;

/** How to resolve a repeated or nonexistent local clock time. Defaults to reject. */
export type LocalDateTimeOptions = {
  disambiguation?: 'reject' | 'earlier' | 'later' | 'compatible';
};

/** An offset change at epoch milliseconds; offsets are minutes east of UTC. */
export type TimezoneTransition = {
  instant: number;
  offsetBefore: number;
  offsetAfter: number;
};
