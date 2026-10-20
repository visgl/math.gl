// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
/** Validate new celestial APIs without changing existing sun API behavior. */
export function validateObserver(
  timestamp: number | Date,
  latitude: number,
  longitude: number
): void {
  const milliseconds = typeof timestamp === 'number' ? timestamp : timestamp.getTime();
  if (!Number.isFinite(milliseconds) || !Number.isFinite(new Date(milliseconds).getTime())) {
    throw new RangeError('Timestamp must be a valid Date or milliseconds since Unix epoch');
  }
  validateRange('Latitude', latitude, -90, 90);
  validateRange('Longitude', longitude, -Number.MAX_VALUE, Number.MAX_VALUE);
}

export function validateRange(name: string, value: number, minimum: number, maximum: number): void {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new RangeError(`${name} must be finite and between ${minimum} and ${maximum}`);
  }
}
