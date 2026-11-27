// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {HeightField} from './height-field';
import {
  TerrainSampleStatus as Status,
  type HeightFieldProps,
  type TerrainSample,
  type TerrainSampleOptions
} from './types';

const RADIANS = Math.PI / 180;
const RADIUS = 6378137;
const ECCENTRICITY_SQUARED = 6.6943799901413165e-3;
const MAX_MERCATOR_LATITUDE = Math.atan(Math.sinh(Math.PI)) / RADIANS;

export type GeographicHeightFieldProps = Omit<
  HeightFieldProps,
  'origin' | 'columnStep' | 'rowStep'
> & {
  /** Unwrapped west, south, east, north in degrees. East must exceed west. */
  bounds: readonly [number, number, number, number];
  projection?: 'geographic' | 'web-mercator';
  /** Raster row direction. Defaults to north to south. */
  rowDirection?: 'north-to-south' | 'south-to-north';
};

/** Longitude/latitude queries with WGS84 surface-metric east/north derivatives. */
export class GeographicHeightField {
  readonly bounds: readonly [number, number, number, number];
  readonly projection: 'geographic' | 'web-mercator';
  readonly heightReference: string;
  private readonly field: HeightField;

  constructor(props: GeographicHeightFieldProps) {
    const {bounds} = props;
    this.projection = props.projection ?? 'geographic';
    this.heightReference = props.heightReference ?? 'unknown';
    const limit = this.projection === 'web-mercator' ? MAX_MERCATOR_LATITUDE : 90;
    if (
      bounds.length !== 4 ||
      !bounds.every(Number.isFinite) ||
      bounds[2] <= bounds[0] ||
      bounds[2] - bounds[0] > 360 ||
      bounds[3] <= bounds[1] ||
      bounds[1] < -limit ||
      bounds[3] > limit ||
      (this.projection === 'geographic' && (bounds[1] === -90 || bounds[3] === 90))
    ) {
      throw new Error(
        'Terrain bounds must be increasing, span at most 360 degrees and exclude the projection limits'
      );
    }
    if (this.projection !== 'geographic' && this.projection !== 'web-mercator')
      throw new Error('Unknown terrain projection');
    const direction = props.rowDirection ?? 'north-to-south';
    if (direction !== 'north-to-south' && direction !== 'south-to-north')
      throw new Error('Unknown terrain row direction');
    this.bounds = Object.freeze([...bounds]) as typeof bounds;
    const west = this.projectX(bounds[0]);
    const east = this.projectX(bounds[2]);
    const south = this.projectY(bounds[1]);
    const north = this.projectY(bounds[3]);
    const cell = props.registration === 'cell';
    const descending = direction === 'north-to-south';
    this.field = new HeightField({
      ...props,
      origin: [west, descending ? north : south],
      columnStep: [(east - west) / (props.width - (cell ? 0 : 1)), 0],
      rowStep: [0, (descending ? south - north : north - south) / (props.height - (cell ? 0 : 1))]
    });
  }

  /** Longitude must use the bounds' unwrapped interval; no implicit wrapping or clamping. */
  sample(
    longitude: number,
    latitude: number,
    options?: TerrainSampleOptions,
    result?: TerrainSample
  ): TerrainSample {
    const valid = Number.isFinite(longitude) && Number.isFinite(latitude);
    const inside =
      valid &&
      longitude >= this.bounds[0] &&
      longitude <= this.bounds[2] &&
      latitude >= this.bounds[1] &&
      latitude <= this.bounds[3];
    const sample = this.field.sample(
      inside ? this.projectX(longitude) : NaN,
      inside ? this.projectY(latitude) : NaN,
      options,
      result
    );
    if (!inside) {
      sample.status = sample.gradientStatus = valid ? Status.OUTSIDE_DOMAIN : Status.INVALID_INPUT;
      return sample;
    }
    if (sample.gradientStatus !== Status.VALID) return sample;
    const phi = latitude * RADIANS;
    const denominator = 1 - ECCENTRICITY_SQUARED * Math.sin(phi) ** 2;
    const n = RADIUS / Math.sqrt(denominator);
    const m = (RADIUS * (1 - ECCENTRICITY_SQUARED)) / denominator ** 1.5;
    const mercator = this.projection === 'web-mercator';
    const gx = (sample.gradientX * (mercator ? RADIUS : 1 / RADIANS)) / (n * Math.cos(phi));
    const gy = (sample.gradientY * (mercator ? RADIUS / Math.cos(phi) : 1 / RADIANS)) / m;
    if (!Number.isFinite(gx) || !Number.isFinite(gy)) {
      sample.gradientStatus = Status.NUMERIC_ERROR;
      sample.gradientX = sample.gradientY = sample.normalX = sample.normalY = sample.normalZ = 0;
      return sample;
    }
    sample.gradientX = gx;
    sample.gradientY = gy;
    const scale = Math.max(1, Math.abs(gx), Math.abs(gy));
    const length = Math.hypot(gx / scale, gy / scale, 1 / scale);
    sample.normalX = -gx / scale / length;
    sample.normalY = -gy / scale / length;
    sample.normalZ = 1 / scale / length;
    return sample;
  }

  private projectX(longitude: number): number {
    return this.projection === 'web-mercator' ? RADIUS * longitude * RADIANS : longitude;
  }

  private projectY(latitude: number): number {
    return this.projection === 'web-mercator'
      ? RADIUS * Math.asinh(Math.tan(latitude * RADIANS))
      : latitude;
  }
}
