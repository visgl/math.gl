// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Returns minutes east of UTC at an instant (epoch milliseconds or Date; defaults to now). */
export function getTimezoneOffset(timezone: string, date: Date | number = Date.now()): number {
  const instant = new Date(date instanceof Date ? date.getTime() : date);
  if (!Number.isFinite(instant.getTime())) {
    throw new RangeError('Date must represent a valid instant');
  }
  if (typeof timezone !== 'string' || !timezone) {
    throw new RangeError('Timezone must be a valid timezone identifier');
  }
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'longOffset'
  });
  const offset = formatter.formatToParts(instant).find(part => part.type === 'timeZoneName')?.value;
  if (offset === 'GMT') return 0;
  const match = /^GMT([+-])(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(offset || '');
  if (!match) throw new Error(`Unable to calculate offset for timezone: ${timezone}`);
  const minutes = Number(match[2]) * 60 + Number(match[3]) + Number(match[4] || 0) / 60;
  return match[1] === '-' ? -minutes : minutes;
}
