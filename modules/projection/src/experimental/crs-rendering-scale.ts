// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {NumericalDerivative} from '../numerical-derivative';
import {normalizeCRS} from './crs/normalize';
import type {NormalizedCRS} from './crs/types';
import type {CRSRenderingScale} from './types';
import type {PreparedProjection, ProjectionCoordinate} from '../types';

const RADIANS = Math.PI / 180;
// Samples are returned by the WGS84 converter, regardless of the target ellipsoid.
const WGS84 = normalizeCRS('WGS84').ellipsoid;

function validateScale(scale: CRSRenderingScale): CRSRenderingScale {
  if (scale.length !== 3 || scale.some(value => !Number.isFinite(value) || value <= 0))
    throw new Error('Invalid CRS rendering scale');
  return scale;
}

export function createRenderingScale(
  crs: NormalizedCRS,
  projection: PreparedProjection,
  axis: string,
  center: number
): CRSRenderingScale | ((coordinate: ProjectionCoordinate) => CRSRenderingScale | null) {
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
  const anchor = [0, 0, 0],
    input = [0, 0, 0],
    geographic = [0, 0, 0],
    sample = [0, 0, 0];
  const derivatives = Array.from({length: 3}, () => [0, 0, 0]);
  let component = 0,
    longitudeMeters = 0,
    latitudeMeters = 0,
    busy = false;
  const numerical = new NumericalDerivative((offset, output) => {
    for (let i = 0; i < 3; i++) input[i] = anchor[i];
    input[component] += offset;
    projection.unprojectTo(input, sample);
    // WGS84 can wrap at Greenwich ±180 even when the target is continuous there.
    // Target branch cuts are checked against its central meridian below.
    const rawDelta = sample[0] - geographic[0];
    const delta =
      Math.abs(rawDelta) <= 180 ? rawDelta : ((((rawDelta + 180) % 360) + 360) % 360) - 180;
    if (Math.abs(sample[1]) >= 90) return false;
    output[0] = delta * longitudeMeters;
    output[1] = (sample[1] - geographic[1]) * latitudeMeters;
    output[2] = sample[2] - geographic[2];
    return output.every(Number.isFinite);
  });
  return (coordinate: ProjectionCoordinate): CRSRenderingScale | null => {
    if (busy || coordinate.length < 2) return null;
    busy = true;
    let scale: [number, number, number];
    try {
      anchor[0] = coordinate[0];
      anchor[1] = coordinate[1];
      anchor[2] = coordinate[2] ?? 0;
      if (!anchor.every(Number.isFinite)) return null;
      projection.unprojectTo(anchor, geographic);
      const latitude = geographic[1] * RADIANS;
      const a = WGS84.semiMajorAxis,
        es = WGS84.eccentricitySquared;
      const denominator = 1 - es * Math.sin(latitude) ** 2;
      longitudeMeters = ((a * Math.cos(latitude)) / Math.sqrt(denominator)) * RADIANS;
      latitudeMeters = ((a * (1 - es)) / denominator ** 1.5) * RADIANS;
      if (!(longitudeMeters > a * RADIANS * 1e-8) || !(latitudeMeters > 0)) return null;
      const offset = ((((geographic[0] - center + 180) % 360) + 360) % 360) - 180;
      const hasLongitudeSeam =
        crs.kind === 'geographic'
          ? crs.longitudeWrap !== undefined
          : !Object.prototype.hasOwnProperty.call(crs.parameters, 'over');
      if (
        (hasLongitudeSeam && Math.abs(offset) + 2 / longitudeMeters >= 180) ||
        Math.abs(geographic[1]) + 2 / latitudeMeters >= 90
      )
        return null;
      for (component = 0; component < 3; component++) {
        const direction = axis[component];
        const nominalMeters = /[ud]/.test(direction)
          ? crs.verticalUnit
          : crs.kind === 'geographic'
            ? ((/[ew]/.test(direction) ? longitudeMeters : latitudeMeters) * crs.angularUnit) /
              RADIANS
            : crs.toMeter;
        if (!numerical.evaluate(1 / nominalMeters, nominalMeters)) return null;
        for (let i = 0; i < 3; i++) derivatives[component][i] = numerical.result[i];
      }
      scale = derivatives.map(derivative => Math.hypot(...derivative)) as [number, number, number];
      if (crs.kind === 'projected') {
        const east = derivatives[axis.search(/[ew]/)];
        const north = derivatives[axis.search(/[ns]/)];
        // Retain rotation/shear in the determinant. This is rendering sizing,
        // not the physical height conversion performed by the converter.
        const inverseArea = Math.abs(east[0] * north[1] - east[1] * north[0]) / crs.toMeter ** 2;
        scale[axis.search(/[ud]/)] = crs.verticalUnit * Math.sqrt(inverseArea);
      }
    } catch {
      return null;
    } finally {
      busy = false;
    }
    return validateScale(scale);
  };
}
