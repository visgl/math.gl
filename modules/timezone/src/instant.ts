// math.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Normalize an instant without consulting the host timezone or parsing local strings. */
export function getInstant(date: Date | number): Date {
  if (!(date instanceof Date) && typeof date !== 'number') {
    throw new RangeError('Date must be a Date or epoch milliseconds');
  }
  const instant = new Date(date instanceof Date ? date.getTime() : date);
  if (!Number.isFinite(instant.getTime())) {
    throw new RangeError('Date must represent a valid instant');
  }
  return instant;
}

export function assertTimezone(timezone: string): void {
  if (typeof timezone !== 'string' || !timezone) {
    throw new RangeError('Timezone must be a valid timezone identifier');
  }
}
