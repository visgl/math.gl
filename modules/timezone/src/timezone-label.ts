// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {assertTimezone, getInstant} from './instant';

/** A localized, date-aware display label; never use it as an identifier or offset. */
export function getTimezoneLabel(
  timezone: string,
  date: Date | number = Date.now(),
  locale: string | string[] = 'en'
): string {
  const instant = getInstant(date);
  assertTimezone(timezone);
  return new Intl.DateTimeFormat(locale, {timeZone: timezone, timeZoneName: 'long'})
    .formatToParts(instant)
    .find(part => part.type === 'timeZoneName')!.value;
}

/** Whether the current runtime accepts a timezone identifier, including supported aliases. */
export function isTimezoneSupported(timezone: string): boolean {
  if (typeof timezone !== 'string' || !timezone) return false;
  try {
    new Intl.DateTimeFormat('en', {timeZone: timezone});
    return true;
  } catch (error) {
    if (error instanceof RangeError) return false;
    throw error;
  }
}
