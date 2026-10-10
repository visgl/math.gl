// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {normalizeCRS} from './experimental/crs/normalize';
import {ProjectionTransform} from './experimental/typescript-projection';
import {ProjectionAnalysis} from './analysis';
import type {ProjectionTransformCreateOptions} from './experimental/typescript-projection';
import type {TypeScriptCRSInput} from './experimental/crs/spatial-reference';
import type {NormalizedCRS} from './experimental/crs/types';
import type {ProjectionContext, ProjectionPlugin, ProjectionPoint} from './experimental/types';
import type {ProjectionDomain, ProjectionFactors, ProjectionJacobian} from './analysis';

/** Full CRS pipeline analysis at a geographic anchor, with a separately selected ground metric. */
export type ProjectionTransformAnalysisOptions = Omit<
  ProjectionTransformCreateOptions,
  'enforceAxis'
> & {
  /** Geographic reference defining the anchor longitude, latitude and height. Defaults to from
   * only when from is geographic. Required for projected/geocentric source coordinates.
   */
  geographicFrom?: TypeScriptCRSInput;
  /** Application-qualified geographic rectangle, in radians relative to geographicFrom's meridian. */
  domain: ProjectionDomain;
  /** Constant anchor height, in meters in geographicFrom's vertical reference. Default 0. */
  height?: number;
  /** Physical ground metric; defaults to the geographic anchor's ellipsoid. */
  groundEllipsoid?: Pick<ProjectionContext, 'semiMajorAxis' | 'eccentricitySquared'>;
  /** Central difference step in radians. Default 1e-4. */
  step?: number;
  /** Agreement tolerance for the two derivative stencils. Default 1e-6. */
  derivativeTolerance?: number;
};

/** Derivatives of a prepared CRS pair, composed from a geographic anchor into the source CRS.
 * Output axes are physical east/north in meters; input derivatives are per geographic radian.
 * Horizontal derivatives hold anchor height fixed. This is not an inverse coordinate API.
 */
export interface ProjectionTransformAnalysis {
  /** Captured geographic domain, in radians. */
  readonly domain: ProjectionDomain;
  /** Check finite anchor angles against the declared domain. */
  contains(longitude: number, latitude: number): boolean;
  /** Write the complete horizontal pipeline derivative; false leaves result untouched. */
  jacobian(longitude: number, latitude: number, result: ProjectionJacobian): boolean;
  /** Write cartographic factors against the selected ground metric; false leaves result untouched. */
  factors(longitude: number, latitude: number, result: ProjectionFactors): boolean;
}

/** Prepare full CRS-pair analysis without loading algorithms during derivative evaluation.
 * Imports no projection catalogue. Pass algorithms, parser plugins and grids explicitly, as
 * for ProjectionTransform.create. All CRS stages execute through the prepared transforms.
 * Lossy pipelines, nongeographic anchors and nonplanar targets reject at construction.
 * Domain, singularity, derivative agreement and output ownership follow ProjectionAnalysis.
 */
export async function createProjectionTransformAnalysis(
  options: ProjectionTransformAnalysisOptions
): Promise<ProjectionTransformAnalysis> {
  const from = options.from ?? 'WGS84';
  const source = normalizeCRS(from, options);
  const geographicFrom =
    options.geographicFrom ?? (source.kind === 'geographic' ? from : undefined);
  if (!geographicFrom) throw new Error('Projected source analysis requires geographicFrom');
  const geographic = normalizeCRS(geographicFrom, options);
  const target = normalizeCRS(options.to ?? 'WGS84', options);
  const height = options.height ?? 0;
  if (geographic.kind !== 'geographic' || target.kind !== 'projected' || !Number.isFinite(height)) {
    throw new Error(
      'Transform analysis requires a geographic anchor, planar target and finite height'
    );
  }
  const anchorTransform = await ProjectionTransform.create({
    ...options,
    from: geographicFrom,
    to: from,
    enforceAxis: true
  });
  const transform = await ProjectionTransform.create({...options, enforceAxis: true});
  if (anchorTransform.lossy || transform.lossy) {
    throw new Error('Transform analysis requires lossless CRS pipelines');
  }
  const input: number[] = [0, 0, 0];
  const anchored: number[] = [0, 0, 0];
  const output: number[] = [0, 0, 0];
  const projection: ProjectionPlugin = {
    name: 'prepared-crs-analysis',
    parameters: [],
    create: () => ({
      forward: () => {
        throw new Error('Use the mutable analysis hook');
      },
      inverse: () => {
        throw new Error('Transform analysis does not invert horizontal slices');
      },
      inverseInPlace: () => {
        throw new Error('Transform analysis does not invert horizontal slices');
      },
      forwardInPlace(point) {
        writeGeographicInput(point.x, point.y, height, geographic, input);
        anchorTransform.projectToSync(input, anchored);
        transform.projectToSync(anchored, output);
        readProjectedOutput(output, target, point);
      }
    })
  };
  const analysis = new ProjectionAnalysis({
    projection,
    // The adapter already produces physical meters through prepared transforms. Its
    // context supplies only the ground metric and numerical derivative scale.
    context: {...(options.groundEllipsoid ?? geographic.ellipsoid), parameters: {}},
    domain: options.domain,
    step: options.step,
    derivativeTolerance: options.derivativeTolerance
  });
  return {
    domain: analysis.domain,
    contains: analysis.contains.bind(analysis),
    jacobian: analysis.jacobian.bind(analysis),
    factors: analysis.factors.bind(analysis)
  };
}

/** Match the enforced stored-axis convention of both prepared transforms. */
function writeGeographicInput(
  longitude: number,
  latitude: number,
  height: number,
  crs: NormalizedCRS,
  point: number[]
): void {
  const axis = crs.storedAxis ?? crs.axis;
  for (let i = 0; i < 3; i++) {
    const direction = axis[i];
    const value =
      direction === 'e' || direction === 'w'
        ? longitude / crs.angularUnit
        : direction === 'n' || direction === 's'
          ? latitude / crs.angularUnit
          : height / crs.verticalUnit;
    const signed = direction === 'w' || direction === 's' || direction === 'd' ? -value : value;
    point[i] = signed;
  }
}

/** Normalize declared target axes/units to physical EN, including axes stored in the third slot. */
function readProjectedOutput(
  input: readonly number[],
  crs: NormalizedCRS,
  result: ProjectionPoint
): void {
  const axis = crs.storedAxis ?? crs.axis;
  for (let i = 0; i < 3; i++) {
    const value = input[i]! * crs.toMeter;
    switch (axis[i]) {
      case 'e':
        result.x = value;
        break;
      case 'w':
        result.x = -value;
        break;
      case 'n':
        result.y = value;
        break;
      case 's':
        result.y = -value;
        break;
    }
  }
}
