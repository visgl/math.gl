// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GeographicHeightField} from './geographic';
import {TerrainSampleStatus, type TerrainSampleOptions} from './types';

export type TerrainGeographicProbe = readonly [longitude: number, latitude: number];

/** Map longitude to the first equivalent value in the unwrapped interval, if one exists.
 * The western endpoint owns the alias when the interval covers a full turn.
 */
export function wrapTerrainLongitude(
  longitude: number,
  west: number,
  east: number
): number | undefined {
  if (![longitude, west, east].every(Number.isFinite) || east <= west || east - west > 360)
    throw new Error('Invalid terrain longitude interval or query');
  if (longitude >= west && longitude < east) return longitude;
  // Reduce separately before subtracting to avoid overflow and preserve modulo information.
  const delta = ((longitude % 360) - (west % 360)) % 360;
  const offset = delta < 0 ? delta + 360 : delta;
  const mapped = west + offset;
  return mapped <= east ? mapped : undefined;
}

/** Compare independent one-sided stencils at the same geographic position.
 * Exact poles remain outside the terrain derivative domain. No reflection or extrapolation.
 */
export function measureGeographicTerrainSeam(
  a: GeographicHeightField | null,
  b: GeographicHeightField | null,
  probes: readonly TerrainGeographicProbe[],
  options: TerrainSampleOptions = {}
) {
  if (a && b && a.heightReference !== b.heightReference)
    throw new Error('Terrain seam height references differ');
  const sample = (field: GeographicHeightField | null, longitude: number, latitude: number) => {
    if (!field || !Number.isFinite(longitude)) return field?.sample(longitude, latitude, options);
    const mapped = wrapTerrainLongitude(longitude, field.bounds[0], field.bounds[2]);
    return field.sample(mapped ?? longitude, latitude, options);
  };
  return probes.map(([longitude, latitude]) => {
    const left = sample(a, longitude, latitude);
    const right = sample(b, longitude, latitude);
    const valid =
      left?.status === TerrainSampleStatus.VALID && right?.status === TerrainSampleStatus.VALID;
    const derivatives =
      left?.gradientStatus === TerrainSampleStatus.VALID &&
      right?.gradientStatus === TerrainSampleStatus.VALID;
    const normalAngle = derivatives
      ? Math.atan2(
          Math.hypot(
            left.normalY * right.normalZ - left.normalZ * right.normalY,
            left.normalZ * right.normalX - left.normalX * right.normalZ,
            left.normalX * right.normalY - left.normalY * right.normalX
          ),
          left.normalX * right.normalX + left.normalY * right.normalY + left.normalZ * right.normalZ
        )
      : null;
    return {
      longitude,
      latitude,
      statusA: left?.status ?? TerrainSampleStatus.NOT_RESIDENT,
      statusB: right?.status ?? TerrainSampleStatus.NOT_RESIDENT,
      gradientStatusA: left?.gradientStatus ?? TerrainSampleStatus.NOT_RESIDENT,
      gradientStatusB: right?.gradientStatus ?? TerrainSampleStatus.NOT_RESIDENT,
      heightJump: valid ? Math.abs(left.height - right.height) : null,
      normalAngle
    };
  });
}
