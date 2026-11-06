// math.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import proj4 from 'proj4';
import {createCRSDescriptor} from '@math.gl/geospatial/crs';
import type {CRSConversion, CRSCoordinate, CRSOutput} from '@math.gl/geospatial/crs';

const radius = 6371000;
export const equalCylindricalDefinition = '+proj=eqc +R=6371000 +lat_ts=0 +units=m';

/** A deliberately bounded example: geographic degrees to spherical equidistant cylindrical.
 * Only XY is projected; ellipsoidal height and trailing measures are preserved.
 * It supplies no datum, vertical or epoch operation and no inferred rendering-scale policy.
 */
export function createProj4CRSDescriptor() {
  const pair = proj4('EPSG:4326', equalCylindricalDefinition);
  return createCRSDescriptor({
    metadata: {
      coordinateFrame: 'projected',
      projection: 'eqc',
      parameters: {proj: 'eqc', R: String(radius), lat_ts: '0', units: 'm'},
      ellipsoid: {semiMajorAxis: radius, semiMinorAxis: radius},
      axis: 'enu',
      xUnit: {name: 'meters', metersPerUnit: 1},
      yUnit: {name: 'meters', metersPerUnit: 1},
      zUnit: {name: 'meters', metersPerUnit: 1},
      lossy: false
    },
    renderingBounds: [
      [-Math.PI * radius, (-Math.PI * radius) / 2, 0],
      [Math.PI * radius, (Math.PI * radius) / 2, 0]
    ],
    renderingScale: () => null,
    converter: {
      WGS84: {
        from: conversion(xy => pair.forward(xy)),
        to: conversion(xy => pair.inverse(xy)),
        // This example does not wrap coordinates. A renderer must supply its own seam policy.
        normalize: conversion(xy => xy)
      }
    }
  });
}

function conversion(operation: (xy: number[]) => number[]): CRSConversion {
  function convert(input: CRSCoordinate): number[];
  function convert<T extends CRSOutput>(input: CRSCoordinate, output: T): T;
  function convert(input: CRSCoordinate, output?: CRSOutput): CRSOutput {
    if (input.length < 2 || !Array.from(input).slice(0, 3).every(Number.isFinite)) {
      throw new Error('Expected finite XY or XYZ coordinates');
    }
    if (output !== undefined && output.length < input.length)
      throw new Error('Insufficient output capacity');
    const xy = operation([input[0], input[1]]);
    if (xy.length < 2 || !xy.slice(0, 2).every(Number.isFinite))
      throw new Error('Outside projection domain');
    const result = Array.from(input);
    result[0] = xy[0];
    result[1] = xy[1];
    if (output === undefined) return result;
    if (
      output instanceof Float32Array &&
      result.some(value => Number.isFinite(value) && !Number.isFinite(Math.fround(value)))
    ) {
      throw new Error('Float32 overflow');
    }
    for (let i = 0; i < result.length; i++) output[i] = result[i];
    return output;
  }
  return convert;
}
