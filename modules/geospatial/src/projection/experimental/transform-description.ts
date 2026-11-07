// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {NormalizedCRS} from './crs/types';
import type {
  ProjectionAlgorithmIdentity,
  ProjectionCRSDescription,
  ProjectionDirectionDescription,
  ProjectionTransformDescription
} from '../transform-description';

/** Snapshot only data; grid functions and plugin objects never escape through metadata. */
export function describeCRS(
  crs: NormalizedCRS & {algorithm?: ProjectionAlgorithmIdentity}
): ProjectionCRSDescription {
  const ellipsoid = Object.freeze({...crs.ellipsoid});
  return Object.freeze({
    kind: crs.kind,
    projection: crs.projection,
    parameters: Object.freeze(
      Object.fromEntries(
        Object.entries(crs.parameters).map(([name, value]) => [name, value ?? null])
      )
    ),
    ellipsoid,
    datum: Object.freeze({
      ellipsoid: Object.freeze({...crs.datum.ellipsoid}),
      towgs84: crs.datum.towgs84 && Object.freeze([...crs.datum.towgs84]),
      grids:
        crs.datum.grids &&
        Object.freeze(
          crs.datum.grids.map(reference =>
            Object.freeze({
              name: reference.name,
              optional: reference.optional,
              loaded: Boolean(reference.grid)
            })
          )
        )
    }),
    angularUnit: crs.angularUnit,
    toMeter: crs.toMeter,
    verticalUnit: crs.verticalUnit,
    primeMeridian: crs.primeMeridian,
    axis: crs.axis,
    storedAxis: crs.storedAxis,
    longitudeWrap: crs.longitudeWrap,
    areaOfUse: crs.areaOfUse && Object.freeze([...crs.areaOfUse] as const),
    lossy: crs.lossy,
    algorithm: crs.algorithm && Object.freeze({...crs.algorithm})
  });
}

export function describeTransform(
  source: ProjectionCRSDescription,
  target: ProjectionCRSDescription,
  forward: ProjectionDirectionDescription,
  inverse: ProjectionDirectionDescription
): ProjectionTransformDescription {
  const opaqueReasons: Array<ProjectionTransformDescription['opaqueReasons'][number]> = [];
  if (!source.algorithm) opaqueReasons.push('source-algorithm');
  if (!target.algorithm) opaqueReasons.push('target-algorithm');
  // Names do not identify resource contents or custom sampling behavior.
  if (
    source.datum.grids ||
    target.datum.grids ||
    source.parameters['geoidgrids'] ||
    target.parameters['geoidgrids']
  )
    opaqueReasons.push('grid-resource');
  return Object.freeze({
    version: 1,
    source,
    target,
    forward,
    inverse,
    lossy: source.lossy || target.lossy,
    complete: opaqueReasons.length === 0,
    opaqueReasons: Object.freeze(opaqueReasons)
  });
}
