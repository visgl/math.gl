// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {assertTimezone, getInstant} from './instant';
import type {LocalDateTime} from './types';

/** Returns Gregorian local calendar fields for an instant, independent of the host timezone. */
export function getLocalDateTime(
  timezone: string,
  date: Date | number = Date.now()
): LocalDateTime {
  const instant = getInstant(date);
  assertTimezone(timezone);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    calendar: 'gregory',
    numberingSystem: 'latn',
    hourCycle: 'h23',
    era: 'short',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric'
  }).formatToParts(instant);
  const value = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find(part => part.type === type)!.value;
  const year = Number(value('year'));
  return {
    year: value('era') === 'BC' ? 1 - year : year,
    month: Number(value('month')),
    day: Number(value('day')),
    hour: Number(value('hour')),
    minute: Number(value('minute')),
    second: Number(value('second')),
    millisecond: instant.getUTCMilliseconds()
  };
}
