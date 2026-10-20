// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {Temporal} from '@js-temporal/polyfill';
import {assertTimezone, getInstant} from './instant';
import type {LocalDateTimeInput, LocalDateTimeOptions, TimezoneTransition} from './types';

export type {LocalDateTimeInput, LocalDateTimeOptions, TimezoneTransition} from './types';

function getZonedDateTime(timezone: string, date: Date | number): Temporal.ZonedDateTime {
  assertTimezone(timezone);
  return Temporal.Instant.fromEpochMilliseconds(getInstant(date).getTime()).toZonedDateTimeISO(
    timezone
  );
}

/** Epoch milliseconds of the first valid instant of the instant's local calendar day. */
export function getStartOfDay(timezone: string, date: Date | number = Date.now()): number {
  return getZonedDateTime(timezone, date).startOfDay().epochMilliseconds;
}

/** Convert Gregorian wall-clock fields to epoch milliseconds with explicit DST disambiguation. */
export function localDateTimeToInstant(
  timezone: string,
  fields: LocalDateTimeInput,
  options: LocalDateTimeOptions = {}
): number {
  assertTimezone(timezone);
  const values = {
    year: fields.year,
    month: fields.month,
    day: fields.day,
    hour: fields.hour ?? 0,
    minute: fields.minute ?? 0,
    second: fields.second ?? 0,
    millisecond: fields.millisecond ?? 0
  };
  if (!Object.values(values).every(Number.isInteger)) {
    throw new RangeError('Local date and time fields must be finite integers');
  }
  if (values.second < 0 || values.second > 59) {
    throw new RangeError('Seconds must be between 0 and 59; leap seconds are not supported');
  }
  return Temporal.ZonedDateTime.from(
    {...values, timeZone: timezone, calendar: 'iso8601'},
    {overflow: 'reject', disambiguation: options.disambiguation ?? 'reject'}
  ).epochMilliseconds;
}

/** Return offset changes in [start, end), including political changes as well as DST. */
export function getTimezoneTransitions(
  timezone: string,
  start: Date | number,
  end: Date | number
): TimezoneTransition[] {
  const startDate = getInstant(start);
  const endDate = getInstant(end);
  if (endDate.getTime() < startDate.getTime()) {
    throw new RangeError('End must not precede start');
  }
  let cursor = getZonedDateTime(timezone, startDate);
  // Start one nanosecond earlier so a transition exactly at start is included.
  if (startDate.getTime() > -8640000000000000) cursor = cursor.subtract({nanoseconds: 1});
  const transitions: TimezoneTransition[] = [];
  while (true) {
    const next = cursor.getTimeZoneTransition('next');
    if (!next || next.epochMilliseconds >= endDate.getTime()) break;
    transitions.push({
      instant: next.epochMilliseconds,
      offsetBefore: next.subtract({nanoseconds: 1}).offsetNanoseconds / 60000000000,
      offsetAfter: next.offsetNanoseconds / 60000000000
    });
    cursor = next;
  }
  return transitions;
}
