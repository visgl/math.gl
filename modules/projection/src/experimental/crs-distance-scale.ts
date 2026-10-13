// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {NormalizedCRS} from './crs/types';
import type {CRSDistanceScale} from './types';
import type {PreparedProjection, ProjectionCoordinate} from '../types';

const RADIANS = Math.PI / 180;

function validateScale(scale: CRSDistanceScale): CRSDistanceScale {
  if (scale.length !== 3 || scale.some(value => !Number.isFinite(value) || value <= 0))
    throw new Error('Invalid CRS distance scale');
  return scale;
}

export function createDistanceScale(
  crs: NormalizedCRS,
  projection: PreparedProjection,
  axis: string,
  center: number
): CRSDistanceScale | ((coordinate: ProjectionCoordinate) => CRSDistanceScale | null) {
  // Cartesian coordinates have a fixed length unit, independent of the earth model
  // or position. Geocentric Z uses that same unit rather than a height convention.
  if (crs.kind === 'geocentric') return validateScale([crs.toMeter, crs.toMeter, crs.toMeter]);
  if (crs.kind === 'identity') {
    return validateScale(
      [...axis].map(direction => (/[ud]/.test(direction) ? crs.verticalUnit : crs.toMeter)) as [
        number,
        number,
        number
      ]
    );
  }
  return (coordinate: ProjectionCoordinate): CRSDistanceScale | null => {
    let scale: [number, number, number];
    try {
      const anchor = Array.from(coordinate);
      if (anchor.length < 3) anchor[2] = 0;
      const geographic = projection.unproject(anchor);
      const longitude = geographic[0],
        latitude = geographic[1] * RADIANS;
      const a = crs.ellipsoid.semiMajorAxis,
        es = crs.ellipsoid.eccentricitySquared;
      const denominator = 1 - es * Math.sin(latitude) ** 2;
      const longitudeMeters = ((a * Math.cos(latitude)) / Math.sqrt(denominator)) * RADIANS;
      const latitudeMeters = ((a * (1 - es)) / denominator ** 1.5) * RADIANS;
      if (!(longitudeMeters > a * RADIANS * 1e-8) || !(latitudeMeters > 0)) return null;
      const offset = ((((longitude - center + 180) % 360) + 360) % 360) - 180;
      const hasLongitudeSeam =
        crs.kind === 'geographic'
          ? crs.longitudeWrap !== undefined
          : !Object.prototype.hasOwnProperty.call(crs.parameters, 'over');
      if (
        (hasLongitudeSeam && Math.abs(offset) + 1 / longitudeMeters >= 180) ||
        Math.abs(geographic[1]) + 1 / latitudeMeters >= 90
      )
        return null;
      const derivatives = [...axis].map((direction, component) => {
        // Perturb each target axis directly. This measures native-axis ground
        // distance even when the projected grid is rotated or its axes reordered.
        const nominalMeters = /[ud]/.test(direction)
          ? crs.verticalUnit
          : crs.kind === 'geographic'
            ? ((/[ew]/.test(direction) ? longitudeMeters : latitudeMeters) * crs.angularUnit) /
              RADIANS
            : crs.toMeter;
        const step = 1 / nominalMeters;
        const before = anchor.slice(),
          after = anchor.slice();
        before[component] -= step;
        after[component] += step;
        const low = projection.unproject(before),
          high = projection.unproject(after);
        const longitudeDelta = ((((high[0] - low[0] + 180) % 360) + 360) % 360) - 180;
        return [
          (longitudeDelta * longitudeMeters) / (2 * step),
          ((high[1] - low[1]) * latitudeMeters) / (2 * step),
          ((high[2] ?? 0) - (low[2] ?? 0)) / (2 * step)
        ];
      });
      scale = derivatives.map(derivative => Math.hypot(...derivative)) as [number, number, number];
      if (crs.kind === 'projected') {
        const east = derivatives[axis.search(/[ew]/)];
        const north = derivatives[axis.search(/[ns]/)];
        // The determinant retains shear/rotation information lost by multiplying
        // axis lengths. Normalize to physical map metres before encoding it in
        // the vertical unit, so a renderer's common-space Z scale is isotropic.
        const inverseArea = Math.abs(east[0] * north[1] - east[1] * north[0]) / crs.toMeter ** 2;
        scale[axis.search(/[ud]/)] = crs.verticalUnit * Math.sqrt(inverseArea);
      }
    } catch {
      // Inverse sampling can be unavailable outside a projection's working domain.
      return null;
    }
    // Invalid computed scales are contract errors, not unavailable samples.
    return validateScale(scale);
  };
}
