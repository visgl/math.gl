// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import tzLookup from '@photostructure/tz-lookup';

/** Returns an approximate IANA timezone for [longitude, latitude] in degrees. */
export function lookupTimezone(coordinates: readonly [number, number]): string {
  const [longitude, latitude] = coordinates;
  if (
    !Number.isFinite(longitude) ||
    !Number.isFinite(latitude) ||
    longitude < -180 ||
    longitude > 180 ||
    latitude < -90 ||
    latitude > 90
  ) {
    throw new RangeError('Coordinates must be finite longitude [-180, 180] and latitude [-90, 90]');
  }
  return tzLookup(latitude, longitude);
}
