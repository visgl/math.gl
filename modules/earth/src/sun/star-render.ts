// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original rendering adapter; no deck.gl code copied.
import {getStarfieldRotation} from './starfield';
import {createSkyObserver} from './sky-observer';
import {getSkyGlobePosition} from './sky-globe';
import type {SkyObserver} from './sky-observer';
import type {StarPosition} from './star-types';

export type StarLayerOptions = {
  /** GlobeView LNGLAT, local ENU Cartesian, or fixed J2000 Cartesian. Default globe. */
  coordinates?: 'globe' | 'local' | 'equatorial';
  /** Required for globe/local; ignored for equatorial. */
  observer?: SkyObserver;
  /** Modern observer orientation date, separate from simulated stellar epoch. Default now. */
  timestamp?: number | Date;
  /** Optional accurate J2000-to-ENU rotation from a sky snapshot, replacing timestamp orientation. */
  rotation?: readonly number[];
  /** Rendering shell radius in meters (globe/local), arbitrary units for equatorial. Default 10 million. */
  distance?: number;
  /** Optional current apparent magnitude cutoff; default includes every input source. */
  maximumMagnitude?: number;
  /** Omit sources below the geometric local horizon. Default false; unavailable for equatorial. */
  clipHorizon?: boolean;
  /** Radius of a magnitude-zero source, in pixels. Default 4. */
  radiusScale?: number;
  /** Pixel radius clamp, default [0.5, 6]. Subpixel flux is preserved through alpha. */
  minimumRadiusPixels?: number;
  maximumRadiusPixels?: number;
};
export type StarLayerDatum = {
  id: number;
  /** ScatterplotLayer position; LNGLAT for globe, Cartesian for local/equatorial. */
  position: [number, number, number];
  /** Gamma-encoded RGB plus alpha, byte values for getFillColor. */
  color: [number, number, number, number];
  radiusPixels: number;
  /** Local geometric elevation, radians; null for equatorial. */
  altitude: number | null;
  magnitude: number;
  source: StarPosition;
};

/** Build dependency-free ScatterplotLayer data from propagated J2000 star directions. */
export function getStarLayerData(
  stars: readonly StarPosition[],
  options: StarLayerOptions = {}
): StarLayerDatum[] {
  const coordinates = options.coordinates ?? 'globe';
  if (!['globe', 'local', 'equatorial'].includes(coordinates))
    throw new RangeError('Unknown star layer coordinates');
  const distance = options.distance ?? 1e7;
  const scale = options.radiusScale ?? 4;
  const minimum = options.minimumRadiusPixels ?? 0.5;
  const maximum = options.maximumRadiusPixels ?? 6;
  if (
    ![distance, scale, minimum, maximum].every(Number.isFinite) ||
    distance <= 0 ||
    scale <= 0 ||
    minimum <= 0 ||
    maximum < minimum
  )
    throw new RangeError('Invalid star rendering distance or radii');
  if (options.maximumMagnitude !== undefined && !Number.isFinite(options.maximumMagnitude))
    throw new RangeError('Magnitude cutoff must be finite');
  if (coordinates === 'equatorial' && options.clipHorizon)
    throw new RangeError('Horizon clipping requires a local observer');
  const observer =
    coordinates === 'equatorial'
      ? undefined
      : options.observer
        ? createSkyObserver(options.observer)
        : undefined;
  if (coordinates !== 'equatorial' && !observer)
    throw new RangeError('Globe/local stars require an observer');
  const rotation = observer
    ? (options.rotation ??
      getStarfieldRotation(options.timestamp ?? Date.now(), observer.latitude, observer.longitude))
    : undefined;
  if (rotation) validateRotation(rotation);
  const result: StarLayerDatum[] = [];
  for (const star of stars) {
    if (
      !Number.isFinite(star.magnitude) ||
      star.equatorialDirection.length !== 3 ||
      !star.equatorialDirection.every(Number.isFinite) ||
      Math.abs(Math.hypot(...star.equatorialDirection) - 1) > 1e-6 ||
      star.color.length !== 3 ||
      !star.color.every(value => Number.isFinite(value) && value >= 0 && value <= 1)
    ) {
      throw new RangeError('Invalid propagated star for rendering');
    }
    if (options.maximumMagnitude !== undefined && star.magnitude > options.maximumMagnitude)
      continue;
    const direction = rotation
      ? [0, 1, 2].map(
          i =>
            rotation[i] * star.equatorialDirection[0] +
            rotation[i + 3] * star.equatorialDirection[1] +
            rotation[i + 6] * star.equatorialDirection[2]
        )
      : star.equatorialDirection;
    const altitude = observer ? Math.asin(Math.max(-1, Math.min(1, direction[2]))) : null;
    if (options.clipHorizon && altitude !== null && altitude < 0) continue;
    const rawRadius = scale * 10 ** (-0.2 * star.magnitude);
    const radiusPixels = Math.max(minimum, Math.min(maximum, rawRadius));
    const alpha = Math.min(1, (rawRadius / radiusPixels) ** 2);
    const srgb = (linear: number): number =>
      Math.round(
        255 * (linear <= 0.0031308 ? 12.92 * linear : 1.055 * linear ** (1 / 2.4) - 0.055)
      );
    result.push({
      id: star.star.id,
      position:
        coordinates === 'globe'
          ? getSkyGlobePosition(direction, observer!, distance)
          : (direction.map(value => value * distance) as [number, number, number]),
      color: [
        srgb(star.color[0]),
        srgb(star.color[1]),
        srgb(star.color[2]),
        Math.round(255 * alpha)
      ],
      radiusPixels,
      altitude,
      magnitude: star.magnitude,
      source: star
    });
  }
  return result;
}

function validateRotation(m: readonly number[]): void {
  if (m.length !== 9 || !m.every(Number.isFinite))
    throw new RangeError('Expected a finite J2000-to-ENU rotation');
  for (let a = 0; a < 3; a++)
    for (let b = 0; b < 3; b++) {
      const dot = [0, 1, 2].reduce((sum, i) => sum + m[a * 3 + i] * m[b * 3 + i], 0);
      if (Math.abs(dot - (a === b ? 1 : 0)) > 1e-6)
        throw new RangeError('Rendering rotation must be orthonormal');
    }
  const determinant =
    m[0] * (m[4] * m[8] - m[7] * m[5]) -
    m[3] * (m[1] * m[8] - m[7] * m[2]) +
    m[6] * (m[1] * m[5] - m[4] * m[2]);
  if (Math.abs(determinant - 1) > 1e-6)
    throw new RangeError('Rendering rotation must preserve handedness');
}
