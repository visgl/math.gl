// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors
// SPDX-FileComment: Original spherical coordinate transforms, compatible with deck.gl GlobeViewport.
// Frame/scale reference (MIT): https://github.com/visgl/deck.gl/blob/master/modules/core/src/viewports/globe-viewport.ts
import {createSkyObserver, reverseSkyDirection} from './sky-observer';
import type {SkyObserver} from './sky-observer';
import {validateRange} from './celestial';

/** deck.gl's spherical Earth radius in meters; this is not the WGS84 ellipsoid. */
export const SKY_GLOBE_EARTH_RADIUS = 6370972;
/** Column-major rotation from observer ENU to deck.gl globe common-space axes. */
export function getSkyGlobeRotation(observer: SkyObserver): number[] {
  const {latitude, longitude} = createSkyObserver(observer);
  const phi = (latitude * Math.PI) / 180;
  const lambda = (longitude * Math.PI) / 180;
  const s = Math.sin(lambda),
    c = Math.cos(lambda),
    sp = Math.sin(phi),
    cp = Math.cos(phi);
  // Globe axes: +X at 90°E, -Y at Greenwich, +Z at the north pole.
  return [c, s, 0, -s * sp, c * sp, cp, s * cp, -c * cp, sp];
}

/** Rotate an ENU vector (including lighting and ring normals) into globe axes. */
export function skyDirectionToGlobe(
  direction: readonly number[],
  observer: SkyObserver
): [number, number, number] {
  reverseSkyDirection(direction); // shared finite/nonzero vector validation
  const m = getSkyGlobeRotation(observer);
  return [0, 1, 2].map(
    row => m[row] * direction[0] + m[row + 3] * direction[1] + m[row + 6] * direction[2]
  ) as [number, number, number];
}

/**
 * Place a sky object along its observer ray, returning LNGLAT for GlobeView layers.
 * distance is a rendering distance in meters, independent of astronomical distance.
 */
export function getSkyGlobePosition(
  direction: readonly number[],
  observer: SkyObserver,
  distance: number
): [number, number, number] {
  validateRange('Rendering distance', distance, Number.MIN_VALUE, Number.MAX_VALUE);
  const location = createSkyObserver(observer);
  const ray = skyDirectionToGlobe(direction, location);
  const length = Math.hypot(...ray);
  const up = skyDirectionToGlobe([0, 0, 1], location);
  const position = ray.map(
    (value, i) =>
      (value / length) * distance + up[i] * (SKY_GLOBE_EARTH_RADIUS + location.elevation)
  );
  const radius = Math.hypot(...position);
  if (!Number.isFinite(radius) || radius === 0)
    throw new RangeError('Sky position must have finite nonzero radius');
  return [
    (Math.atan2(position[0], -position[1]) * 180) / Math.PI,
    (Math.atan2(position[2], Math.hypot(position[0], position[1])) * 180) / Math.PI,
    radius - SKY_GLOBE_EARTH_RADIUS
  ];
}

/** Rotate a column-major ENU orientation (e.g. starfieldRotation) into globe axes. */
export function skyRotationToGlobe(rotation: readonly number[], observer: SkyObserver): number[] {
  if (rotation.length !== 9 || rotation.some(value => !Number.isFinite(value)))
    throw new RangeError('Rotation must contain nine finite values');
  return [0, 3, 6].flatMap(offset =>
    skyDirectionToGlobe(rotation.slice(offset, offset + 3), observer)
  );
}
